import { MAX_GUESSES, type Temperature } from "./scoring.ts"
import { bestScore, isSolved, type DayState } from "./state.ts"

/** Share square per temperature band, cold to hot. */
export function squareFor(temperature: Temperature): string {
  if (temperature === "blazing") {
    return "🟥"
  }
  if (temperature === "hot") {
    return "🟧"
  }
  if (temperature === "warm") {
    return "🟨"
  }
  if (temperature === "cool") {
    return "🟩"
  }
  return "🟦"
}

/** Empty slot for an unused guess. */
export const EMPTY_SQUARE = "⬛"

export interface ShareLabels {
  /** Revealed label of the run on the board, or null when the board is empty. */
  readonly choiceLabel: string | null
  /** Revealed labels of prompts given up, in give-up order. */
  readonly gaveUpLabels: ReadonlyArray<string>
}

/**
 * Wordle-style share card: header naming the played prompt plus one row
 * of six squares, no photos. Gave-up prompts are listed so friends see
 * the whole day, not just the winning run.
 *
 * @example
 * ```ts
 * formatShareCard(12, day, { choiceLabel: "Bicycle", gaveUpLabels: ["Banana"] })
 * // "Snapdle #12 (Bicycle) 2/6 · best 92 · skipped: Banana\n🟨🟥⬛⬛⬛⬛"
 * ```
 */
export function formatShareCard(dayNumber: number, day: DayState, labels: ShareLabels): string {
  const solved = isSolved(day)
  const tally = solved ? `${day.guesses.length}` : "X"
  const subject = labels.choiceLabel === null ? "" : ` (${labels.choiceLabel})`
  const gaveUp =
    labels.gaveUpLabels.length === 0 ? "" : ` · skipped: ${labels.gaveUpLabels.join(", ")}`
  const squares = day.guesses.map((guess) => squareFor(guess.temperature)).join("")
  const padding = EMPTY_SQUARE.repeat(MAX_GUESSES - day.guesses.length)
  return `Snapdle #${dayNumber}${subject} ${tally}/6 · best ${bestScore(day)}${gaveUp}\n${squares}${padding}`
}
