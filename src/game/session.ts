import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Effect, Option } from "effect"
import { promptEmbeddingFor } from "./embeddings.ts"
import { fileToThumbnail } from "./photo.ts"
import { promptFor, shareDayNumber } from "./prompts.ts"
import { MAX_GUESSES, cosineSimilarity, temperatureFor, toScore } from "./scoring.ts"
import { EmbedError, loadScorer, type LoadedScorer, type ModelFileProgress } from "./scorer.ts"
import { canGuess, isSolved, newDay, recordGuess, type DayState } from "./state.ts"
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

  const [status, setStatus] = useState<GameStatus>(() =>
    Option.isNone(promptEmbedding) ? "prompt-error" : "loading-model",
  )
  const [modelFile, setModelFile] = useState<string | null>(null)
  const [modelFraction, setModelFraction] = useState<number | null>(null)
  const [scorer, setScorer] = useState<LoadedScorer | null>(null)
  const [modelError, setModelError] = useState<string | null>(null)
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
  const [loadAttempt, setLoadAttempt] = useState(0)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (status !== "loading-model" || loadingRef.current) {
      return
    }
    loadingRef.current = true
    let cancelled = false
    void Effect.runPromise(
      loadScorer((progress: ModelFileProgress) => {
        if (!cancelled) {
          setModelFile(progress.file)
          setModelFraction(progress.fraction)
        }
      }),
    ).then(
      (loaded) => {
        if (!cancelled) {
          setScorer(loaded)
          setStatus("ready")
        }
        loadingRef.current = false
      },
      (cause: unknown) => {
        if (!cancelled) {
          setModelError(cause instanceof Error ? cause.message : String(cause))
          setStatus("model-error")
        }
        loadingRef.current = false
      },
    )
    return () => {
      cancelled = true
    }
  }, [status, loadAttempt])

  const persist = useCallback(
    (next: DayState, nextThumbnails: ReadonlyArray<string>) => {
      setDay(next)
      setThumbnails(nextThumbnails)
      saveStoredDay(today.dateKey, { day: next, thumbnails: [...nextThumbnails] })
    },
    [today.dateKey],
  )

  const retryLoad = useCallback(() => {
    setModelFile(null)
    setModelFraction(null)
    setModelError(null)
    setStatus("loading-model")
    setLoadAttempt((n) => n + 1)
  }, [])

  const scorePhoto = useCallback(
    (file: File) => {
      if (scorer === null || Option.isNone(promptEmbedding) || scoring || !canGuess(day)) {
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
          const vector = yield* scorer.embedImage(file)
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
    [scorer, promptEmbedding, scoring, day, thumbnails, persist, today.prompt.clues],
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
    modelFile,
    modelFraction,
    modelError,
    dayNumber,
    day,
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
