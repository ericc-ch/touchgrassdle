import { Schema } from "effect"
import { Temperature } from "./scoring.ts"

/** One daily prompt: embedding query, revealed label, and a clue per band. */
export const Prompt = Schema.Struct({
  id: Schema.String,
  query: Schema.String,
  label: Schema.String,
  clues: Schema.Record(Temperature, Schema.String),
})
export type Prompt = typeof Prompt.Type

/**
 * 30 concrete, region-free, single-thing prompts, dealt as fixed triples
 * by UTC date. The bank stays a multiple of three so every day holds a
 * full triple and no prompt repeats within a cycle.
 * Clues never name the thing; they sharpen as the temperature rises.
 */
export const PROMPTS: ReadonlyArray<Prompt> = [
  {
    id: "exit-sign",
    query: "a photo of an exit sign",
    label: "Exit sign",
    clues: {
      frozen: "Look for something humans put up to point other humans somewhere.",
      cool: "It glows. You walk past it without reading it.",
      warm: "Red letters, or sometimes green. Above head height.",
      hot: "It marks the way out of a building.",
      blazing: "E-X-I-T. Photograph the sign itself.",
    },
  },
  {
    id: "wall-clock",
    query: "a photo of a wall clock",
    label: "Wall clock",
    clues: {
      frozen: "Something that was right twice today without trying.",
      cool: "It hangs around and watches everyone. Nobody watches back.",
      warm: "Round face, moving hands. Tells you you're late.",
      hot: "Twelve numbers in a circle on a wall.",
      blazing: "A clock on a wall. Get its face in frame.",
    },
  },
  {
    id: "bicycle",
    query: "a photo of a bicycle",
    label: "Bicycle",
    clues: {
      frozen: "Two circles and a human engine.",
      cool: "It leans on things when it's resting.",
      warm: "Pedals, chain, handlebars. Locked to a rack near you.",
      hot: "A two-wheeled ride you power with your legs.",
      blazing: "A bicycle. Whole thing, both wheels.",
    },
  },
  {
    id: "potted-plant",
    query: "a photo of a potted plant",
    label: "Potted plant",
    clues: {
      frozen: "Something alive that never moves.",
      cool: "It drinks but has no mouth.",
      warm: "Leaves above, soil below, contained in something breakable.",
      hot: "A plant someone keeps in a pot, indoors or by a door.",
      blazing: "A potted plant. Leaves and pot both in frame.",
    },
  },
  {
    id: "flowering-tree",
    query: "a photo of a flowering tree",
    label: "Flowering tree",
    clues: {
      frozen: "Look up. Something tall is showing off.",
      cool: "Wood that decided to wear color.",
      warm: "Blossoms or blooms on branches, not in a vase.",
      hot: "A tree currently covered in flowers.",
      blazing: "A flowering tree. Branches and blooms together.",
    },
  },
  {
    id: "sleeping-cat",
    query: "a photo of a sleeping cat",
    label: "Sleeping cat",
    clues: {
      frozen: "Something warm is ignoring the world right now.",
      cool: "It purrs when awake. Right now: loaf mode.",
      warm: "Fur, whiskers, eyes firmly shut.",
      hot: "A cat, asleep. Curled, stretched, or splooted.",
      blazing: "A sleeping cat. Don't wake it for the photo.",
    },
  },
  {
    id: "red-car",
    query: "a photo of a red car",
    label: "Red car",
    clues: {
      frozen: "Something red that costs more than your phone.",
      cool: "It has four shoes and never walks.",
      warm: "Parked or rolling, with plates and windows.",
      hot: "A car, and the paint job matters: red.",
      blazing: "A red car. The whole car, clearly red.",
    },
  },
  {
    id: "fire-hydrant",
    query: "a photo of a fire hydrant",
    label: "Fire hydrant",
    clues: {
      frozen: "Short, stubby, and only heroes touch it.",
      cool: "It stands on sidewalks holding back a flood.",
      warm: "Cast iron, side caps, usually yellow or red.",
      hot: "Firefighters hook hoses to it.",
      blazing: "A fire hydrant. Get low and frame it.",
    },
  },
  {
    id: "park-bench",
    query: "a photo of a park bench",
    label: "Park bench",
    clues: {
      frozen: "A seat with no reservation system.",
      cool: "Wood slats or iron, facing something nice.",
      warm: "Made for strangers to sit side by side.",
      hot: "A bench in a park, plaza, or along a path.",
      blazing: "A park bench. Empty or occupied, show the bench.",
    },
  },
  {
    id: "street-lamp",
    query: "a photo of a street lamp",
    label: "Street lamp",
    clues: {
      frozen: "It works the night shift every night.",
      cool: "Tall, thin, and brighter than the moon.",
      warm: "A pole with a light on top, along a road.",
      hot: "It turns on at dusk without being asked.",
      blazing: "A street lamp. Pole and lamp head in frame.",
    },
  },
  {
    id: "fountain",
    query: "a photo of a water fountain",
    label: "Water fountain",
    clues: {
      frozen: "Water that forgot how to be still.",
      cool: "It throws water in the air for fun.",
      warm: "Stone basin, jets, spray. In a square or park.",
      hot: "A decorative fountain with running water.",
      blazing: "A water fountain. Catch the spray mid-air.",
    },
  },
  {
    id: "dog",
    query: "a photo of a dog",
    label: "Dog",
    clues: {
      frozen: "Someone's best friend is outside right now.",
      cool: "Four legs, loud opinions about squirrels.",
      warm: "Wagging tail, wet nose, on a walk or in a yard.",
      hot: "A dog. Any size, any breed.",
      blazing: "A dog. Face in frame if it'll hold still.",
    },
  },
  {
    id: "bridge",
    query: "a photo of a bridge",
    label: "Bridge",
    clues: {
      frozen: "A shortcut over something you'd rather not cross.",
      cool: "It holds you up over water, roads, or a gap.",
      warm: "Rails, span, supports. Big enough to walk or drive on.",
      hot: "A bridge. Footbridge counts.",
      blazing: "A bridge. Show the span, not just the railing.",
    },
  },
  {
    id: "traffic-cone",
    query: "a photo of a traffic cone",
    label: "Traffic cone",
    clues: {
      frozen: "Orange, pointy, and always in the way on purpose.",
      cool: "It guards holes and fresh paint.",
      warm: "Plastic cone with a white stripe, on a road.",
      hot: "Roadwork's favorite decoration. Usually orange.",
      blazing: "A traffic cone. One cone is enough.",
    },
  },
  {
    id: "book",
    query: "a photo of a book",
    label: "Book",
    clues: {
      frozen: "It speaks without a mouth.",
      cool: "Pages bound together, no battery needed.",
      warm: "Paper pages with a cover, text inside.",
      hot: "A bound book with pages you flip.",
      blazing: "A book. Cover and pages in frame.",
    },
  },
  {
    id: "motorcycle",
    query: "a photo of a motorcycle",
    label: "Motorcycle",
    clues: {
      frozen: "Two wheels and an engine that shouts.",
      cool: "It parks between cars and roars away.",
      warm: "Handlebars, exhaust, no pedals.",
      hot: "A motorbike you ride, with a loud engine.",
      blazing: "A motorcycle. Whole bike, both wheels in frame.",
    },
  },
  {
    id: "coffee-mug",
    query: "a photo of a coffee mug",
    label: "Coffee mug",
    clues: {
      frozen: "Something warm waits for you each morning.",
      cool: "It has an ear but never listens.",
      warm: "Ceramic, with a handle, holds something hot.",
      hot: "Coffee or tea inside a handled cup.",
      blazing: "A coffee mug. Cup and handle in frame.",
    },
  },
  {
    id: "chicken",
    query: "a photo of a chicken",
    label: "Chicken",
    clues: {
      frozen: "Something that woke you up before your alarm.",
      cool: "Feathers, beak, loud opinions at dawn.",
      warm: "Clucks, pecks the ground, lays eggs.",
      hot: "A hen or rooster, feathers and beak.",
      blazing: "A chicken. Whole bird in frame.",
    },
  },
  {
    id: "car-tire",
    query: "a photo of a car tire",
    label: "Car tire",
    clues: {
      frozen: "Black, round, and tired of the road.",
      cool: "It touches the ground so the rest doesn't have to.",
      warm: "Rubber ring with tread, around a metal wheel.",
      hot: "A rubber tire on a car, tread visible.",
      blazing: "A car tire. Tire and wheel in frame.",
    },
  },
  {
    id: "staircase",
    query: "a photo of a staircase",
    label: "Staircase",
    clues: {
      frozen: "You climb it without leaving the building.",
      cool: "Steps going up, with a rail to hold.",
      warm: "Concrete or wooden steps, indoors or out.",
      hot: "A flight of stairs with steps and railing.",
      blazing: "A staircase. Several steps in frame.",
    },
  },
  {
    id: "banana",
    query: "a photo of a banana",
    label: "Banana",
    clues: {
      frozen: "It comes in its own yellow wrapper.",
      cool: "Peel it and the inside is white.",
      warm: "Curved yellow fruit, in a bunch or single.",
      hot: "A yellow banana, peel on or off.",
      blazing: "A banana. Whole fruit in frame.",
    },
  },
  {
    id: "city-bus",
    query: "a photo of a city bus",
    label: "City bus",
    clues: {
      frozen: "Long, loud, and full of strangers.",
      cool: "It stops even when you don't want it to.",
      warm: "Big windows, doors that fold, route number up front.",
      hot: "A large bus for city passengers.",
      blazing: "A city bus. Whole side in frame.",
    },
  },
  {
    id: "umbrella",
    query: "a photo of an umbrella",
    label: "Umbrella",
    clues: {
      frozen: "It only works when the sky is broken.",
      cool: "Folds up thin, opens into a roof.",
      warm: "Fabric over ribs, with a handle to hold.",
      hot: "Opens above your head against rain or sun.",
      blazing: "An umbrella. Open or closed, show it whole.",
    },
  },
  {
    id: "soccer-ball",
    query: "a photo of a soccer ball",
    label: "Soccer ball",
    clues: {
      frozen: "Black and white patches, kicked around for fun.",
      cool: "Round, stitched, rolls away from feet.",
      warm: "Patchwork panels on a round ball.",
      hot: "A ball kicked in a field game.",
      blazing: "A soccer ball. Whole ball in frame.",
    },
  },
  {
    id: "traffic-light",
    query: "a photo of a traffic light",
    label: "Traffic light",
    clues: {
      frozen: "Red means stop even when nobody is there.",
      cool: "It hangs over the road changing its mind.",
      warm: "Red, yellow, green stacked vertically.",
      hot: "Signals for cars at an intersection.",
      blazing: "A traffic light. All three lamps in frame.",
    },
  },
  {
    id: "backpack",
    query: "a photo of a backpack",
    label: "Backpack",
    clues: {
      frozen: "It carries your day on your shoulders.",
      cool: "Two straps, one main pocket, zippers.",
      warm: "Fabric bag worn on the back, for school or travel.",
      hot: "Straps and zipped compartments on your back.",
      blazing: "A backpack. Whole bag with straps in frame.",
    },
  },
  {
    id: "trash-bin",
    query: "a photo of a trash bin",
    label: "Trash bin",
    clues: {
      frozen: "Everything you throw away lands here.",
      cool: "Plastic or metal, with a lid, on the street.",
      warm: "Cylinder that holds bags of rubbish.",
      hot: "A bin for garbage, indoors or on a sidewalk.",
      blazing: "A trash bin. Whole bin in frame.",
    },
  },
  {
    id: "front-door",
    query: "a photo of a front door",
    label: "Front door",
    clues: {
      frozen: "Everyone knocks here first.",
      cool: "Wood or metal, with a handle and a lock.",
      warm: "The main entrance to a house or flat.",
      hot: "A door you enter through, handle and frame.",
      blazing: "A front door. Whole door in frame.",
    },
  },
  {
    id: "helmet",
    query: "a photo of a motorcycle helmet",
    label: "Motorcycle helmet",
    clues: {
      frozen: "Hard shell for a soft head.",
      cool: "Visor in front, strap under the chin.",
      warm: "Round shell that protects a rider's skull.",
      hot: "Worn by motorbike riders, visor and shell.",
      blazing: "A motorcycle helmet. Whole helmet in frame.",
    },
  },
  {
    id: "shoes",
    query: "a photo of a pair of shoes",
    label: "Pair of shoes",
    clues: {
      frozen: "They go out more than you do.",
      cool: "Laces or straps, soles worn thin.",
      warm: "Two matching shoes, side by side.",
      hot: "Footwear with soles and laces.",
      blazing: "A pair of shoes. Both shoes in frame.",
    },
  },
]

