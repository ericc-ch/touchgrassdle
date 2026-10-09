import { useCallback, useMemo, useState, useSyncExternalStore } from "react"
import { Effect, Option } from "effect"
import { promptEmbeddingFor } from "./embeddings.ts"
import { fileToThumbnail } from "./photo.ts"
import { promptFor, shareDayNumber } from "./prompts.ts"
import { MAX_GUESSES, cosineSimilarity, temperatureFor, toScore } from "./scoring.ts"
import {
  EmbedError,
  ensureScorer,
  getScorerSnapshot,
  retryScorer,
  subscribeScorer,
} from "./scorer.ts"
import { canGuess, isSolved, newDay, recordGuess, type DayState } from "./state.ts"
import { loadStats, recordDay, saveStats, type Stats } from "./stats.ts"
import { formatShareCard } from "./share.ts"
import { loadStoredDay, saveStoredDay } from "./storage.ts"

export type GameStatus = "loading-model" | "ready" | "model-error" | "prompt-error"

export interface DailyGame {
  readonly status: GameStatus
  readonly modelFile: string | null
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
}

const errorMessage = (cause: unknown): string =>
  cause instanceof EmbedError
    ? cause.message
    : cause instanceof Error
      ? cause.message
      : String(cause)

/**
 * Owns one daily hunt: model loading, scoring flow, persistence, sharing.
 * Photos stay in memory + thumbnails in localStorage; nothing uploads.
 */
export function useDailyGame(): DailyGame {
  const today = useMemo(() => promptFor(new Date()), [])
  const dayNumber = useMemo(() => shareDayNumber(new Date()), [])
  const promptEmbedding = useMemo(() => promptEmbeddingFor(today.prompt.id), [today])

  // Shared scorer lifecycle: one load for all mounts, StrictMode-safe.
  // ensureScorer is idempotent; the store dedupes concurrent calls.
  const loader = useSyncExternalStore(subscribeScorer, getScorerSnapshot)
  if (Option.isSome(promptEmbedding)) {
    ensureScorer()
  }
  const status: GameStatus = Option.isNone(promptEmbedding) ? "prompt-error" : loader.status
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
  const [scoring, setScoring] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [shared, setShared] = useState(false)
  const [stats, setStats] = useState<Stats>(loadStats)

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
      if (active === null || Option.isNone(promptEmbedding) || scoring || !canGuess(day)) {
        return
      }
      setScoring(true)
      setNotice(null)
      const promptVector = promptEmbedding.value
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
              clue: today.prompt.clues[temperature],
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
    [loader.scorer, promptEmbedding, scoring, day, thumbnails, persist, today.prompt.clues],
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

  return {
    status,
    modelFile: loader.file,
    modelFraction: loader.fraction,
    modelError: loader.error,
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
  }
}
