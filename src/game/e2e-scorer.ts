import { Effect } from "effect"
import type { LoadedScorer } from "./scorer.ts"
import type { Embedding } from "./scoring.ts"

/**
 * Test-only scorer modes, gated behind the `e2eScorer` query param.
 * Production (no param) always loads the real on-device model.
 *
 * - `stub`: ready instantly, scores every photo 7. The 1-d
 *   image vector mismatches the 768-d on-device prompt vector,
 *   so cosine is 0 and the fixed logistic maps it to 7.
 *   No network, fully deterministic.
 * - `solve`: ready instantly, scores every photo 100 by
 *   returning the same vector for image and prompt (cosine 1).
 * - `fail`: fails instantly with `ModelLoadError`, exercising the
 *   photo-scorer-unavailable + Retry path without downloading anything.
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

/** Stands in for today's on-device text embedding. */
const STUB_PROMPT_VECTOR: Embedding = Array.from({ length: 768 }, (_, index) =>
  index === 0 ? 1 : 0,
)

/** Instant scorer for `stub` / `solve` modes. No network involved. */
export function e2eStubScorer(mode: "stub" | "solve"): LoadedScorer {
  return {
    embedImage: () => {
      if (mode === "solve") {
        return Effect.succeed(STUB_PROMPT_VECTOR)
      }
      return Effect.succeed(COLD_VECTOR)
    },
    embedText: () => Effect.succeed(STUB_PROMPT_VECTOR),
  }
}
