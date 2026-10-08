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

const p = (
  id: string,
  query: string,
  label: string,
  clues: Record<Temperature, string>,
): Prompt => ({ id, query, label, clues })

/**
 * 14 concrete, region-free, single-thing prompts, rotated by UTC date.
 * Clues never name the thing; they sharpen as the temperature rises.
 */
export const PROMPTS: ReadonlyArray<Prompt> = [
  p("exit-sign", "a photo of an exit sign", "Exit sign", {
    frozen: "Look for something humans put up to point other humans somewhere.",
    cool: "It glows. You walk past it without reading it.",
    warm: "Red letters, or sometimes green. Above head height.",
    hot: "It marks the way out of a building.",
    blazing: "E-X-I-T. Photograph the sign itself.",
  }),
  p("wall-clock", "a photo of a wall clock", "Wall clock", {
    frozen: "Something that was right twice today without trying.",
    cool: "It hangs around and watches everyone. Nobody watches back.",
    warm: "Round face, moving hands. Tells you you're late.",
    hot: "Twelve numbers in a circle on a wall.",
    blazing: "A clock on a wall. Get its face in frame.",
  }),
  p("bicycle", "a photo of a bicycle", "Bicycle", {
    frozen: "Two circles and a human engine.",
    cool: "It leans on things when it's resting.",
    warm: "Pedals, chain, handlebars. Locked to a rack near you.",
    hot: "A two-wheeled ride you power with your legs.",
    blazing: "A bicycle. Whole thing, both wheels.",
  }),
  p("potted-plant", "a photo of a potted plant", "Potted plant", {
    frozen: "Something alive that never moves.",
    cool: "It drinks but has no mouth.",
    warm: "Leaves above, soil below, contained in something breakable.",
    hot: "A plant someone keeps in a pot, indoors or by a door.",
    blazing: "A potted plant. Leaves and pot both in frame.",
  }),
  p("flowering-tree", "a photo of a flowering tree", "Flowering tree", {
    frozen: "Look up. Something tall is showing off.",
    cool: "Wood that decided to wear color.",
    warm: "Blossoms or blooms on branches, not in a vase.",
    hot: "A tree currently covered in flowers.",
    blazing: "A flowering tree. Branches and blooms together.",
  }),
  p("sleeping-cat", "a photo of a sleeping cat", "Sleeping cat", {
    frozen: "Something warm is ignoring the world right now.",
    cool: "It purrs when awake. Right now: loaf mode.",
    warm: "Fur, whiskers, eyes firmly shut.",
    hot: "A cat, asleep. Curled, stretched, or splooted.",
    blazing: "A sleeping cat. Don't wake it for the photo.",
  }),
  p("red-car", "a photo of a red car", "Red car", {
    frozen: "Something red that costs more than your phone.",
    cool: "It has four shoes and never walks.",
    warm: "Parked or rolling, with plates and windows.",
    hot: "A car, and the paint job matters: red.",
    blazing: "A red car. The whole car, clearly red.",
  }),
  p("fire-hydrant", "a photo of a fire hydrant", "Fire hydrant", {
    frozen: "Short, stubby, and only heroes touch it.",
    cool: "It stands on sidewalks holding back a flood.",
    warm: "Cast iron, side caps, usually yellow or red.",
    hot: "Firefighters hook hoses to it.",
    blazing: "A fire hydrant. Get low and frame it.",
  }),
  p("park-bench", "a photo of a park bench", "Park bench", {
    frozen: "A seat with no reservation system.",
    cool: "Wood slats or iron, facing something nice.",
    warm: "Made for strangers to sit side by side.",
    hot: "A bench in a park, plaza, or along a path.",
    blazing: "A park bench. Empty or occupied, show the bench.",
  }),
  p("street-lamp", "a photo of a street lamp", "Street lamp", {
    frozen: "It works the night shift every night.",
    cool: "Tall, thin, and brighter than the moon.",
    warm: "A pole with a light on top, along a road.",
    hot: "It turns on at dusk without being asked.",
    blazing: "A street lamp. Pole and lamp head in frame.",
  }),
  p("fountain", "a photo of a water fountain", "Water fountain", {
    frozen: "Water that forgot how to be still.",
    cool: "It throws water in the air for fun.",
    warm: "Stone basin, jets, spray. In a square or park.",
    hot: "A decorative fountain with running water.",
    blazing: "A water fountain. Catch the spray mid-air.",
  }),
  p("dog", "a photo of a dog", "Dog", {
    frozen: "Someone's best friend is outside right now.",
    cool: "Four legs, loud opinions about squirrels.",
    warm: "Wagging tail, wet nose, on a walk or in a yard.",
    hot: "A dog. Any size, any breed.",
    blazing: "A dog. Face in frame if it'll hold still.",
  }),
  p("bridge", "a photo of a bridge", "Bridge", {
    frozen: "A shortcut over something you'd rather not cross.",
    cool: "It holds you up over water, roads, or a gap.",
    warm: "Rails, span, supports. Big enough to walk or drive on.",
    hot: "A bridge. Footbridge counts.",
    blazing: "A bridge. Show the span, not just the railing.",
  }),
  p("traffic-cone", "a photo of a traffic cone", "Traffic cone", {
    frozen: "Orange, pointy, and always in the way on purpose.",
    cool: "It guards holes and fresh paint.",
    warm: "Plastic cone with a white stripe, on a road.",
    hot: "Roadwork's favorite decoration. Usually orange.",
    blazing: "A traffic cone. One cone is enough.",
  }),
]

/** UTC midnight day number for a date (days since Unix epoch). */
export function utcDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400_000,
  )
}

/** First hunt day: 2026-10-09 UTC. Share cards count from #1. */
export const FIRST_DAY_NUMBER = utcDayNumber(new Date("2026-10-09T00:00:00Z"))

/** Share-card day number, 1-based from the first hunt. */
export function shareDayNumber(date: Date): number {
  return utcDayNumber(date) - FIRST_DAY_NUMBER + 1
}

/** Prompt index for a date: stable worldwide, wraps the list. */
export function promptIndexFor(date: Date): number {
  const count = PROMPTS.length
  const first = PROMPTS[0]
  if (count === 0 || first === undefined) {
    throw new Error("no prompts configured")
  }
  return (((utcDayNumber(date) - FIRST_DAY_NUMBER) % count) + count) % count
}

/** The prompt (and UTC date key) for a date. */
export function promptFor(date: Date): { readonly dateKey: string; readonly prompt: Prompt } {
  const prompt = PROMPTS[promptIndexFor(date)]
  if (prompt === undefined) {
    throw new Error("no prompts configured")
  }
  return { dateKey: date.toISOString().slice(0, 10), prompt }
}
