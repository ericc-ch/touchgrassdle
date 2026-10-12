import { describe, expect, it } from "vitest"
import {
  boardFailed,
  canGuess,
  bestScore,
  choosePrompt,
  dayOver,
  giveUp,
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
  it("starts with no choice and three live picks", () => {
    const day = newDay("2026-10-09", triple)
    expect(day.choiceId).toBe(null)
    expect(canGuess(day)).toBe(false)
    expect(isSolved(day)).toBe(false)
    expect(dayOver(day)).toBe(false)
    expect(bestScore(day)).toBe(0)
    expect(liveIds(day)).toEqual(["exit-sign", "wall-clock", "bicycle"])
  })

  it("choosing starts a guessable run", () => {
    const day = choosePrompt(newDay("2026-10-09", triple), "bicycle")
    expect(day.choiceId).toBe("bicycle")
    expect(canGuess(day)).toBe(true)
  })

  it("rejects unknown, dead, and late choices", () => {
    const fresh = newDay("2026-10-09", triple)
    expect(choosePrompt(fresh, "toaster")).toBe(fresh)
    const picked = choosePrompt(fresh, "bicycle")
    const quit = giveUp(picked)
    expect(choosePrompt(quit, "bicycle")).toBe(quit)
  })

  it("solves on reaching the threshold and ends the day", () => {
    let day = choosePrompt(newDay("2026-10-09", triple), "bicycle")
    day = recordGuess(day, guess(42))
    expect(canGuess(day)).toBe(true)
    expect(bestScore(day)).toBe(42)
    day = recordGuess(day, guess(85))
    expect(isSolved(day)).toBe(true)
    expect(dayOver(day)).toBe(true)
    expect(canGuess(day)).toBe(false)
    expect(recordGuess(day, guess(10))).toBe(day)
  })

  it("kills the choice after six misses but keeps the run for sharing", () => {
    let day = choosePrompt(newDay("2026-10-09", triple), "bicycle")
    for (let i = 0; i < 6; i++) {
      day = recordGuess(day, guess(10 + i))
    }
    expect(day.guesses.length).toBe(6)
    expect(isSolved(day)).toBe(false)
    expect(canGuess(day)).toBe(false)
    expect(boardFailed(day)).toBe(true)
    expect(dayOver(day)).toBe(false)
    expect(liveIds(day)).toEqual(["exit-sign", "wall-clock"])
    expect(recordGuess(day, guess(99))).toBe(day)
  })

  it("gives up the choice, clears the run, and returns to the picker", () => {
    let day = choosePrompt(newDay("2026-10-09", triple), "bicycle")
    day = recordGuess(day, guess(40))
    day = giveUp(day)
    expect(day.choiceId).toBe(null)
    expect(day.guesses).toEqual([])
    expect(day.gaveUpIds).toEqual(["bicycle"])
    expect(liveIds(day)).toEqual(["exit-sign", "wall-clock"])
    expect(dayOver(day)).toBe(false)
  })

  it("ends the day once all three prompts are dead", () => {
    let day = choosePrompt(newDay("2026-10-09", triple), "exit-sign")
    day = giveUp(day)
    day = choosePrompt(day, "wall-clock")
    day = giveUp(day)
    day = choosePrompt(day, "bicycle")
    for (let i = 0; i < 6; i++) {
      day = recordGuess(day, guess(5))
    }
    expect(dayOver(day)).toBe(true)
    expect(canGuess(day)).toBe(false)
    expect(choosePrompt(day, "exit-sign")).toBe(day)
  })

  it("giving up with no live choice changes nothing", () => {
    const day = newDay("2026-10-09", triple)
    expect(giveUp(day)).toBe(day)
  })
})
