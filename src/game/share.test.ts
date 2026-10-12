import { describe, expect, it } from "vitest"
import { formatShareCard, squareFor } from "./share.ts"
import { advance, newDay, recordGuess, type TripleIds } from "./state.ts"

const triple: TripleIds = ["bicycle", "banana", "motorcycle"]

describe("squareFor", () => {
  it("ramps cold to hot", () => {
    expect(squareFor("frozen")).toBe("🟦")
    expect(squareFor("cool")).toBe("🟩")
    expect(squareFor("warm")).toBe("🟨")
    expect(squareFor("hot")).toBe("🟧")
    expect(squareFor("blazing")).toBe("🟥")
  })
})

describe("formatShareCard", () => {
  it("names the played object without photos", () => {
    let day = newDay("2026-10-09", triple)
    day = recordGuess(day, { score: 55, temperature: "warm", takenAt: 0 })
    day = recordGuess(day, { score: 92, temperature: "blazing", takenAt: 0 })
    expect(formatShareCard(12, day, { choiceLabel: "Bicycle", gaveUpLabels: [] })).toBe(
      "Snapdle #12 (Bicycle) 2/6 · best 92\n🟨🟥⬛⬛⬛⬛",
    )
  })

  it("lists skipped objects after the score", () => {
    let day = newDay("2026-10-09", triple)
    day = recordGuess(day, { score: 20, temperature: "frozen", takenAt: 0 })
    day = advance(day)
    day = recordGuess(day, { score: 92, temperature: "blazing", takenAt: 0 })
    expect(formatShareCard(12, day, { choiceLabel: "Banana", gaveUpLabels: ["Bicycle"] })).toBe(
      "Snapdle #12 (Banana) 1/6 · best 92 · skipped: Bicycle\n🟥⬛⬛⬛⬛⬛",
    )
  })

  it("marks quit days X/6 with every dead object named", () => {
    let day = newDay("2026-10-09", triple)
    day = advance(day)
    day = advance(day)
    day = advance(day)
    expect(
      formatShareCard(12, day, {
        choiceLabel: null,
        gaveUpLabels: ["Bicycle", "Banana", "Motorcycle"],
      }),
    ).toBe("Snapdle #12 X/6 · best 0 · skipped: Bicycle, Banana, Motorcycle\n⬛⬛⬛⬛⬛⬛")
  })
})
