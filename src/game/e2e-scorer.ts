import { Effect, Option } from "effect"
import { promptEmbeddingFor } from "./embeddings.ts"
import { promptFor } from "./prompts.ts"
import type { LoadedScorer } from "./scorer.ts"
import type { Embedding } from "./scoring.ts"

/**
 * Test-only scorer modes, gated behind the `e2eScorer` query param.
 * Production (no param) always loads the real on-device model.
 *
 * - `stub`: ready instantly, scores every photo 7 (Frozen). The 1-d
 *   vector mismatches the 768-d prompt embeddings, so cosine is 0 and
 *   the fixed logistic maps it to 7. No network, fully deterministic.
 * - `solve`: ready instantly, scores every photo 100 (Blazing) by
 *   returning today's prompt embedding (cosine 1).
 * - `fail`: fails instantly with `ModelLoadError`, exercising the
 *   Judge-unavailable + Retry path without downloading anything.
 */
export type E2EScorerMode = "stub" | "solve" | "fail"

/** Read the E2E scorer mode from the URL. Null in production and Node. */
export function readE2EScorerMode(): E2EScorerMode | null {
  if (typeof window === "undefined") {
    return null
  }
  const mode = new URLSearchParams(window.location.search).get("e2eScorer")
  return mode === "stub" || mode === "solve" || mode === "fail" ? mode : null
}

const COLD_VECTOR: Embedding = [1]

/** Instant scorer for `stub` / `solve` modes. No network involved. */
export function e2eStubScorer(mode: "stub" | "solve"): LoadedScorer {
  return {
    embedImage: () => {
      if (mode === "solve") {
        const embedding = promptEmbeddingFor(promptFor(new Date()).prompt.id)
        if (Option.isSome(embedding)) {
          return Effect.succeed(embedding.value)
        }
      }
      return Effect.succeed(COLD_VECTOR)
    },
  }
}
