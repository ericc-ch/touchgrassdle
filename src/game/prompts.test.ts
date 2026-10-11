import { describe, expect, it } from "vitest"
import {
  clueForAttempt,
  FIRST_DAY_NUMBER,
  PROMPTS,
  promptFor,
  promptIndexFor,
  shareDayNumber,
} from "./prompts.ts"

const day = (iso: string) => new Date(`${iso}T12:00:00Z`)

describe("rotation", () => {
  it("starts at #1 with the first prompt on launch day", () => {
    expect(shareDayNumber(day("2026-10-09"))).toBe(1)
    expect(promptIndexFor(day("2026-10-09"))).toBe(0)
    expect(promptFor(day("2026-10-09")).prompt.id).toBe("exit-sign")
  })

  it("advances one prompt per day and wraps", () => {
    expect(promptIndexFor(day("2026-10-10"))).toBe(1)
    expect(shareDayNumber(day("2026-10-10"))).toBe(2)
    expect(promptIndexFor(day("2026-10-23"))).toBe(0)
  })

  it("keys days by UTC date", () => {
    expect(promptFor(day("2026-10-09")).dateKey).toBe("2026-10-09")
  })

  it("derives the first-day constant consistently", () => {
    expect(FIRST_DAY_NUMBER).toBe(promptIndexFor(day("2026-10-09")) + FIRST_DAY_NUMBER)
  })
})

describe("clueForAttempt", () => {
  const bicycle = PROMPTS.find((prompt) => prompt.id === "bicycle")
  if (bicycle === undefined) {
    throw new Error("bicycle prompt missing")
  }

  it("sharpens one band per attempt from cool to blazing", () => {
    expect(clueForAttempt(bicycle, 0)).toBe(bicycle.clues.cool)
    expect(clueForAttempt(bicycle, 1)).toBe(bicycle.clues.warm)
    expect(clueForAttempt(bicycle, 2)).toBe(bicycle.clues.hot)
    expect(clueForAttempt(bicycle, 3)).toBe(bicycle.clues.blazing)
  })

  it("holds blazing for late attempts and never repeats the starting hint", () => {
    expect(clueForAttempt(bicycle, 4)).toBe(bicycle.clues.blazing)
    expect(clueForAttempt(bicycle, 5)).toBe(bicycle.clues.blazing)
    for (let attempt = 0; attempt < 6; attempt++) {
      expect(clueForAttempt(bicycle, attempt)).not.toBe(bicycle.clues.frozen)
    }
  })
})

describe("prompt bank", () => {
  it("covers every temperature band for every prompt", () => {
    for (const prompt of PROMPTS) {
      expect(prompt.query.startsWith("a photo of ")).toBe(true)
      for (const band of ["frozen", "cool", "warm", "hot", "blazing"] as const) {
        expect(prompt.clues[band].length).toBeGreaterThan(0)
      }
    }
  })
})
