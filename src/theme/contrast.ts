import { Option, Schema } from "effect"

/** Temperature-band palette. `high` swaps green/yellow for orange/blue (Wordle-style). */
export const ContrastMode = Schema.Literals(["standard", "high"])
export type ContrastMode = typeof ContrastMode.Type

/** localStorage key for the persisted contrast mode. */
export const CONTRAST_STORAGE_KEY = "touchgrassdle:contrast"

/** Parse a stored contrast value. Unknown or missing values fall back to `"standard"`. */
export function parseContrast(raw: unknown): ContrastMode {
  return Schema.decodeUnknownOption(ContrastMode)(raw).pipe(
    Option.getOrElse(() => "standard" as const),
  )
}
