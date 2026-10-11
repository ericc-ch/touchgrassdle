import { Data, Effect, Option } from "effect"
import {
  AutoProcessor,
  AutoTokenizer,
  RawImage,
  SiglipTextModel,
  SiglipVisionModel,
} from "@huggingface/transformers"
import { e2eStubScorer, readE2EScorerMode } from "./e2e-scorer.ts"
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
  readonly embedText: (text: string) => Effect.Effect<Embedding, EmbedError>
}

const failLoad = (cause: unknown): ModelLoadError =>
  new ModelLoadError({ message: cause instanceof Error ? cause.message : String(cause) })

const failEmbed = (cause: unknown): EmbedError =>
  new EmbedError({ message: cause instanceof Error ? cause.message : String(cause) })

interface VisionOutput {
  readonly pooler_output: { tolist(): unknown }
}

interface TextOutput {
  readonly pooler_output: { tolist(): unknown }
}

const asVisionOutput = (value: unknown): VisionOutput => value as VisionOutput
const asTextOutput = (value: unknown): TextOutput => value as TextOutput

/** Lifecycle of the shared scorer load. Session-level prompt errors live elsewhere. */
export type ScorerStatus = "loading-model" | "ready" | "model-error"

export interface ScorerSnapshot {
  readonly status: ScorerStatus
  readonly scorer: LoadedScorer | null
  readonly file: string | null
  readonly fraction: number | null
  readonly error: string | null
}

let snapshot: ScorerSnapshot = {
  status: "loading-model",
  scorer: null,
  file: null,
  fraction: null,
  error: null,
}
const snapshotListeners = new Set<() => void>()
let loadStarted = false

function emit(next: ScorerSnapshot): void {
  snapshot = next
  for (const listener of snapshotListeners) {
    listener()
  }
}

export function subscribeScorer(listener: () => void): () => void {
  snapshotListeners.add(listener)
  return () => {
    snapshotListeners.delete(listener)
  }
}

export function getScorerSnapshot(): ScorerSnapshot {
  return snapshot
}

/** Today's puzzle vector, encoded on-device and cached per prompt id. */
export interface PromptEmbeddingsSnapshot {
  readonly embeddings: Readonly<Record<string, Embedding>>
  readonly error: string | null
}

let promptSnapshot: PromptEmbeddingsSnapshot = { embeddings: {}, error: null }
const promptListeners = new Set<() => void>()
const promptInflight = new Set<string>()

function emitPrompt(next: PromptEmbeddingsSnapshot): void {
  promptSnapshot = next
  for (const listener of promptListeners) {
    listener()
  }
}

export function subscribePromptEmbeddings(listener: () => void): () => void {
  promptListeners.add(listener)
  return () => {
    promptListeners.delete(listener)
  }
}

export function getPromptEmbeddingsSnapshot(): PromptEmbeddingsSnapshot {
  return promptSnapshot
}

/**
 * Encode one prompt query with the loaded text encoder. Idempotent per id:
 * render calls it freely, but only one encode ever runs per prompt.
 */
export function ensurePromptEmbedding(id: string, query: string): void {
  if (
    typeof window === "undefined" ||
    promptSnapshot.embeddings[id] !== undefined ||
    promptInflight.has(id)
  ) {
    return
  }
  const current = snapshot
  if (current.status !== "ready" || current.scorer === null) {
    return
  }
  const scorer = current.scorer
  promptInflight.add(id)
  void Effect.runPromise(scorer.embedText(query)).then(
    (vector) => {
      promptInflight.delete(id)
      emitPrompt({ embeddings: { ...promptSnapshot.embeddings, [id]: vector }, error: null })
    },
    (cause: unknown) => {
      promptInflight.delete(id)
      emitPrompt({
        embeddings: { ...promptSnapshot.embeddings },
        error: cause instanceof Error ? cause.message : String(cause),
      })
    },
  )
}

function reportProgress(progress: ModelFileProgress): void {
  if (snapshot.status !== "loading-model") {
    return
  }
  emit({ ...snapshot, file: progress.file, fraction: progress.fraction })
}

/**
 * Start the one shared scorer load. Idempotent: remounts and retries call
 * it freely, but only one load ever runs. Replaces load-on-mount effects,
 * which StrictMode double-invokes in dev.
 */
export function ensureScorer(): void {
  if (typeof window === "undefined" || loadStarted || snapshot.status !== "loading-model") {
    return
  }
  loadStarted = true
  void Effect.runPromise(loadScorer(reportProgress)).then(
    (loaded) => {
      loadStarted = false
      emit({ ...snapshot, status: "ready", scorer: loaded, error: null })
    },
    (cause: unknown) => {
      loadStarted = false
      emit({
        ...snapshot,
        status: "model-error",
        error: cause instanceof Error ? cause.message : String(cause),
      })
    },
  )
}

/** Retry after a failure. No-op unless currently errored. */
export function retryScorer(): void {
  if (snapshot.status !== "model-error" && promptSnapshot.error === null) {
    return
  }
  emitPrompt({ embeddings: { ...promptSnapshot.embeddings }, error: null })
  if (snapshot.status !== "model-error") {
    return
  }
  emit({ status: "loading-model", scorer: null, file: null, fraction: null, error: null })
  ensureScorer()
}

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
 * Load the on-device encoders plus the image processor.
 * Prefers WebGPU when an adapter exists, otherwise goes straight to WASM.
 * (The fallback must be chosen up front: transformers chains session
 * creation on one shared promise, so a failed first attempt poisons
 * any later retry in the same page.)
 */
export const loadScorer = Effect.fn("loadScorer")(function* (
  onProgress: (progress: ModelFileProgress) => void,
): Effect.fn.Return<LoadedScorer, ModelLoadError> {
  const e2e = readE2EScorerMode()
  if (e2e === "fail") {
    return yield* new ModelLoadError({ message: "e2e forced scorer failure" })
  }
  if (e2e !== null) {
    return e2eStubScorer(e2e)
  }

  const processor = yield* Effect.tryPromise({
    try: () => AutoProcessor.from_pretrained(MODEL_ID),
    catch: failLoad,
  })

  const tokenizer = yield* Effect.tryPromise({
    try: () => AutoTokenizer.from_pretrained(MODEL_ID),
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

  const adapter = yield* Effect.tryPromise({
    try: async () => {
      const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
      if (gpu === undefined) {
        return null
      }
      try {
        return await gpu.requestAdapter()
      } catch {
        return null
      }
    },
    catch: failLoad,
  })
  const device = adapter === null ? "wasm" : "webgpu"
  const vision = yield* loadVision(device)

  const textModel = yield* Effect.tryPromise({
    try: () =>
      SiglipTextModel.from_pretrained(MODEL_ID, {
        dtype: "q4f16",
        device,
        progress_callback: progressCallback(onProgress),
      }),
    catch: failLoad,
  })

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

  const embedText = (text: string): Effect.Effect<Embedding, EmbedError> =>
    Effect.gen(function* () {
      const inputs = yield* Effect.try({
        try: () =>
          tokenizer([text], {
            padding: "max_length",
            truncation: true,
            max_length: 64,
          }),
        catch: failEmbed,
      })
      const output = asTextOutput(
        yield* Effect.tryPromise({
          try: () => textModel(inputs),
          catch: failEmbed,
        }),
      )
      const rows = output.pooler_output.tolist() as ReadonlyArray<unknown>
      const first = rows[0]
      const parsed = parseEmbedding(first)
      if (Option.isNone(parsed)) {
        return yield* new EmbedError({ message: "text model returned an unusable embedding" })
      }
      return parsed.value
    })

  return { embedImage, embedText }
})
