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

/**
 * Wordle-style share card: header plus one row of six squares, no photos.
 *
 * @example
 * ```ts
 * formatShareCard(12, day) // "Snapdle #12 4/6 · best 92\n🟨🟦🟧🟥⬛⬛"
 * ```
 */
export function formatShareCard(dayNumber: number, day: DayState): string {
  const solved = isSolved(day)
  const tally = solved ? `${day.guesses.length}` : "X"
  const squares = day.guesses.map((guess) => squareFor(guess.temperature)).join("")
  const padding = EMPTY_SQUARE.repeat(MAX_GUESSES - day.guesses.length)
  return `Snapdle #${dayNumber} ${tally}/6 · best ${bestScore(day)}\n${squares}${padding}`
}
