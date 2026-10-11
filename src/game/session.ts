import { useCallback, useMemo, useState, useSyncExternalStore } from "react"
import { Effect } from "effect"
import { fileToThumbnail } from "./photo.ts"
import { clueForAttempt, promptFor, QUERY_PREFIX, shareDayNumber } from "./prompts.ts"
import { MAX_GUESSES, cosineSimilarity, temperatureFor, toScore } from "./scoring.ts"
import {
  EmbedError,
  ensurePromptEmbedding,
  ensureScorer,
  getPromptEmbeddingsSnapshot,
  getScorerSnapshot,
  retryScorer,
  subscribePromptEmbeddings,
  subscribeScorer,
} from "./scorer.ts"
import { canGuess, isSolved, newDay, recordGuess, type DayState } from "./state.ts"
import { loadStats, recordDay, saveStats, type Stats } from "./stats.ts"
import { formatShareCard } from "./share.ts"
import { loadStoredDay, saveStoredDay } from "./storage.ts"

export type GameStatus = "loading-model" | "ready" | "model-error"

export interface DailyGame {
  readonly status: GameStatus
  readonly modelFraction: number | null
  readonly modelError: string | null
  readonly dayNumber: number
  readonly day: DayState
  readonly stats: Stats
  readonly thumbnails: ReadonlyArray<string>
  readonly scoring: boolean
  readonly notice: string | null
  readonly shared: boolean
  readonly solved: boolean
  readonly open: boolean
  readonly remaining: number
  readonly latestClue: string | null
  readonly retryLoad: () => void
  readonly scorePhoto: (file: File) => void
  readonly share: () => void
  readonly dev: DevControls
}

/** Dev-mode controls. Everything mutates the live day in place; no fake previews. */
export interface DevControls {
  readonly addFakeGuess: (score: number) => void
  readonly solveNow: () => void
  readonly fillFailed: () => void
  readonly clearBoard: () => void
  readonly setNoticeText: (notice: string | null) => void
  readonly setScoringNow: (scoring: boolean) => void
  readonly setStatusOverride: (status: GameStatus | null) => void
  readonly setFractionOverride: (fraction: number | null) => void
  readonly setErrorOverride: (error: string | null) => void
  readonly statusOverride: GameStatus | null
}

/** Placeholder thumbnail for dev-injected guesses: gray square with the score. */
function fakeThumbnail(score: number): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>` +
    `<rect width='128' height='128' fill='#3f3f46'/>` +
    `<text x='64' y='74' font-family='sans-serif' font-size='30' font-weight='bold' ` +
    `fill='white' text-anchor='middle'>${score}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const errorMessage = (cause: unknown): string =>
  cause instanceof EmbedError
    ? cause.message
    : cause instanceof Error
      ? cause.message
      : String(cause)

/**
 * Owns one daily photo game: model loading, scoring flow, persistence, sharing.
 * Photos stay in memory + thumbnails in localStorage; nothing uploads.
 */
