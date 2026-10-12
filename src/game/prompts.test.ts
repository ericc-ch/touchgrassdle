import { describe, expect, it } from "vitest"
import { clueForAttempt, FIRST_DAY_NUMBER, PROMPTS, shareDayNumber, tripleFor } from "./prompts.ts"

const day = (iso: string) => new Date(`${iso}T12:00:00Z`)
const ids = (iso: string) => tripleFor(day(iso)).prompts.map((prompt) => prompt.id)

describe("rotation", () => {
  it("starts at #1 with the first triple on launch day", () => {
    expect(shareDayNumber(day("2026-10-09"))).toBe(1)
    expect(ids("2026-10-09")).toEqual(["exit-sign", "wall-clock", "bicycle"])
  })

  it("advances one fixed triple per day and wraps every ten days", () => {
    expect(ids("2026-10-10")).toEqual(["potted-plant", "flowering-tree", "sleeping-cat"])
    expect(shareDayNumber(day("2026-10-10"))).toBe(2)
    expect(ids("2026-10-19")).toEqual(ids("2026-10-09"))
  })

  it("never shares a prompt between adjacent days", () => {
    for (let offset = 0; offset < 12; offset++) {
      const first = new Date(Date.UTC(2026, 9, 9 + offset, 12))
      const second = new Date(Date.UTC(2026, 9, 10 + offset, 12))
      const a = tripleFor(first).prompts.map((prompt) => prompt.id)
      const b = tripleFor(second).prompts.map((prompt) => prompt.id)
      expect(a).toHaveLength(3)
      expect(new Set([...a, ...b]).size).toBe(6)
    }
  })

  it("keys days by UTC date", () => {
    expect(tripleFor(day("2026-10-09")).dateKey).toBe("2026-10-09")
  })

  it("derives the first-day constant consistently", () => {
    expect(FIRST_DAY_NUMBER).toBe(shareDayNumber(day("2026-10-09")) + FIRST_DAY_NUMBER - 1)
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
  it("holds a multiple of three prompts for fixed daily triples", () => {
    expect(PROMPTS.length).toBe(30)
    expect(PROMPTS.length % 3).toBe(0)
  })

  it("covers every temperature band for every prompt", () => {
    for (const prompt of PROMPTS) {
      expect(prompt.query.startsWith("a photo of ")).toBe(true)
      for (const band of ["frozen", "cool", "warm", "hot", "blazing"] as const) {
        expect(prompt.clues[band].length).toBeGreaterThan(0)
      }
    }
  })

  it("uses each prompt exactly once per cycle", () => {
    const seen = new Set<string>()
    for (let offset = 0; offset < 10; offset++) {
      const date = new Date(Date.UTC(2026, 9, 9 + offset, 12))
      for (const prompt of tripleFor(date).prompts) {
        expect(seen.has(prompt.id)).toBe(false)
        seen.add(prompt.id)
      }
    }
    expect(seen.size).toBe(PROMPTS.length)
  })
})
