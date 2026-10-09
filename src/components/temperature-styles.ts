import type { Temperature } from "@/game/scoring.ts"

export interface TemperatureStyle {
  readonly badge: string
  readonly bar: string
  readonly label: string
  readonly square: string
}

/**
 * Cold-to-hot styling per temperature band. High contrast swaps
 * green/yellow for orange/blue, mirroring Wordle's colorblind mode.
 * Share squares stay fixed so cards read the same for everyone.
 */
export function temperatureStyle(temperature: Temperature, highContrast = false): TemperatureStyle {
  if (temperature === "blazing") {
    return highContrast
      ? {
          badge: "bg-orange-600/20 text-orange-500 border-orange-600/40",
          bar: "bg-orange-600",
          label: "Blazing",
          square: "🟥",
        }
      : {
          badge: "bg-red-500/15 text-red-400 border-red-500/30",
          bar: "bg-red-500",
          label: "Blazing",
          square: "🟥",
        }
  }
  if (temperature === "hot") {
    return highContrast
      ? {
          badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
          bar: "bg-orange-500",
          label: "Hot",
          square: "🟧",
        }
      : {
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
    return highContrast
      ? {
          badge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
          bar: "bg-sky-500",
          label: "Cool",
          square: "🟩",
        }
      : {
          badge: "bg-green-500/15 text-green-400 border-green-500/30",
          bar: "bg-green-500",
          label: "Cool",
          square: "🟩",
        }
  }
  return highContrast
    ? {
        badge: "bg-blue-600/20 text-blue-400 border-blue-600/40",
        bar: "bg-blue-600",
        label: "Frozen",
        square: "🟦",
      }
    : {
        badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        bar: "bg-blue-500",
        label: "Frozen",
        square: "🟦",
      }
}
