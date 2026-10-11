import { useSyncExternalStore } from "react"

const TAPS_PER_TOGGLE = 10
const TAP_GAP_MS = 1500
const STORAGE_KEY = "snapdle:dev"

let listeners: ReadonlySet<() => void> = new Set()
let enabled = false
let taps = 0
let lastTapAt = 0

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

function readInitial(): boolean {
  try {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("dev") === "1") {
        window.sessionStorage.setItem(STORAGE_KEY, "1")
        return true
      }
      return window.sessionStorage.getItem(STORAGE_KEY) === "1"
    }
  } catch {
    // Storage or URL unavailable; stay disabled.
  }
  return false
}

function setEnabled(next: boolean): void {
  enabled = next
  try {
    if (next) {
      window.sessionStorage.setItem(STORAGE_KEY, "1")
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Session still toggles for this load.
  }
  notify()
}

/** Count one tap on the theme switch. Ten quick taps toggle dev mode. */
export function noteThemeTap(): void {
  const now = Date.now()
  if (now - lastTapAt > TAP_GAP_MS) {
    taps = 0
  }
  lastTapAt = now
  taps += 1
  if (taps >= TAPS_PER_TOGGLE) {
    taps = 0
    setEnabled(!enabled)
  }
}

let initialized = false
function ensureInitialized(): void {
  if (initialized || typeof window === "undefined") {
    return
  }
  initialized = true
  enabled = readInitial()
}

function subscribe(listener: () => void): () => void {
  ensureInitialized()
  const next = new Set(listeners)
  next.add(listener)
  listeners = next
  return () => {
    const remaining = new Set(listeners)
    remaining.delete(listener)
    listeners = remaining
  }
}

function getSnapshot(): boolean {
  ensureInitialized()
  return enabled
}

/** True once ten quick theme-switch taps (or `?dev=1`) enable dev mode. */
export function useDevMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}

/** Close dev mode for this session. */
export function disableDevMode(): void {
  setEnabled(false)
}
