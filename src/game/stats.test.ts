import { describe, expect, it } from "vitest"
import { emptyStats, previousDateKey, recordDay, winPercent } from "./stats.ts"
import { formatCountdown, msUntilNextDay } from "./countdown.ts"

describe("recordDay", () => {
  it("starts fresh and records a first-day win in 4", () => {
    const stats = recordDay(emptyStats(), { dateKey: "2026-10-09", solved: true, guessesUsed: 4 })
    expect(stats.played).toBe(1)
    expect(stats.wins).toBe(1)
    expect(stats.currentStreak).toBe(1)
    expect(stats.maxStreak).toBe(1)
    expect(stats.byGuesses[3]).toBe(1)
    expect(winPercent(stats)).toBe(100)
  })

  it("extends the streak on consecutive days", () => {
    let stats = recordDay(emptyStats(), { dateKey: "2026-10-09", solved: true, guessesUsed: 2 })
    stats = recordDay(stats, { dateKey: "2026-10-10", solved: true, guessesUsed: 6 })
    expect(stats.currentStreak).toBe(2)
    expect(stats.maxStreak).toBe(2)
    expect(stats.played).toBe(2)
  })

  it("resets the streak after a skipped day", () => {
    let stats = recordDay(emptyStats(), { dateKey: "2026-10-09", solved: true, guessesUsed: 2 })
    stats = recordDay(stats, { dateKey: "2026-10-11", solved: true, guessesUsed: 1 })
    expect(stats.currentStreak).toBe(1)
    expect(stats.maxStreak).toBe(1)
  })

  it("resets the streak on a loss and skips the histogram", () => {
    let stats = recordDay(emptyStats(), { dateKey: "2026-10-09", solved: true, guessesUsed: 2 })
    stats = recordDay(stats, { dateKey: "2026-10-10", solved: false, guessesUsed: 6 })
    expect(stats.played).toBe(2)
    expect(stats.wins).toBe(1)
    expect(stats.currentStreak).toBe(0)
    expect(stats.maxStreak).toBe(1)
    expect(stats.byGuesses.every((n) => n === 0 || n === 1)).toBe(true)
    expect(winPercent(stats)).toBe(50)
  })

  it("ignores repeat records for the same day", () => {
    let stats = recordDay(emptyStats(), { dateKey: "2026-10-09", solved: true, guessesUsed: 2 })
    stats = recordDay(stats, { dateKey: "2026-10-09", solved: true, guessesUsed: 2 })
    expect(stats.played).toBe(1)
    expect(stats.currentStreak).toBe(1)
  })
})

describe("previousDateKey", () => {
  it("steps back across month boundaries", () => {
    expect(previousDateKey("2026-10-09")).toBe("2026-10-08")
    expect(previousDateKey("2026-10-01")).toBe("2026-09-30")
  })
})

describe("countdown", () => {
  it("measures to the next UTC midnight", () => {
    expect(msUntilNextDay(new Date("2026-10-09T12:00:00Z"))).toBe(12 * 3600 * 1000)
    expect(msUntilNextDay(new Date("2026-10-09T23:59:59Z"))).toBe(1000)
  })

  it("formats HH:MM:SS", () => {
    expect(formatCountdown(0)).toBe("00:00:00")
    expect(formatCountdown(3661000)).toBe("01:01:01")
    expect(formatCountdown(-5)).toBe("00:00:00")
  })
})
