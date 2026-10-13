import { Schema } from "effect"
import { MAX_GUESSES, SOLVE_THRESHOLD, Score, Temperature } from "./scoring.ts"

/** One scored guess. Photos live in the UI layer; the hint is derived at
 * render from the guess index (guess n shows hint n), so it is not stored. */
export const Guess = Schema.Struct({
  score: Score,
  temperature: Temperature,
  takenAt: Schema.Number,
})
export type Guess = typeof Guess.Type

/** The three prompt ids dealt for one day. */
const TripleIds = Schema.Tuple([Schema.String, Schema.String, Schema.String])
export type TripleIds = typeof TripleIds.Type

/**
 * One linear pick-1-of-3 day. The day opens on the first object and
 * `advance` moves to the next live one. `guesses` holds the current
 * run only. A run that burns 6 photos without solving dies but keeps
 * its run on the board for the share card.
 */
export const DayState = Schema.Struct({
  dateKey: Schema.String,
  tripleIds: TripleIds,
  choiceId: Schema.NullOr(Schema.String),
  deadIds: Schema.Array(Schema.String),
  gaveUpIds: Schema.Array(Schema.String),
  guesses: Schema.Array(Guess).check(Schema.isMaxLength(MAX_GUESSES)),
})
export type DayState = typeof DayState.Type

/**
 * Fresh day, opened on the first object of the triple.
 *
 * @example
 * ```ts
 * newDay("2026-10-09", ["exit-sign", "wall-clock", "bicycle"])
 * ```
 */
export function newDay(dateKey: string, tripleIds: TripleIds): DayState {
  return {
    dateKey,
    tripleIds,
    choiceId: tripleIds[0],
    deadIds: [],
    gaveUpIds: [],
    guesses: [],
  }
}

/** True once any guess reaches the solve threshold. */
export function isSolved(day: DayState): boolean {
  return day.guesses.some((guess) => guess.score >= SOLVE_THRESHOLD)
}

/** True when a prompt can no longer be picked (failed out or given up). */
export function isDead(day: DayState, id: string): boolean {
  return day.deadIds.includes(id) || day.gaveUpIds.includes(id)
}

/** Pickable prompt ids: the triple minus everything dead. */
export function liveIds(day: DayState): ReadonlyArray<string> {
  return day.tripleIds.filter((id) => !isDead(day, id))
}

/** True once the day is decided: one prompt solved or all three dead. */
export function dayOver(day: DayState): boolean {
  return isSolved(day) || liveIds(day).length === 0
}

/** True while the current choice may still shoot. */
export function canGuess(day: DayState): boolean {
  return (
    day.choiceId !== null &&
    !isDead(day, day.choiceId) &&
    !isSolved(day) &&
    day.guesses.length < MAX_GUESSES
  )
}

/**
 * True when the shown run burned all 6 photos without solving. The board
 * keeps the run for the share card; the UI offers the remaining picks.
 */
export function boardFailed(day: DayState): boolean {
  return day.choiceId !== null && day.deadIds.includes(day.choiceId) && !isSolved(day)
}

/** Best score of the current run, 0 with no guesses. */
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
  readonly takenAt: number
}

/**
 * Append a guess. Returns the unchanged day when guessing is closed,
 * so the UI can disable capture instead of branching. A sixth
 * unsolved guess kills the choice for the day but leaves the run on
 * the board.
 */
export function recordGuess(day: DayState, input: RecordGuessInput): DayState {
  if (!canGuess(day)) {
    return day
  }
  const next: DayState = { ...day, guesses: [...day.guesses, { ...input }] }
  const choice = next.choiceId
  if (choice !== null && !isSolved(next) && next.guesses.length >= MAX_GUESSES) {
    return { ...next, deadIds: [...next.deadIds, choice] }
  }
  return next
}

/**
 * Move to the next live object. Quits the current pick when it is still
 * alive, then starts a fresh run on the first live object. With no live
 * objects left the day ends and the board clears.
 *
 * @example
 * ```ts
 * advance(newDay("2026-10-09", ["exit-sign", "wall-clock", "bicycle"]))
 * // { choiceId: "wall-clock", guesses: [], ... }
 * ```
 */
export function advance(day: DayState): DayState {
  if (dayOver(day)) {
    return day
  }
  const choice = day.choiceId
  const base =
    choice !== null && !isDead(day, choice) && !isSolved(day)
      ? { ...day, gaveUpIds: [...day.gaveUpIds, choice] }
      : day
  const next = liveIds(base)[0]
  if (next === undefined) {
    return { ...base, choiceId: null, guesses: [] }
  }
  return { ...base, choiceId: next, guesses: [] }
}
