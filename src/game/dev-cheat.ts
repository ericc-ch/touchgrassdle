import { useSyncExternalStore } from "react"

const CODE = "HESOYAM"
const STORAGE_KEY = "touchgrassdle:dev"

let listeners: ReadonlySet<() => void> = new Set()
let enabled = false
let buffer = ""
let lastKeyAt = 0

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

function onKeyDown(event: KeyboardEvent): void {
  const key = event.key
  if (key.length !== 1 || !/[a-z]/i.test(key)) {
    return
  }
  const now = Date.now()
  if (now - lastKeyAt > 1500) {
    buffer = ""
  }
  lastKeyAt = now
  buffer = `${buffer}${key.toUpperCase()}`.slice(-CODE.length)
  if (buffer === CODE) {
    buffer = ""
    setEnabled(!enabled)
  }
}

let wired = false
function ensureWired(): void {
  if (wired || typeof window === "undefined") {
    return
  }
  wired = true
  enabled = readInitial()
  window.addEventListener("keydown", onKeyDown)
}

function subscribe(listener: () => void): () => void {
  ensureWired()
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
  ensureWired()
  return enabled
}

/** True once the HESOYAM cheat code (or ?dev=1) enables dev mode. Typing it again toggles off. */
export function useDevMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}

/** Close dev mode for this session. */
export function disableDevMode(): void {
  setEnabled(false)
}
