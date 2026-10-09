/**
 * Manual pipeline check (not part of `pnpm check`; downloads ~100MB once).
 * Scores a known football photo: the matching text must land hot,
 * unrelated prompts must land cold.
 */
import {
  AutoProcessor,
  AutoTokenizer,
  SiglipTextModel,
  SiglipVisionModel,
  load_image,
} from "@huggingface/transformers"
import { cosineSimilarity, toScore } from "../src/game/scoring.ts"

const MODEL_ID = "onnx-community/siglip2-base-patch16-224-ONNX"

const vec = (rows: unknown): Array<number> => {
  const first = (rows as ReadonlyArray<ReadonlyArray<number>>)[0]
  if (first === undefined) {
    throw new Error("empty embedding")
  }
  return [...first]
}

async function main(): Promise<void> {
  const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID)
  const processor = await AutoProcessor.from_pretrained(MODEL_ID)
  const textModel = await SiglipTextModel.from_pretrained(MODEL_ID, { dtype: "q4f16" })
  const visionModel = await SiglipVisionModel.from_pretrained(MODEL_ID, { dtype: "q4f16" })

  const text = async (query: string): Promise<Array<number>> => {
    const inputs = tokenizer([query], { padding: "max_length", truncation: true, max_length: 64 })
    const { pooler_output } = await textModel(inputs)
    return vec(pooler_output.tolist())
  }
  const image = await load_image(
    "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/football-match.jpg",
  )
  const { pooler_output } = await visionModel(await processor(image))
  const photo = vec(pooler_output.tolist())

  const match = toScore(cosineSimilarity(photo, await text("a photo of a football match")))
  const cat = toScore(cosineSimilarity(photo, await text("a photo of a sleeping cat")))
  const sign = toScore(cosineSimilarity(photo, await text("a photo of an exit sign")))
  console.log({ match, cat, sign })
  if (!(match >= 70 && cat < 30 && sign < 30)) {
    throw new Error("pipeline ordering broken")
  }
  console.log("pipeline ok")
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
