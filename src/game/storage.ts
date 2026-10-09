import { Option, Schema } from "effect"
import { DayState } from "./state.ts"

/**
 * What lands in localStorage: the day plus one JPEG thumbnail per guess
 * (parallel array, same order). Photos never leave the device; thumbnails
 * keep the board intact across reloads.
 */
export const StoredDay = Schema.Struct({
  day: DayState,
  thumbnails: Schema.Array(Schema.String),
})
export type StoredDay = typeof StoredDay.Type

const keyFor = (dateKey: string): string => `touchgrassdle:day:${dateKey}`

/** Load a stored day, or null when missing, corrupt, or unreadable. */
export function loadStoredDay(dateKey: string): StoredDay | null {
  try {
    const raw = window.localStorage.getItem(keyFor(dateKey))
    if (raw === null) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    const result = Schema.decodeUnknownOption(StoredDay)(parsed)
    return Option.isSome(result) ? result.value : null
  } catch {
    return null
  }
}

/** Persist a day. Silently drops on quota/private-mode errors. */
export function saveStoredDay(dateKey: string, stored: StoredDay): void {
  try {
    window.localStorage.setItem(keyFor(dateKey), JSON.stringify(stored))
  } catch {
    // Board still works for the session; a reload just starts the day over.
  }
}
