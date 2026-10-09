import { Data, Effect, Option } from "effect"
import { AutoProcessor, RawImage, SiglipVisionModel } from "@huggingface/transformers"
import { parseEmbedding, type Embedding } from "./scoring.ts"

export const MODEL_ID = "onnx-community/siglip2-base-patch16-224-ONNX"

export class ModelLoadError extends Data.TaggedError("ModelLoadError")<{
  readonly message: string
}> {}

export class EmbedError extends Data.TaggedError("EmbedError")<{
  readonly message: string
}> {}

export interface ModelFileProgress {
  readonly file: string
  readonly fraction: number
}

export interface LoadedScorer {
  readonly embedImage: (photo: Blob) => Effect.Effect<Embedding, EmbedError>
}

const failLoad = (cause: unknown): ModelLoadError =>
  new ModelLoadError({ message: cause instanceof Error ? cause.message : String(cause) })

const failEmbed = (cause: unknown): EmbedError =>
  new EmbedError({ message: cause instanceof Error ? cause.message : String(cause) })

interface VisionOutput {
  readonly pooler_output: { tolist(): unknown }
}

const asVisionOutput = (value: unknown): VisionOutput => value as VisionOutput

const progressCallback =
  (onProgress: (progress: ModelFileProgress) => void) => (update: unknown) => {
    if (typeof update !== "object" || update === null) {
      return
    }
    const record = update as Record<string, unknown>
    if (
      record["status"] === "progress" &&
      typeof record["file"] === "string" &&
      typeof record["progress"] === "number"
    ) {
      onProgress({ file: record["file"], fraction: record["progress"] / 100 })
    }
  }

/**
 * Load the on-device vision encoder (WebGPU when available, WASM fallback)
 * plus the image processor. Photos never leave the device.
 */
export const loadScorer = Effect.fn("loadScorer")(function* (
  onProgress: (progress: ModelFileProgress) => void,
): Effect.fn.Return<LoadedScorer, ModelLoadError> {
  const processor = yield* Effect.tryPromise({
    try: () => AutoProcessor.from_pretrained(MODEL_ID),
    catch: failLoad,
  })

  const loadVision = (device: "webgpu" | "wasm") =>
    Effect.tryPromise({
      try: () =>
        SiglipVisionModel.from_pretrained(MODEL_ID, {
          dtype: "q4f16",
          device,
          progress_callback: progressCallback(onProgress),
        }),
      catch: failLoad,
    })
  const vision = yield* Effect.catchTag(loadVision("webgpu"), "ModelLoadError", () =>
    loadVision("wasm"),
  )

  const embedImage = (photo: Blob): Effect.Effect<Embedding, EmbedError> =>
    Effect.gen(function* () {
      const image = yield* Effect.tryPromise({
        try: () => RawImage.read(photo),
        catch: failEmbed,
      })
      const inputs = yield* Effect.tryPromise({
        try: () => processor(image),
        catch: failEmbed,
      })
      const output = asVisionOutput(
        yield* Effect.tryPromise({
          try: () => vision(inputs),
          catch: failEmbed,
        }),
      )
      const rows = output.pooler_output.tolist() as ReadonlyArray<unknown>
      const first = rows[0]
      const parsed = parseEmbedding(first)
      if (Option.isNone(parsed)) {
        return yield* new EmbedError({ message: "vision model returned an unusable embedding" })
      }
      return parsed.value
    })

  return { embedImage }
})