/** UTC midnight day number for a date (days since Unix epoch). */
export function utcDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400_000,
  )
}

/** First day: 2026-10-09 UTC. Share cards count from #1. */
export const FIRST_DAY_NUMBER = utcDayNumber(new Date("2026-10-09T00:00:00Z"))

/**
 * Retrieval-task prefix the encoder was calibrated with (docs/plan.md
 * spike: EG2 0.979 human-order agreement). Queries carry it; photos
 * (the searched documents) embed raw.
 */
export const QUERY_PREFIX = "task: search result | query: "

/** Share-card day number, 1-based from the first day. */
export function shareDayNumber(date: Date): number {
  return utcDayNumber(date) - FIRST_DAY_NUMBER + 1
}

/** Prompts dealt per day. Fixed triples, never a partial set. */
export const TRIPLE_SIZE = 3

/**
 * Daily triple for a date: three consecutive bank entries, stable
 * worldwide, cycling every bank-length / 3 days. Adjacent days never
 * share a prompt: day N takes entries 3N..3N+2 modulo the bank.
 *
 * @example
 * ```ts
 * tripleFor(new Date("2026-10-09T12:00:00Z")).prompts.map((p) => p.id)
 * // ["exit-sign", "wall-clock", "bicycle"]
 * ```
 */
