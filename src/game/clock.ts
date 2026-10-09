import { useSyncExternalStore } from "react"

let listeners: ReadonlySet<() => void> = new Set()
let timer: ReturnType<typeof setInterval> | null = null
let now = Date.now()

function tick(): void {
  now = Date.now()
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void): () => void {
  const next = new Set(listeners)
  next.add(listener)
  listeners = next
  if (timer === null) {
    timer = setInterval(tick, 1000)
  }
  return () => {
    const remaining = new Set(listeners)
    remaining.delete(listener)
    listeners = remaining
    if (remaining.size === 0 && timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }
}

function getSnapshot(): number {
  return now
}

/**
 * Shared 1s clock. One interval no matter how many components subscribe;
 * stops when the last subscriber leaves. Replaces interval-in-effect.
 */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot)
}
