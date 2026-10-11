import { describe, expect, it } from "vitest"
import { createModelProgress, PROGRESS_CAP, SCORER_TOTALS } from "./model-progress.ts"

const total = SCORER_TOTALS.webgpu

describe("SCORER_TOTALS", () => {
  it("matches the model repo file sizes", () => {
    expect(SCORER_TOTALS.webgpu).toBe(287_297_248)
    expect(SCORER_TOTALS.wasm).toBe(910_310_698)
  })
})

describe("byte aggregation", () => {
  it("keeps the bar low when only the tiny wrappers finish", () => {
    const progress = createModelProgress()
    progress.begin(total)
    // Both session wrappers complete; the 157MB weight file has barely begun.
    progress.report("onnx/model_q4f16.onnx", 495_298)
    progress.report("onnx/vision_encoder_q4f16.onnx", 150_693)
    progress.report("onnx/model_q4f16.onnx_data", 15_000_000)
    expect(progress.value()).toBeGreaterThan(0.05)
    expect(progress.value()).toBeLessThan(0.06)
  })

  it("counts the tokenizer phase", () => {
    const progress = createModelProgress()
    progress.begin(total)
    progress.report("tokenizer.json", 32_170_510)
    expect(progress.value()).toBeCloseTo(0.112, 3)
  })

  it("keeps each file's report monotonic", () => {
    const progress = createModelProgress()
    progress.begin(total)
    progress.report("a.onnx_data", 500)
    progress.report("a.onnx_data", 200)
    expect(progress.value()).toBeCloseTo(500 / total, 6)
    progress.report("a.onnx_data", 800)
    expect(progress.value()).toBeCloseTo(800 / total, 6)
  })

  it("caps the floor below 100%", () => {
    const progress = createModelProgress()
    progress.begin(total)
    progress.report("everything", total * 2)
    expect(progress.value()).toBe(PROGRESS_CAP)
  })

  it("ignores junk reports", () => {
    const progress = createModelProgress()
    progress.begin(total)
    progress.report("a", Number.NaN)
    progress.report("b", -5)
    progress.report("c", Number.POSITIVE_INFINITY)
    expect(progress.value()).toBe(0)
  })
})

describe("creep illusion", () => {
  it("always moves while ticking, even with zero real progress", () => {
    const progress = createModelProgress()
    progress.begin(total)
    const first = progress.tick(1)
    const second = progress.tick(1)
    expect(first).toBeGreaterThan(0)
    expect(second).toBeGreaterThan(first)
  })

  it("approaches the cap without ever reaching it", () => {
    const progress = createModelProgress()
    progress.begin(total)
    for (let second = 0; second < 10_000; second++) {
      progress.tick(1)
    }
    expect(progress.value()).toBeLessThan(PROGRESS_CAP)
    expect(progress.value()).toBeGreaterThan(PROGRESS_CAP - 0.001)
  })

  it("follows the time-constant curve", () => {
    const progress = createModelProgress()
    progress.begin(total)
    expect(progress.tick(600)).toBeCloseTo(PROGRESS_CAP * (1 - Math.exp(-1)), 6)
    expect(progress.tick(600)).toBeCloseTo(PROGRESS_CAP * (1 - Math.exp(-2)), 6)
  })

  it("never falls, and real progress stays a lower bound", () => {
    const progress = createModelProgress()
    progress.begin(total)
    for (let second = 0; second < 300; second++) {
      progress.tick(1)
    }
    const creeped = progress.value()
    progress.report("onnx/model_q4f16.onnx_data", 1_000_000)
    expect(progress.value()).toBe(creeped)
    progress.report("onnx/model_q4f16.onnx_data", total)
    expect(progress.value()).toBe(PROGRESS_CAP)
  })

  it("resets on begin, so retries start from zero", () => {
    const progress = createModelProgress()
    progress.begin(total)
    progress.tick(600)
    progress.report("onnx/model_q4f16.onnx_data", 1_000_000)
    progress.begin(total)
    expect(progress.value()).toBe(0)
  })
})
