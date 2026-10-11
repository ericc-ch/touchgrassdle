/**
 * One-shot calibration for the scoring logistic (`src/game/scoring.ts`).
 * Embeds every prompt query plus Creative-Commons photos of each object
 * with the current MODEL_ID, then fits center/width to separate matches
 * from non-matches. Not part of any gate: run manually with
 * `pnpm exec tsx scripts/calibrate-scoring.ts` and bake the printed
 * constants into `scoring.ts` by hand.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { AutoConfig, AutoModel, AutoProcessor, RawImage } from "@huggingface/transformers"
import { PROMPTS } from "../src/game/prompts.ts"
import { cosineSimilarity, toScore } from "../src/game/scoring.ts"

/**
 * Must match MODEL_ID in `src/game/scorer.ts`. Kept as a copy (not an
 * import) so this script stays in the DOM-free node project.
 */
const MODEL_ID = "onnx-community/embeddinggemma-2-ONNX"

const OUT = join(tmpdir(), "touchgrassdle-calib")
mkdirSync(OUT, { recursive: true })

/**
 * Asymmetric retrieval prefix, from the docs/plan.md spike (EG2 0.979
 * human-order agreement, c=0.6578 w=0.0338). Queries carry it; photos
 * (the searched documents) embed raw.
 */
const QUERY_PREFIX = "task: search result | query: "

const SEARCH_TERMS: Readonly<Record<string, string>> = {
  "exit-sign": "exit sign",
  "wall-clock": "wall clock",
  bicycle: "bicycle",
  "potted-plant": "potted plant",
  "flowering-tree": "flowering tree",
  "sleeping-cat": "sleeping cat",
  "red-car": "red car",
  "fire-hydrant": "fire hydrant",
  "park-bench": "park bench",
  "street-lamp": "street lamp",
  fountain: "fountain",
  dog: "dog",
  bridge: "bridge",
  "traffic-cone": "traffic cone",
}

interface CommonsPage {
  readonly imageinfo?: ReadonlyArray<{
    readonly thumburl?: string
    readonly mime?: string
    readonly width?: number
  }>
}

async function commonsThumbs(terms: string, count: number): Promise<Array<string>> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `filetype:bitmap ${terms}`,
    gsrnamespace: "6",
    gsrlimit: "20",
    prop: "imageinfo",
    iiprop: "url|size|mime",
    iiurlwidth: "640",
  })
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`)
  const body = (await response.json()) as { query?: { pages?: Record<string, CommonsPage> } }
  const pages = Object.values(body.query?.pages ?? {})
  const urls: Array<string> = []
  for (const page of pages) {
    const info = page.imageinfo?.[0]
    if (
      info?.thumburl !== undefined &&
      info.mime === "image/jpeg" &&
      (info.width ?? 0) >= 400 &&
      urls.length < count
    ) {
      urls.push(info.thumburl)
    }
  }
  return urls
}

async function main(): Promise<void> {
  const config = await AutoConfig.from_pretrained(MODEL_ID)
  ;(config as unknown as { audio_config: unknown }).audio_config = null
  const processor = await AutoProcessor.from_pretrained(MODEL_ID)
  const model = await AutoModel.from_pretrained(MODEL_ID, {
    dtype: "q4f16",
    device: "cpu",
    config,
  })

  const embedText = async (text: string): Promise<Array<number>> => {
    const inputs = await processor(text)
    const output = (await model(inputs)) as unknown as {
      sentence_embedding: { tolist(): Array<Array<number>> }
    }
    const first = output.sentence_embedding.tolist()[0]
    if (first === undefined) {
      throw new Error(`no text embedding for ${text}`)
    }
    return first
  }
  const embedPhoto = async (path: string): Promise<Array<number>> => {
    const image = await RawImage.read(path)
    const inputs = await processor(null, [image])
    const output = (await model(inputs)) as unknown as {
      sentence_embedding: { tolist(): Array<Array<number>> }
    }
    const first = output.sentence_embedding.tolist()[0]
    if (first === undefined) {
      throw new Error(`no photo embedding for ${path}`)
    }
    return first
  }

  const queries = new Map<string, Array<number>>()
  for (const prompt of PROMPTS) {
    queries.set(prompt.id, await embedText(`${QUERY_PREFIX}${prompt.query}`))
    console.log(`query ${prompt.id}`)
  }
  const dim = queries.get(PROMPTS[0]?.id ?? "")?.length ?? 0
  console.log(`embedding dim: ${dim}`)

  const matches: Array<number> = []
  const nonMatches: Array<number> = []
  for (const prompt of PROMPTS) {
    const terms = SEARCH_TERMS[prompt.id] ?? prompt.id
    const urls = await commonsThumbs(terms, 2)
    console.log(`${prompt.id}: ${urls.length} photos`)
    let index = 0
    for (const url of urls) {
      const path = join(OUT, `${prompt.id}-${index}.jpg`)
      const bytes = Buffer.from(await (await fetch(url)).arrayBuffer())
      writeFileSync(path, bytes)
      const vector = await embedPhoto(path)
      for (const other of PROMPTS) {
        const cosine = cosineSimilarity(vector, queries.get(other.id) ?? [])
        if (other.id === prompt.id) {
          matches.push(cosine)
        } else {
          nonMatches.push(cosine)
        }
      }
      index++
    }
  }

  const mean = (values: ReadonlyArray<number>): number =>
    values.reduce((a, b) => a + b, 0) / values.length
  console.log(
    `matches n=${matches.length} mean=${mean(matches).toFixed(4)} min=${Math.min(...matches).toFixed(4)}`,
  )
  console.log(
    `non n=${nonMatches.length} mean=${mean(nonMatches).toFixed(4)} max=${Math.max(...nonMatches).toFixed(4)}`,
  )

  const likelihood = (center: number, width: number): number => {
    let total = 0
    const score = (c: number): number => 1 / (1 + Math.exp(-(c - center) / width))
    for (const c of matches) {
      total += Math.log(Math.min(1 - 1e-9, Math.max(1e-9, score(c))))
    }
    for (const c of nonMatches) {
      total += Math.log(Math.min(1 - 1e-9, Math.max(1e-9, 1 - score(c))))
    }
    return total
  }
  let best = { center: 0, width: 1, ll: Number.NEGATIVE_INFINITY }
  const lo = Math.min(...nonMatches)
  const hi = Math.max(...matches)
  for (let center = lo; center <= hi; center += (hi - lo) / 200) {
    for (let width = 0.005; width <= 0.3; width *= 1.15) {
      const ll = likelihood(center, width)
      if (ll > best.ll) {
        best = { center, width, ll }
      }
    }
  }
  console.log(`fit center=${best.center.toFixed(4)} width=${best.width.toFixed(4)}`)
  console.log(`toScore(0) with current constants = ${toScore(0)}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
