/**
 * R2 bucket plus deploy-time upload for build outputs that exceed
 * Cloudflare's 25 MB Worker-asset limit (the threaded ONNX Runtime
 * wasm). `alchemy/stage-large-assets.ts` moves those files from `dist/`
 * to `dist-r2/` during the site build; this Action uploads `dist-r2/`
 * to the bucket under the same relative paths, and the edge worker
 * serves `*.wasm` requests from the bucket.
 *
 * Ordering: the upload takes the site URL as input so it runs after
 * the site deploys and reads freshly built files. It re-runs only when
 * the ONNX Runtime sources change; dist keys embed the content hash,
 * so unchanged content keeps working under its existing key. Old keys
 * are never deleted: the content hash makes rollback safe.
 */
import { createHash } from "node:crypto"
import { readdir, readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { Action } from "alchemy"
import * as Cloudflare from "alchemy/Cloudflare"
import { Data, Effect } from "effect"

/** R2 bucket holding the oversize wasm files, served same-origin by the edge worker. */
export const WasmBucket = Cloudflare.R2.Bucket("Wasm")

export class LargeAssetError extends Data.TaggedError("LargeAssetError")<{
  readonly message: string
}> {}

/** Input for {@link UploadLargeAssets}. `siteUrl` orders the upload after the site deploy. */
export interface UploadLargeAssetsInput {
  readonly wasmSource: string
  readonly siteUrl: string | undefined
}

/** Output of {@link UploadLargeAssets}: the R2 keys now serving traffic. */
export interface UploadLargeAssetsOutput {
  readonly keys: Array<string>
  readonly wasmSource: string
}

const stagingDir = join(import.meta.dirname, "..", "dist-r2")

async function collectFiles(dir: string, prefix: string, out: Array<string>): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await collectFiles(join(dir, entry.name), `${prefix}${entry.name}/`, out)
    } else if (entry.isFile()) {
      out.push(`${prefix}${entry.name}`)
    }
  }
}

/**
 * Upload the staged oversize assets to {@link WasmBucket}.
 *
 * @example
 * ```ts
 * const uploaded = yield* UploadLargeAssets({ wasmSource, siteUrl: site.url })
 * ```
 */
export const UploadLargeAssets = Action(
  "UploadLargeAssets",
  Effect.gen(function* () {
    const r2 = yield* Cloudflare.R2.WriteBucket(WasmBucket)
    return Effect.fn("UploadLargeAssets")(function* (input: UploadLargeAssetsInput) {
      const keys: Array<string> = yield* Effect.tryPromise({
        try: async () => {
          const found: Array<string> = []
          await collectFiles(stagingDir, "", found)
          return found
        },
        catch: (cause) =>
          new LargeAssetError({ message: `cannot list ${stagingDir}: ${String(cause)}` }),
      })
      for (const key of keys) {
        const bytes = yield* Effect.tryPromise({
          try: () => readFile(join(stagingDir, key)),
          catch: (cause) =>
            new LargeAssetError({ message: `cannot read staged file ${key}: ${String(cause)}` }),
        })
        yield* r2.put(key, bytes)
      }
      return { keys, wasmSource: input.wasmSource }
    })
  }).pipe(Effect.provide(Cloudflare.R2.WriteBucketLocal)),
)

/**
 * Hash every wasm file shipped by onnxruntime-web. Changes exactly when
 * the runtime content changes, so the upload re-runs only then. Dies
 * loudly when the package cannot be found: without it the upload trigger
 * cannot be computed.
 *
 * @example
 * ```ts
 * const wasmSource = yield* readWasmSourceHash
 * ```
 */
export const readWasmSourceHash: Effect.Effect<string, never> = Effect.orDie(
  Effect.tryPromise({
    try: async () => {
      const transformersEntry = createRequire(import.meta.url).resolve("@huggingface/transformers")
      const ortEntry = createRequire(transformersEntry).resolve("onnxruntime-web")
      let dir = dirname(ortEntry)
      for (let depth = 0; depth < 20; depth += 1) {
        let raw: unknown = null
        try {
          raw = JSON.parse(await readFile(join(dir, "package.json"), "utf8"))
        } catch {
          raw = null
        }
        if (
          typeof raw === "object" &&
          raw !== null &&
          "name" in raw &&
          raw.name === "onnxruntime-web"
        ) {
          const dist = join(dir, "dist")
          const names = (await readdir(dist)).filter((name) => name.endsWith(".wasm")).sort()
          if (names.length === 0) {
            throw new Error(`no wasm files in ${dist}`)
          }
          const hash = createHash("sha256")
          for (const name of names) {
            hash.update(name)
            hash.update(await readFile(join(dist, name)))
          }
          return hash.digest("hex")
        }
        const parent = dirname(dir)
        if (parent === dir) {
          break
        }
        dir = parent
      }
      throw new Error("onnxruntime-web package root not found")
    },
    catch: (cause) =>
      new LargeAssetError({ message: `cannot hash onnxruntime-web wasm: ${String(cause)}` }),
  }),
)
