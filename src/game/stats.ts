import { Option, Schema } from "effect"

/** Storage schema version. Bump when stored shapes change. */
export const STATS_VERSION = 1

/** Non-negative integer for counters. */
const Count = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))

/** Guesses-used histogram: index 0 counts wins in 1 shot, … index 5 in 6. */
const Distribution = Schema.Tuple([Count, Count, Count, Count, Count, Count])

/**
 * Wordle-style lifetime stats. `lastPlayed` is a UTC `YYYY-MM-DD` key,
 * `""` before the first completed day.
 */
export const Stats = Schema.Struct({
  version: Schema.Literal(STATS_VERSION),
  played: Count,
  wins: Count,
  currentStreak: Count,
  maxStreak: Count,
  byGuesses: Distribution,
  lastPlayed: Schema.String,
})
export type Stats = typeof Stats.Type

/** Stats before the first completed day. */
export function emptyStats(): Stats {
  return {
    version: STATS_VERSION,
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    byGuesses: [0, 0, 0, 0, 0, 0],
    lastPlayed: "",
  }
}

/** UTC `YYYY-MM-DD` of the day before `dateKey`. */
export function previousDateKey(dateKey: string): string {
  const day = new Date(`${dateKey}T00:00:00Z`)
  day.setUTCDate(day.getUTCDate() - 1)
  return day.toISOString().slice(0, 10)
}

export interface DayResult {
  readonly dateKey: string
  readonly solved: boolean
  readonly guessesUsed: number
}

/**
 * Fold a completed day into stats. Idempotent per `dateKey`, so reloads
 * and re-renders never double-count. A loss resets the streak; like
 * Wordle, only wins extend it.
 */
export function recordDay(stats: Stats, result: DayResult): Stats {
  const { dateKey, solved, guessesUsed } = result
  if (dateKey === stats.lastPlayed) {
    return stats
  }
  const streak = solved
    ? stats.lastPlayed === previousDateKey(dateKey)
      ? stats.currentStreak + 1
      : 1
    : 0
  const solvedIndex = solved ? guessesUsed - 1 : -1
  const at = (index: number): number => {
    const current = stats.byGuesses[index] ?? 0
    return index === solvedIndex ? current + 1 : current
  }
  const byGuesses: Stats["byGuesses"] = [at(0), at(1), at(2), at(3), at(4), at(5)]
  return {
    ...stats,
    played: stats.played + 1,
    wins: stats.wins + (solved ? 1 : 0),
    currentStreak: streak,
    maxStreak: Math.max(stats.maxStreak, streak),
    byGuesses,
    lastPlayed: dateKey,
  }
}

/** Win percentage, 0 with no completed days. */
export function winPercent(stats: Stats): number {
  if (stats.played === 0) {
    return 0
  }
  return Math.round((stats.wins / stats.played) * 100)
}

const STATS_KEY = `touchgrassdle:v${STATS_VERSION}:stats`

/** Load stats, or fresh stats when missing, corrupt, or unreadable. */
export function loadStats(): Stats {
  try {
    const raw = window.localStorage.getItem(STATS_KEY)
    if (raw === null) {
      return emptyStats()
    }
    const result = Schema.decodeUnknownOption(Stats)(JSON.parse(raw) as unknown)
    return Option.isSome(result) ? result.value : emptyStats()
  } catch {
    return emptyStats()
  }
}

/** Persist stats. Silently drops on quota/private-mode errors. */
export function saveStats(stats: Stats): void {
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch {
    // Stats are a nicety; the board still works without them.
  }
}
