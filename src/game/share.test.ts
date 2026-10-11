import { describe, expect, it } from "vitest"
import { formatShareCard, squareFor } from "./share.ts"
import { newDay, recordGuess } from "./state.ts"

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
  it("shares progress without photos", () => {
    let day = newDay("2026-10-09", "exit-sign")
    day = recordGuess(day, { score: 55, temperature: "warm", takenAt: 0 })
    day = recordGuess(day, { score: 92, temperature: "blazing", takenAt: 0 })
    expect(formatShareCard(12, day)).toBe("Touchgrassdle #12 2/6 · best 92\n🟨🟥⬛⬛⬛⬛")
  })

  it("marks unsolved days X/6", () => {
    const day = newDay("2026-10-09", "exit-sign")
    expect(formatShareCard(12, day)).toBe("Touchgrassdle #12 X/6 · best 0\n⬛⬛⬛⬛⬛⬛")
  })
})
