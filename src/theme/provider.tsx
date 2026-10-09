import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react"
import { CONTRAST_STORAGE_KEY, parseContrast, type ContrastMode } from "./contrast.ts"
import {
  STORAGE_KEY,
  parsePreference,
  resolveTheme,
  type EffectiveTheme,
  type ThemePreference,
} from "./preference.ts"

interface ThemeContextValue {
  readonly preference: ThemePreference
  readonly effective: EffectiveTheme
  readonly setPreference: (preference: ThemePreference) => void
  readonly contrast: ContrastMode
  readonly setContrast: (contrast: ContrastMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredPreference(): ThemePreference {
  try {
    return parsePreference(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return "system"
  }
}

function readStoredContrast(): ContrastMode {
  try {
    return parseContrast(window.localStorage.getItem(CONTRAST_STORAGE_KEY))
  } catch {
    return "standard"
  }
}

function systemIsDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

/**
 * Single imperative sync from storage to `<html>`. Runs on user actions
 * and OS changes; the no-flash script in index.html covers first paint.
 * Storage is the source of truth so private-mode write failures still
 * apply the requested values for the session.
 */
function applyThemeToDocument(preference: ThemePreference, contrast: ContrastMode): void {
  const effective = resolveTheme(preference, systemIsDark())
  document.documentElement.dataset["theme"] = effective
  document.documentElement.style.colorScheme = effective
  document.documentElement.dataset["contrast"] = contrast
}

function subscribeSystemDark(onChange: () => void): () => void {
  const query = window.matchMedia("(prefers-color-scheme: dark)")
  const sync = (): void => {
    applyThemeToDocument(readStoredPreference(), readStoredContrast())
    onChange()
  }
  query.addEventListener("change", sync)
  return () => query.removeEventListener("change", sync)
}

/** Theme preference and contrast mode. No effects: state mirrors, handlers sync. */
export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)
  const [contrast, setContrastState] = useState<ContrastMode>(readStoredContrast)
  const systemDark = useSyncExternalStore(subscribeSystemDark, systemIsDark)

  const setPreference = (next: ThemePreference): void => {
    setPreferenceState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private-mode storage can throw; the theme still applies for the session.
    }
    applyThemeToDocument(next, readStoredContrast())
  }

  const setContrast = (next: ContrastMode): void => {
    setContrastState(next)
    try {
      window.localStorage.setItem(CONTRAST_STORAGE_KEY, next)
    } catch {
      // Same as above; contrast still applies for the session.
    }
    applyThemeToDocument(readStoredPreference(), next)
  }

  const effective = resolveTheme(preference, systemDark)

  return (
    <ThemeContext.Provider value={{ preference, effective, setPreference, contrast, setContrast }}>
      {children}
    </ThemeContext.Provider>
  )
}

/** Read the current theme. Must be used inside `<ThemeProvider>`. */
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error("useTheme must be used inside <ThemeProvider>")
  }
  return value
}
