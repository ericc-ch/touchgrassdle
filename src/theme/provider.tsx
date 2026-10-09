import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
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

/** Provides the theme preference and applies the effective theme to `<html data-theme>`. */
export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readStoredPreference)
  const [contrast, setContrast] = useState<ContrastMode>(readStoredContrast)
  const [systemDark, setSystemDark] = useState<boolean>(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  )

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  const effective = resolveTheme(preference, systemDark)

  useEffect(() => {
    document.documentElement.dataset.theme = effective
    document.documentElement.style.colorScheme = effective
  }, [effective])

  useEffect(() => {
    document.documentElement.dataset.contrast = contrast
  }, [contrast])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, preference)
    } catch {
      // Private-mode storage can throw; the theme still applies for the session.
    }
  }, [preference])

  useEffect(() => {
    try {
      window.localStorage.setItem(CONTRAST_STORAGE_KEY, contrast)
    } catch {
      // Same as above; contrast still applies for the session.
    }
  }, [contrast])

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
