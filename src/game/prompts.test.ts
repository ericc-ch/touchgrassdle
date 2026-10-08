import { describe, expect, it } from "vitest"
import { FIRST_DAY_NUMBER, PROMPTS, promptFor, promptIndexFor, shareDayNumber } from "./prompts.ts"

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
