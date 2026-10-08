import { Option, Schema } from "effect"

/** User-chosen theme preference. `system` follows the OS setting. */
export const ThemePreference = Schema.Literals(["light", "dark", "system"])
export type ThemePreference = typeof ThemePreference.Type

/** Concrete theme applied to the document. Never `system`. */
export const EffectiveTheme = Schema.Literals(["light", "dark"])
export type EffectiveTheme = typeof EffectiveTheme.Type

/** localStorage key for the persisted preference. */
export const STORAGE_KEY = "touchgrassdle:theme"

/**
 * Parse a stored preference value.
 * Unknown or missing values fall back to `"system"`.
 *
 * @example
 * ```ts
 * parsePreference("dark") // "dark"
 * parsePreference("neon") // "system"
 * ```
 */
export function parsePreference(raw: unknown): ThemePreference {
  return Schema.decodeUnknownOption(ThemePreference)(raw).pipe(
    Option.getOrElse(() => "system" as const),
  )
}

/**
 * Resolve a preference to the theme to apply, given the OS setting.
 *
 * @example
 * ```ts
 * resolveTheme("system", true) // "dark"
 * resolveTheme("light", true) // "light"
 * ```
 */
export function resolveTheme(preference: ThemePreference, systemDark: boolean): EffectiveTheme {
  if (preference === "system") {
    return systemDark ? "dark" : "light"
  }
  return preference
}
