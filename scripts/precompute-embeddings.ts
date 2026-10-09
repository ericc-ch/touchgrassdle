/**
 * Precompute SigLIP2 text embeddings for every prompt query.
 *
 * Run: `pnpm precompute`
 * Output: `src/game/prompt-embeddings.json` (committed, shipped to browsers).
 *
 * Uses the same model + quantization as the browser scorer so the
 * calibrated logistic applies to both sides of the cosine.
 */
import { writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { AutoTokenizer, SiglipTextModel } from "@huggingface/transformers"
import { PROMPTS } from "../src/game/prompts.ts"

const MODEL_ID = "onnx-community/siglip2-base-patch16-224-ONNX"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

const round6 = (values: ReadonlyArray<number>): Array<number> =>
  values.map((v) => Math.round(v * 1e6) / 1e6)

async function main(): Promise<void> {
  console.log(`loading ${MODEL_ID} (text encoder, q4f16)…`)
  const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID)
  const textModel = await SiglipTextModel.from_pretrained(MODEL_ID, {
    dtype: "q4f16",
    progress_callback: (progress: unknown) => {
      if (
        typeof progress === "object" &&
        progress !== null &&
        "file" in progress &&
        "progress" in progress
      ) {
        const { file, progress: pct } = progress as { file: unknown; progress: unknown }
        if (typeof pct === "number") {
          console.log(`  ${String(file)} ${pct.toFixed(0)}%`)
        }
      }
    },
  })

  const out: Record<string, Array<number>> = {}
  for (const prompt of PROMPTS) {
    const inputs = tokenizer([prompt.query], {
      padding: "max_length",
      truncation: true,
      max_length: 64,
    })
    const { pooler_output } = await textModel(inputs)
    const rows = pooler_output.tolist() as ReadonlyArray<ReadonlyArray<number>>
    const first = rows[0]
    if (first === undefined) {
      throw new Error(`no embedding for ${prompt.id}`)
    }
    out[prompt.id] = round6(first)
    console.log(`${prompt.id}: ${first.length}d`)
  }

  const path = join(root, "src", "game", "prompt-embeddings.json")
  await writeFile(path, `${JSON.stringify(out)}\n`)
  console.log(`wrote ${path}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
