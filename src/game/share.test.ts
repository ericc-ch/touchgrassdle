import { describe, expect, it } from "vitest"
import { formatShareCard, squareFor } from "./share.ts"
import { choosePrompt, giveUp, newDay, recordGuess, type TripleIds } from "./state.ts"

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
  it("names the played prompt without photos", () => {
    let day = choosePrompt(newDay("2026-10-09", triple), "bicycle")
    day = recordGuess(day, { score: 55, temperature: "warm", takenAt: 0 })
    day = recordGuess(day, { score: 92, temperature: "blazing", takenAt: 0 })
    expect(formatShareCard(12, day, { choiceLabel: "Bicycle", gaveUpLabels: [] })).toBe(
      "Snapdle #12 (Bicycle) 2/6 · best 92\n🟨🟥⬛⬛⬛⬛",
    )
  })

  it("lists gave-up prompts after the score", () => {
    let day = choosePrompt(newDay("2026-10-09", triple), "banana")
    day = recordGuess(day, { score: 20, temperature: "frozen", takenAt: 0 })
    day = giveUp(day)
    day = choosePrompt(day, "bicycle")
    day = recordGuess(day, { score: 92, temperature: "blazing", takenAt: 0 })
    expect(formatShareCard(12, day, { choiceLabel: "Bicycle", gaveUpLabels: ["Banana"] })).toBe(
      "Snapdle #12 (Bicycle) 1/6 · best 92 · skipped: Banana\n🟥⬛⬛⬛⬛⬛",
    )
  })

  it("marks quit days X/6 with every dead prompt named", () => {
    let day = choosePrompt(newDay("2026-10-09", triple), "banana")
    day = giveUp(day)
    day = choosePrompt(day, "bicycle")
    day = giveUp(day)
    day = choosePrompt(day, "motorcycle")
    day = giveUp(day)
    expect(
      formatShareCard(12, day, {
        choiceLabel: null,
        gaveUpLabels: ["Banana", "Bicycle", "Motorcycle"],
      }),
    ).toBe("Snapdle #12 X/6 · best 0 · skipped: Banana, Bicycle, Motorcycle\n⬛⬛⬛⬛⬛⬛")
  })
})
