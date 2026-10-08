import { Schema } from "effect"
import { MAX_GUESSES, SOLVE_THRESHOLD, Score, Temperature } from "./scoring.ts"

/** One scored guess. Photos live in the UI layer; the domain keeps scores. */
export const Guess = Schema.Struct({
  score: Score,
  temperature: Temperature,
  clue: Schema.String,
  takenAt: Schema.Number,
})
export type Guess = typeof Guess.Type

/** All guesses for one daily prompt. Solved is derived from scores. */
export const DayState = Schema.Struct({
  dateKey: Schema.String,
  promptId: Schema.String,
  guesses: Schema.Array(Guess).check(Schema.isMaxLength(MAX_GUESSES)),
})
export type DayState = typeof DayState.Type

/** Fresh day with no guesses. */
export function newDay(dateKey: string, promptId: string): DayState {
  return { dateKey, promptId, guesses: [] }
}

/** True once any guess reaches the solve threshold. */
export function isSolved(day: DayState): boolean {
  return day.guesses.some((guess) => guess.score >= SOLVE_THRESHOLD)
}

/** True while the player may still shoot. */
export function canGuess(day: DayState): boolean {
  return !isSolved(day) && day.guesses.length < MAX_GUESSES
}

/** Best score so far, 0 with no guesses. */
export function bestScore(day: DayState): number {
  let best = 0
  for (const guess of day.guesses) {
    if (guess.score > best) {
      best = guess.score
    }
  }
  return best
}

export interface RecordGuessInput {
  readonly score: Score
  readonly temperature: Temperature
  readonly clue: string
  readonly takenAt: number
}

/**
 * Append a guess. Returns the unchanged day when guessing is closed,
 * so the UI can disable capture instead of branching.
 */
export function recordGuess(day: DayState, input: RecordGuessInput): DayState {
  if (!canGuess(day)) {
    return day
  }
  return { ...day, guesses: [...day.guesses, { ...input }] }
}