export function tripleFor(date: Date): {
  readonly dateKey: string
  readonly prompts: readonly [Prompt, Prompt, Prompt]
} {
  const count = PROMPTS.length
  const first = PROMPTS[0]
  if (count === 0 || first === undefined || count % TRIPLE_SIZE !== 0) {
    throw new Error("prompt bank must hold a multiple of three prompts")
  }
  const triples = count / TRIPLE_SIZE
  const dayDiff = utcDayNumber(date) - FIRST_DAY_NUMBER
  const triple = (((dayDiff % triples) + triples) % triples) * TRIPLE_SIZE
  const a = PROMPTS[triple]
  const b = PROMPTS[triple + 1]
  const c = PROMPTS[triple + 2]
  if (a === undefined || b === undefined || c === undefined) {
    throw new Error("prompt bank misaligned")
  }
  return { dateKey: date.toISOString().slice(0, 10), prompts: [a, b, c] }
}

/**
 * Hint bands in sharpening order. The starting hint always shows `frozen`;
 * each attempt unlocks the next-sharpest hint by attempt number, not by
 * score — score bands would repeat (two frozen guesses show the same
 * clue twice) while the game runs out of attempts.
 */
const CLUE_ORDER: ReadonlyArray<Temperature> = ["frozen", "cool", "warm", "hot", "blazing"]

/**
 * The hint for the attempt at `attemptIndex` (0-based count of guesses
 * already made). Attempt 1 shows `cool`, 2 `warm`, 3 `hot`, 4+ `blazing`.
 *
 * @example
 * ```ts
 * clueForAttempt(bicycle, 0) // "It leans on things when it's resting."
 * ```
 */
export function clueForAttempt(prompt: Prompt, attemptIndex: number): string {
  const slot = Math.min(Math.max(attemptIndex + 1, 1), CLUE_ORDER.length - 1)
  return prompt.clues[CLUE_ORDER[slot] ?? "blazing"]
}
