/**
 * Move every `dist/assets/*.wasm` file to `dist-r2/assets/`, preserving
 * names. Cloudflare caps Worker static assets at 25 MB per file and the
 * threaded ONNX Runtime build exceeds it; the deploy uploads `dist-r2/`
 * to R2 and the edge worker serves those paths from the bucket instead.
 *
 * Run: `node ./alchemy/stage-large-assets.ts` (after `pnpm build`).
 */
import { mkdir, readdir, rename } from "node:fs/promises"
import { join } from "node:path"

const root = join(import.meta.dirname, "..")
const sourceDir = join(root, "dist", "assets")
const stagingDir = join(root, "dist-r2", "assets")

async function main(): Promise<void> {
  const entries = await readdir(sourceDir)
  const wasm = entries.filter((name) => name.endsWith(".wasm"))
  await mkdir(stagingDir, { recursive: true })
  for (const name of wasm) {
    await rename(join(sourceDir, name), join(stagingDir, name))
    console.log(`staged dist-r2/assets/${name}`)
  }
  if (wasm.length === 0) {
    console.log("no wasm files in dist/assets; nothing staged")
  }
}

main().catch((cause: unknown) => {
  console.error(cause)
  process.exit(1)
})
