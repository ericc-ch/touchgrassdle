import { describe, expect, it } from "vitest"
import { newDay, bestScore, canGuess, isSolved, recordGuess } from "./state.ts"

const guess = (score: number) => ({
  score,
  temperature: "warm" as const,
  clue: "warmer",
  takenAt: 0,
})

describe("day lifecycle", () => {
  it("starts open with no score", () => {
    const day = newDay("2026-10-09", "exit-sign")
    expect(canGuess(day)).toBe(true)
    expect(isSolved(day)).toBe(false)
    expect(bestScore(day)).toBe(0)
  })

  it("solves on reaching the threshold and closes guessing", () => {
    let day = newDay("2026-10-09", "exit-sign")
    day = recordGuess(day, guess(42))
    expect(canGuess(day)).toBe(true)
    expect(bestScore(day)).toBe(42)
    day = recordGuess(day, guess(85))
    expect(isSolved(day)).toBe(true)
    expect(canGuess(day)).toBe(false)
    expect(recordGuess(day, guess(10))).toBe(day)
  })

  it("closes after six guesses without solving", () => {
    let day = newDay("2026-10-09", "exit-sign")
    for (let i = 0; i < 6; i++) {
      day = recordGuess(day, guess(10 + i))
    }
    expect(day.guesses.length).toBe(6)
    expect(isSolved(day)).toBe(false)
    expect(canGuess(day)).toBe(false)
    expect(recordGuess(day, guess(99))).toBe(day)
  })
})
