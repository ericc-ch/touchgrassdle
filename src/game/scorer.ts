import { Data, Effect, Option } from "effect"
import {
  AutoConfig,
  AutoProcessor,
  EmbeddingGemma2Model,
  RawImage,
} from "@huggingface/transformers"
import { e2eStubScorer, readE2EScorerMode } from "./e2e-scorer.ts"
import { createModelProgress, SCORER_TOTALS } from "./model-progress.ts"
import { parseEmbedding, type Embedding } from "./scoring.ts"

export const MODEL_ID = "onnx-community/embeddinggemma-2-ONNX"

export class ModelLoadError extends Data.TaggedError("ModelLoadError")<{
  readonly message: string
}> {}

export class EmbedError extends Data.TaggedError("EmbedError")<{
  readonly message: string
}> {}

/** One file's bytes-loaded report from transformers.js. */
export interface ModelFileReport {
  readonly file: string
  readonly loaded: number
}

export interface LoadedScorer {
  readonly embedImage: (photo: Blob) => Effect.Effect<Embedding, EmbedError>
  readonly embedText: (text: string) => Effect.Effect<Embedding, EmbedError>
}

const failLoad = (cause: unknown): ModelLoadError =>
  new ModelLoadError({ message: cause instanceof Error ? cause.message : String(cause) })

const failEmbed = (cause: unknown): EmbedError =>
  new EmbedError({ message: cause instanceof Error ? cause.message : String(cause) })

interface EmbeddingOutput {
  readonly sentence_embedding: { tolist(): unknown }
}

const asEmbeddingOutput = (value: unknown): EmbeddingOutput => value as EmbeddingOutput

/** Lifecycle of the shared scorer load. */
export type ScorerStatus = "loading-model" | "ready" | "model-error"

export interface ScorerSnapshot {
  readonly status: ScorerStatus
  readonly scorer: LoadedScorer | null
  readonly fraction: number | null
  readonly error: string | null
}

let snapshot: ScorerSnapshot = {
  status: "loading-model",
  scorer: null,
  fraction: null,
  error: null,
}
const snapshotListeners = new Set<() => void>()
let loadStarted = false
const progress = createModelProgress()
let emittedPercent = -1
let tickTimer: ReturnType<typeof setInterval> | null = null
let lastTickAt = 0

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

/** Emit at most once per whole percent: stable label, fewer renders. */
function emitProgress(fraction: number): void {
  const percent = Math.round(fraction * 100)
  if (percent <= emittedPercent) {
    return
  }
  emittedPercent = percent
  emit({ ...snapshot, fraction })
}

function reportProgress(update: ModelFileReport): void {
  if (snapshot.status !== "loading-model") {
    return
  }
  progress.report(update.file, update.loaded)
  emitProgress(progress.value())
}

/**
 * The bar's creep toward the cap, on a 500ms tick. Real byte progress is a
 * lower bound; the creep keeps the bar visibly moving through network stalls
 * and the silent session compile at the end, like a classic installer bar.
 * It approaches the cap asymptotically and never falls.
 */
function startTicking(): void {
  if (tickTimer !== null) {
    return
  }
  lastTickAt = performance.now()
  tickTimer = setInterval(() => {
    const now = performance.now()
    // Clamp the step so a backgrounded tab returning does not jump the bar.
    const deltaSeconds = Math.min((now - lastTickAt) / 1000, 10)
    lastTickAt = now
    if (snapshot.status === "loading-model") {
      emitProgress(progress.tick(deltaSeconds))
    }
  }, 500)
}

