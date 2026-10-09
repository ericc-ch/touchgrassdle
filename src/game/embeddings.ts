import { Option } from "effect"
import rawEmbeddings from "./prompt-embeddings.json"
import { parseEmbedding, type Embedding } from "./scoring.ts"

/**
 * Prompt text embeddings precomputed at build time (`pnpm precompute`).
 * Same model + quantization as the browser scorer, so the calibrated
 * logistic applies to both sides of the cosine.
 */
export function promptEmbeddingFor(promptId: string): Option.Option<Embedding> {
  const record = rawEmbeddings as Record<string, unknown>
  const raw = record[promptId]
  if (raw === undefined) {
    return Option.none()
  }
  return parseEmbedding(raw)
}
