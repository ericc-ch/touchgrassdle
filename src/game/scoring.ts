import { Option, Schema } from "effect"

/** Cosine-similarity center of the scoring logistic (plan §spike, EG2). */
export const COSINE_CENTER = 0.6578

/** Width of the scoring logistic (plan §spike, EG2). */
export const COSINE_WIDTH = 0.0338

/** A guess at or above this score solves the daily. */
export const SOLVE_THRESHOLD = 80

/** Maximum guesses per day. */
export const MAX_GUESSES = 6

/** Integer closeness score, 0 (far) to 100 (exact). */
export const Score = Schema.Int.check(
  Schema.isGreaterThanOrEqualTo(0),
  Schema.isLessThanOrEqualTo(100),
)
export type Score = typeof Score.Type

/** Temperature band for a score. `blazing` (>= threshold) means solved. */
export const Temperature = Schema.Literals(["frozen", "cool", "warm", "hot", "blazing"])
export type Temperature = typeof Temperature.Type

/** One embedding vector: non-empty finite floats. */
export const Embedding = Schema.Array(Schema.Finite).check(Schema.isNonEmpty())
export type Embedding = typeof Embedding.Type

/**
 * Parse an unknown value into an embedding vector.
 *
 * @example
 * ```ts
 * parseEmbedding([0.1, -0.2]) // Some([0.1, -0.2])
 * parseEmbedding([]) // None
 * ```
 */
export function parseEmbedding(raw: unknown): Option.Option<Embedding> {
  return Schema.decodeUnknownOption(Embedding)(raw)
}

/**
 * Map a cosine similarity to a 0-100 score with the fixed logistic.
 * Pure math; inputs outside the calibrated range clamp to the ends.
 *
 * @example
 * ```ts
 * toScore(0.6578) // 50
 * ```
 */
export function toScore(cosine: number): Score {
  const raw = 100 / (1 + Math.exp(-(cosine - COSINE_CENTER) / COSINE_WIDTH))
  if (!Number.isFinite(raw)) {
    return 0
  }
  return Math.min(100, Math.max(0, Math.round(raw)))
}

/**
 * Monotonic load progress for the UI. Multi-file downloads report one
 * fraction per file, so the raw numbers jump backwards as files interleave
 * (and the bar + % text flicker). The UI shows only the high-water mark,
 * which can only rise. Pure for testing.
 *
 * @example
 * ```ts
 * nextFraction(0.5, 0.2) // 0.5
 * ```
 */
export function nextFraction(shown: number | null, incoming: number): number {
  const clamped = Number.isFinite(incoming) ? Math.min(1, Math.max(0, incoming)) : 0
  return shown === null ? clamped : Math.max(shown, clamped)
}

/**
 * Cosine similarity of two vectors.
 * Returns 0 for empty or mismatched vectors; the scorer service
 * rejects dimension mismatches as errors instead of scoring them.
 */
export function cosineSimilarity(a: ReadonlyArray<number>, b: ReadonlyArray<number>): number {
  if (a.length === 0 || a.length !== b.length) {
    return 0
  }
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    const x = a[i]
    const y = b[i]
    if (x === undefined || y === undefined) {
      return 0
    }
    dot += x * y
    normA += x * x
    normB += y * y
  }
  if (normA === 0 || normB === 0) {
    return 0
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Temperature band for a score. `blazing` (>= 80) is the solve band.
 */
export function temperatureFor(score: Score): Temperature {
  if (score >= SOLVE_THRESHOLD) {
    return "blazing"
  }
  if (score >= 65) {
    return "hot"
  }
  if (score >= 50) {
    return "warm"
  }
  if (score >= 30) {
    return "cool"
  }
  return "frozen"
}
