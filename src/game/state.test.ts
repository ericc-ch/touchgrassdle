import { describe, expect, it } from "vitest"
import {
  advance,
  boardFailed,
  canGuess,
  bestScore,
  dayOver,
  isSolved,
  liveIds,
  newDay,
  recordGuess,
  type TripleIds,
} from "./state.ts"

const triple: TripleIds = ["exit-sign", "wall-clock", "bicycle"]
const guess = (score: number) => ({
  score,
  temperature: "warm" as const,
  takenAt: 0,
})

describe("day lifecycle", () => {
  it("opens on the first object with three live picks", () => {
    const day = newDay("2026-10-09", triple)
    expect(day.choiceId).toBe("exit-sign")
    expect(canGuess(day)).toBe(true)
    expect(isSolved(day)).toBe(false)
    expect(dayOver(day)).toBe(false)
    expect(bestScore(day)).toBe(0)
    expect(liveIds(day)).toEqual(["exit-sign", "wall-clock", "bicycle"])
  })

  it("solves on reaching the threshold and ends the day", () => {
    let day = newDay("2026-10-09", triple)
    day = recordGuess(day, guess(42))
    expect(canGuess(day)).toBe(true)
    expect(bestScore(day)).toBe(42)
    day = recordGuess(day, guess(85))
    expect(isSolved(day)).toBe(true)
    expect(dayOver(day)).toBe(true)
    expect(canGuess(day)).toBe(false)
    expect(recordGuess(day, guess(10))).toBe(day)
    expect(advance(day)).toBe(day)
  })

  it("advances to the next object with a fresh run", () => {
    let day = newDay("2026-10-09", triple)
    day = recordGuess(day, guess(40))
    day = advance(day)
    expect(day.choiceId).toBe("wall-clock")
    expect(day.guesses).toEqual([])
    expect(day.gaveUpIds).toEqual(["exit-sign"])
    expect(canGuess(day)).toBe(true)
    expect(dayOver(day)).toBe(false)
  })

  it("kills the choice after six misses but keeps the run for sharing", () => {
    let day = newDay("2026-10-09", triple)
    for (let i = 0; i < 6; i++) {
      day = recordGuess(day, guess(10 + i))
    }
    expect(day.guesses.length).toBe(6)
    expect(isSolved(day)).toBe(false)
    expect(canGuess(day)).toBe(false)
    expect(boardFailed(day)).toBe(true)
    expect(dayOver(day)).toBe(false)
    expect(liveIds(day)).toEqual(["wall-clock", "bicycle"])
    expect(recordGuess(day, guess(99))).toBe(day)
  })

  it("continues from a burned run onto the next object", () => {
    let day = newDay("2026-10-09", triple)
    for (let i = 0; i < 6; i++) {
      day = recordGuess(day, guess(5))
    }
    day = advance(day)
    expect(day.choiceId).toBe("wall-clock")
    expect(day.guesses).toEqual([])
    expect(day.gaveUpIds).toEqual([])
    expect(canGuess(day)).toBe(true)
  })

  it("ends the day once all three objects are dead", () => {
    let day = newDay("2026-10-09", triple)
    day = advance(day)
    day = advance(day)
    for (let i = 0; i < 6; i++) {
      day = recordGuess(day, guess(5))
    }
    expect(dayOver(day)).toBe(true)
    expect(canGuess(day)).toBe(false)
    expect(advance(day)).toBe(day)
  })

  it("quitting the last object clears the board and ends the day", () => {
    let day = newDay("2026-10-09", triple)
    day = advance(day)
    day = advance(day)
    day = recordGuess(day, guess(40))
    day = advance(day)
    expect(day.choiceId).toBe(null)
    expect(day.guesses).toEqual([])
    expect(day.gaveUpIds).toEqual(["exit-sign", "wall-clock", "bicycle"])
    expect(dayOver(day)).toBe(true)
  })
})