export function useDailyGame(): DailyGame {
  const today = useMemo(() => promptFor(new Date()), [])
  const dayNumber = useMemo(() => shareDayNumber(new Date()), [])

  // Shared scorer lifecycle: one load for all mounts, StrictMode-safe.
  // ensureScorer is idempotent; the store dedupes concurrent calls.
  // Today's puzzle vector is encoded on-device once the text encoder
  // is ready; the same dedupe pattern covers StrictMode remounts.
  const loader = useSyncExternalStore(subscribeScorer, getScorerSnapshot)
  const promptStore = useSyncExternalStore(subscribePromptEmbeddings, getPromptEmbeddingsSnapshot)
  ensureScorer()
  if (loader.scorer !== null) {
    ensurePromptEmbedding(today.prompt.id, `${QUERY_PREFIX}${today.prompt.query}`)
  }
  const promptVector = promptStore.embeddings[today.prompt.id] ?? null
  const promptError = promptStore.error
  const [scoring, setScoring] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [shared, setShared] = useState(false)
  const [stats, setStats] = useState<Stats>(loadStats)
  const [statusOverride, setStatusOverride] = useState<GameStatus | null>(null)
  const [fractionOverride, setFractionOverride] = useState<number | null>(null)
  const [errorOverride, setErrorOverride] = useState<string | null>(null)
  let baseStatus: GameStatus
  if (loader.status === "model-error") {
    baseStatus = "model-error"
  } else if (promptError !== null) {
    baseStatus = "model-error"
  } else if (loader.status !== "ready" || promptVector === null) {
    baseStatus = "loading-model"
  } else {
    baseStatus = "ready"
  }
  const status: GameStatus = statusOverride ?? baseStatus
  const modelFraction = fractionOverride ?? loader.fraction
  const modelError = errorOverride ?? loader.error ?? promptError
  const [day, setDay] = useState<DayState>(() => {
    const stored = loadStoredDay(today.dateKey)
    if (stored !== null && stored.day.promptId === today.prompt.id) {
      return stored.day
    }
    return newDay(today.dateKey, today.prompt.id)
  })
  const [thumbnails, setThumbnails] = useState<ReadonlyArray<string>>(() => {
    const stored = loadStoredDay(today.dateKey)
    if (stored !== null && stored.day.promptId === today.prompt.id) {
      return stored.thumbnails
    }
    return []
  })

  const persist = useCallback(
    (next: DayState, nextThumbnails: ReadonlyArray<string>) => {
      setDay(next)
      setThumbnails(nextThumbnails)
      saveStoredDay(today.dateKey, { day: next, thumbnails: [...nextThumbnails] })
      // Only completed days count: recordDay is idempotent per dateKey,
      // so reloads and re-renders never double-count.
      if (!canGuess(next)) {
        const nextStats = recordDay(stats, {
          dateKey: next.dateKey,
          solved: isSolved(next),
          guessesUsed: next.guesses.length,
        })
        setStats(nextStats)
        saveStats(nextStats)
      }
    },
    [today.dateKey, stats],
  )

  const retryLoad = useCallback(() => {
    retryScorer()
  }, [])

  const scorePhoto = useCallback(
    (file: File) => {
      const active = loader.scorer
      if (active === null || promptVector === null || scoring || !canGuess(day)) {
        return
      }
      setScoring(true)
      setNotice(null)
      void Effect.runPromise(
        Effect.gen(function* () {
          const thumbnail = yield* Effect.tryPromise({
            try: () => fileToThumbnail(file),
            catch: (cause) => new EmbedError({ message: errorMessage(cause) }),
          })
          const vector = yield* active.embedImage(file)
          const score = toScore(cosineSimilarity(vector, promptVector))
          return { thumbnail, score }
        }),
      ).then(
        ({ thumbnail, score }) => {
          const temperature = temperatureFor(score)
          persist(
            recordGuess(day, {
              score,
              temperature,
              clue: clueForAttempt(today.prompt, day.guesses.length),
              takenAt: Date.now(),
            }),
            [...thumbnails, thumbnail],
          )
          setScoring(false)
        },
        (cause: unknown) => {
          setNotice(`Couldn't score that photo: ${errorMessage(cause)}`)
          setScoring(false)
        },
      )
    },
    [loader.scorer, promptVector, scoring, day, thumbnails, persist, today.prompt],
  )

  const share = useCallback(() => {
    const text = formatShareCard(dayNumber, day)
    const done = () => setShared(true)
    if (typeof navigator.clipboard?.writeText === "function") {
      void navigator.clipboard
        .writeText(text)
        .then(done, () => setNotice("Copy failed — long-press the card instead."))
    } else {
      setNotice(text)
    }
  }, [dayNumber, day])

  const solved = isSolved(day)
  const open = canGuess(day)
  const latest = day.guesses[day.guesses.length - 1]

  const addFakeGuess = useCallback(
    (score: number) => {
      if (!canGuess(day)) {
        return
      }
      const clamped = Math.min(100, Math.max(0, Math.round(score)))
      const temperature = temperatureFor(clamped)
      persist(
        recordGuess(day, {
          score: clamped,
          temperature,
          clue: clueForAttempt(today.prompt, day.guesses.length),
          takenAt: Date.now(),
        }),
        [...thumbnails, fakeThumbnail(clamped)],
      )
    },
    [day, thumbnails, persist, today.prompt],
  )

  const solveNow = useCallback(() => {
    addFakeGuess(92)
  }, [addFakeGuess])

  const fillFailed = useCallback(() => {
    if (!canGuess(day)) {
      return
    }
    const candidates = [8, 22, 38, 52, 64, 71]
    const needed = MAX_GUESSES - day.guesses.length
    let next = day
    const nextThumbnails = [...thumbnails]
    for (let index = 0; index < needed; index++) {
      const clamped = candidates[(day.guesses.length + index) % candidates.length] ?? 12
      const temperature = temperatureFor(clamped)
      next = recordGuess(next, {
        score: clamped,
        temperature,
        clue: clueForAttempt(today.prompt, day.guesses.length + index),
        takenAt: Date.now() + index,
      })
      nextThumbnails.push(fakeThumbnail(clamped))
    }
    persist(next, nextThumbnails)
  }, [day, thumbnails, persist, today.prompt.clues])

  const clearBoard = useCallback(() => {
    setNotice(null)
    setScoring(false)
    setShared(false)
    persist(newDay(today.dateKey, today.prompt.id), [])
  }, [persist, today.dateKey, today.prompt.id])

  const setNoticeText = useCallback((text: string | null) => {
    setNotice(text)
  }, [])

  const setScoringNow = useCallback((next: boolean) => {
    setScoring(next)
  }, [])

  return {
    status,
    modelFraction,
    modelError,
    dayNumber,
    day,
    stats,
    thumbnails,
    scoring,
    notice,
    shared,
    solved,
    open,
    remaining: MAX_GUESSES - day.guesses.length,
    latestClue: latest === undefined ? null : latest.clue,
    retryLoad,
    scorePhoto,
    share,
    dev: {
      addFakeGuess,
      solveNow,
      fillFailed,
      clearBoard,
      setNoticeText,
      setScoringNow,
      setStatusOverride,
      setFractionOverride,
      setErrorOverride,
      statusOverride,
    },
  }
}
