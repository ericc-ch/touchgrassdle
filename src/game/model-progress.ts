/**
 * Aggregates transformers.js download reports into one honest bar value.
 *
 * transformers.js reports each file on its own scale: `progress` goes 0–100%
 * of that single file. On a cold load several files move at once — two tiny
 * `.onnx` wrappers next to the big `.onnx_data` weights — so waiting on the
 * furthest-along file shows 99% as soon as any wrapper finishes and then
 * freezes. This module sums loaded bytes across files instead and divides by
 * the known total for the device.
 *
 * On top of the byte math, the displayed value creeps toward the cap with a
 * fixed time constant. The bar keeps moving through network stalls and the
 * silent session compile at the end, like a classic installer bar. It never
 * falls, and never reaches 100%: the ready state ends the story, not this
 * math.
 */

/**
 * Bytes a full cold load fetches per device, summed from the model repo file
 * listing (tokenizer/config files + both encoder weight sets). Tiny per-file
 * fetches like `config.json` are ignored (~5KB of noise). If the upstream
 * repo ever changes, the bar can reach the cap early or late — never backwards.
 */
export const SCORER_TOTALS: Readonly<Record<"webgpu" | "wasm", number>> = {
  webgpu:
    32_170_510 + // tokenizer.json
    1_599 + // tokenizer_config.json
    560 + // preprocessor_config.json
    1_788 + // processor_config.json
    495_298 + // onnx/model_q4f16.onnx (session wrapper)
    156_862_464 + // onnx/model_q4f16.onnx_data (text weights)
    150_693 + // onnx/vision_encoder_q4f16.onnx (session wrapper)
    97_614_336, // onnx/vision_encoder_q4f16.onnx_data (vision weights)
  wasm:
    32_170_510 +
    1_599 +
    560 +
    1_788 +
    425_780 + // onnx/model_fp16.onnx
    542_085_120 + // onnx/model_fp16.onnx_data
    112_253 + // onnx/vision_encoder_fp16.onnx
    335_513_088, // onnx/vision_encoder_fp16.onnx_data
}

/** The bar never shows a full 100%: the ready state flips the UI instead. */
export const PROGRESS_CAP = 0.99

/** Seconds for the creep's gap to the cap to shrink by 1/e while stalled. */
const CREEP_TAU_SECONDS = 600

export interface ModelProgress {
  /** Start a fresh aggregation of `totalBytes` expected download. */
  readonly begin: (totalBytes: number) => void
  /** Record one file's bytes-loaded report. Monotonic per file. */
  readonly report: (file: string, loaded: number) => void
  /** Advance the creep by `deltaSeconds` and return the displayed fraction. */
  readonly tick: (deltaSeconds: number) => number
  /** The displayed fraction right now. */
  readonly value: () => number
}

export function createModelProgress(): ModelProgress {
  let totalBytes = 0
  let loadedByFile = new Map<string, number>()
  let sumLoaded = 0
  let creep = 0

  const floor = (): number => (totalBytes > 0 ? Math.min(PROGRESS_CAP, sumLoaded / totalBytes) : 0)
  const value = (): number => Math.max(creep, floor())

  return {
    begin(nextTotal) {
      totalBytes = nextTotal
      loadedByFile = new Map()
      sumLoaded = 0
      creep = 0
    },
    report(file, loaded) {
      if (!Number.isFinite(loaded) || loaded < 0) {
        return
      }
      const previous = loadedByFile.get(file) ?? 0
      if (loaded <= previous) {
        return
      }
      loadedByFile.set(file, loaded)
      sumLoaded += loaded - previous
    },
    tick(deltaSeconds) {
      if (deltaSeconds > 0) {
        creep = PROGRESS_CAP - (PROGRESS_CAP - creep) * Math.exp(-deltaSeconds / CREEP_TAU_SECONDS)
      }
      return value()
    },
    value,
  }
}
