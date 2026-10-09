import type { Temperature } from "@/game/scoring.ts"

export interface TemperatureStyle {
  readonly badge: string
  readonly bar: string
  readonly label: string
  readonly square: string
}

/** Cold-to-hot styling per temperature band. */
export function temperatureStyle(temperature: Temperature): TemperatureStyle {
  if (temperature === "blazing") {
    return {
      badge: "bg-red-500/15 text-red-400 border-red-500/30",
      bar: "bg-red-500",
      label: "Blazing",
      square: "🟥",
    }
  }
  if (temperature === "hot") {
    return {
      badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      bar: "bg-orange-500",
      label: "Hot",
      square: "🟧",
    }
  }
  if (temperature === "warm") {
    return {
      badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
      bar: "bg-yellow-500",
      label: "Warm",
      square: "🟨",
    }
  }
  if (temperature === "cool") {
    return {
      badge: "bg-green-500/15 text-green-400 border-green-500/30",
      bar: "bg-green-500",
      label: "Cool",
      square: "🟩",
    }
  }
  return {
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    bar: "bg-blue-500",
    label: "Frozen",
    square: "🟦",
  }
}