function stopTicking(): void {
  if (tickTimer === null) {
    return
  }
  clearInterval(tickTimer)
  tickTimer = null
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
  startTicking()
  void Effect.runPromise(loadScorer(reportProgress)).then(
    (loaded) => {
      loadStarted = false
      stopTicking()
      emit({ ...snapshot, status: "ready", scorer: loaded, error: null })
    },
    (cause: unknown) => {
      loadStarted = false
      stopTicking()
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
  emittedPercent = -1
  if (snapshot.status !== "model-error") {
    return
  }
  emit({
    status: "loading-model",
    scorer: null,
    fraction: null,
    error: null,
  })
  ensureScorer()
}

const progressCallback = (onProgress: (update: ModelFileReport) => void) => (update: unknown) => {
  if (typeof update !== "object" || update === null) {
    return
  }
  const record = update as Record<string, unknown>
  if (
    record["status"] === "progress" &&
    typeof record["file"] === "string" &&
    typeof record["loaded"] === "number"
  ) {
    onProgress({ file: record["file"], loaded: record["loaded"] })
  }
}

/**
 * Load the on-device EmbeddingGemma 2 encoders plus the multimodal processor.
 * One model embeds photos and today's prompt query into a single vector
 * space, so cosine scoring just works. The audio encoder is never loaded.
 * Prefers WebGPU when an adapter exists, otherwise goes straight to WASM.
 * (The fallback must be chosen up front: transformers chains session
 * creation on one shared promise, so a failed first attempt poisons
 * any later retry in the same page.)
 */
export const loadScorer = Effect.fn("loadScorer")(function* (
  onProgress: (update: ModelFileReport) => void,
): Effect.fn.Return<LoadedScorer, ModelLoadError> {
  const e2e = readE2EScorerMode()
  if (e2e === "fail") {
    return yield* new ModelLoadError({ message: "e2e forced scorer failure" })
  }
  if (e2e !== null) {
    return e2eStubScorer(e2e)
  }

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
  // The size of the whole download is known before the first byte moves, so
  // the bar can count the tokenizer phase (about a tenth of the WebGPU bytes)
  // too.
  progress.begin(SCORER_TOTALS[device])

  const config = yield* Effect.tryPromise({
    try: () => AutoConfig.from_pretrained(MODEL_ID),
    catch: failLoad,
  })
  // The game never scores audio: dropping the encoder keeps it off the
  // first-load download entirely. The base config type hides model-specific
  // keys, hence the narrow cast.
  ;(config as unknown as { audio_config: unknown }).audio_config = null

  const processor = yield* Effect.tryPromise({
    try: () =>
      AutoProcessor.from_pretrained(MODEL_ID, {
        progress_callback: progressCallback(onProgress),
      }),
    catch: failLoad,
  })
  // Block-quantized weights (q4f16/q4/quantized) need GatherBlockQuantized
  // + MatMulNBits kernels that the WASM CPU build does not ship (proven by
  // an on-device "Kernel not found" failure). WASM therefore loads fp16:
  // standard + fused norm/attention/rope ops only, at ~3x the bytes.
  const dtype = device === "webgpu" ? "q4f16" : "fp16"

  const model = yield* Effect.tryPromise({
    try: () =>
      EmbeddingGemma2Model.from_pretrained(MODEL_ID, {
        dtype,
        device,
        config,
        progress_callback: progressCallback(onProgress),
      }),
    catch: failLoad,
  })

  const sentenceVector = (
    output: EmbeddingOutput,
    message: string,
  ): Effect.Effect<Embedding, EmbedError> =>
    Effect.gen(function* () {
      const rows = output.sentence_embedding.tolist() as ReadonlyArray<unknown>
      const first = rows[0]
      const parsed = parseEmbedding(first)
      if (Option.isNone(parsed)) {
        return yield* new EmbedError({ message })
      }
      return parsed.value
    })

  const embedImage = (photo: Blob): Effect.Effect<Embedding, EmbedError> =>
    Effect.gen(function* () {
      const image = yield* Effect.tryPromise({
        try: () => RawImage.read(photo),
        catch: failEmbed,
      })
      const inputs = yield* Effect.tryPromise({
        try: () => processor(null, [image]),
        catch: failEmbed,
      })
      const output = asEmbeddingOutput(
        yield* Effect.tryPromise({
          try: () => model(inputs),
          catch: failEmbed,
        }),
      )
      return yield* sentenceVector(output, "photo encoder returned an unusable embedding")
    })

  const embedText = (text: string): Effect.Effect<Embedding, EmbedError> =>
    Effect.gen(function* () {
      const inputs = yield* Effect.tryPromise({
        try: () => processor(text),
        catch: failEmbed,
      })
      const output = asEmbeddingOutput(
        yield* Effect.tryPromise({
          try: () => model(inputs),
          catch: failEmbed,
        }),
      )
      return yield* sentenceVector(output, "prompt encoder returned an unusable embedding")
    })

  return { embedImage, embedText }
})
