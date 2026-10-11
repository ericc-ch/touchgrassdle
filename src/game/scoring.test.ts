import { describe, expect, it } from "vitest"
import { Option } from "effect"
import {
  cosineSimilarity,
  nextFraction,
  parseEmbedding,
  temperatureFor,
  toScore,
} from "./scoring.ts"

describe("toScore", () => {
  it("maps the logistic center to 50", () => {
    expect(toScore(0.6578)).toBe(50)
  })

  it("rises ~23 points per width above center", () => {
    expect(toScore(0.6578 + 0.0338)).toBe(73)
    expect(toScore(0.6578 + 2 * 0.0338)).toBe(88)
  })

  it("clamps pathological inputs", () => {
    expect(toScore(Number.NaN)).toBe(0)
    expect(toScore(-10)).toBe(0)
    expect(toScore(10)).toBe(100)
  })
})

describe("nextFraction", () => {
  it("rises with higher fractions and never falls back", () => {
    expect(nextFraction(null, 0.2)).toBe(0.2)
    expect(nextFraction(0.2, 0.5)).toBe(0.5)
    expect(nextFraction(0.5, 0.2)).toBe(0.5)
    expect(nextFraction(0.5, 0.5)).toBe(0.5)
  })

  it("clamps to 0..1 and treats garbage as 0", () => {
    expect(nextFraction(null, 2)).toBe(1)
    expect(nextFraction(null, -1)).toBe(0)
    expect(nextFraction(null, Number.NaN)).toBe(0)
    expect(nextFraction(0.9, Number.NaN)).toBe(0.9)
  })
})

describe("cosineSimilarity", () => {
  it("scores identical vectors 1 and orthogonal vectors 0", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1)
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0)
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1)
  })

  it("returns 0 for empty or mismatched vectors", () => {
    expect(cosineSimilarity([], [])).toBe(0)
    expect(cosineSimilarity([1], [1, 2])).toBe(0)
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0)
  })
})

describe("parseEmbedding", () => {
  it("accepts finite vectors, rejects the rest", () => {
    expect(Option.isSome(parseEmbedding([0.1, -0.2]))).toBe(true)
    expect(Option.isNone(parseEmbedding([]))).toBe(true)
    expect(Option.isNone(parseEmbedding([Number.NaN]))).toBe(true)
    expect(Option.isNone(parseEmbedding("nope"))).toBe(true)
  })
})

describe("temperatureFor", () => {
  it("bands scores cold to hot with blazing as the solve band", () => {
    expect(temperatureFor(0)).toBe("frozen")
    expect(temperatureFor(29)).toBe("frozen")
    expect(temperatureFor(30)).toBe("cool")
    expect(temperatureFor(49)).toBe("cool")
    expect(temperatureFor(50)).toBe("warm")
    expect(temperatureFor(64)).toBe("warm")
    expect(temperatureFor(65)).toBe("hot")
    expect(temperatureFor(79)).toBe("hot")
    expect(temperatureFor(80)).toBe("blazing")
    expect(temperatureFor(100)).toBe("blazing")
  })
})
