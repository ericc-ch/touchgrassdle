import { Contrast, Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "./provider.tsx"
import type { ThemePreference } from "./preference.ts"

const OPTIONS: ReadonlyArray<{ readonly value: ThemePreference; readonly label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
]

function OptionIcon({ value }: { readonly value: ThemePreference }) {
  if (value === "light") return <Sun />
  if (value === "dark") return <Moon />
  return <Monitor />
}

/** Light/dark/system switch plus high-contrast toggle. Future presets plug in as more options here. */
export function ThemeSwitch() {
  const { preference, setPreference, contrast, setContrast } = useTheme()

  return (
    <div className="flex items-center gap-1">
      <div aria-label="Theme" className="flex items-center gap-1" role="group">
        {OPTIONS.map((option) => (
          <Button
            aria-pressed={preference === option.value}
            key={option.value}
            onClick={() => setPreference(option.value)}
            size="icon-sm"
            title={`${option.label} theme`}
            variant={preference === option.value ? "default" : "ghost"}
          >
            <OptionIcon value={option.value} />
            <span className="sr-only">{option.label} theme</span>
          </Button>
        ))}
      </div>
      <Button
        aria-pressed={contrast === "high"}
        onClick={() => setContrast(contrast === "high" ? "standard" : "high")}
        size="icon-sm"
        title="High contrast"
        variant={contrast === "high" ? "default" : "ghost"}
      >
        <Contrast />
        <span className="sr-only">High contrast</span>
      </Button>
    </div>
  )
}
