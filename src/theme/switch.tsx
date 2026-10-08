import { Monitor, Moon, Sun } from "lucide-react"
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

/** Light/dark/system switch. Future presets plug in as more options here. */
export function ThemeSwitch() {
  const { preference, setPreference } = useTheme()

  return (
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
  )
}
