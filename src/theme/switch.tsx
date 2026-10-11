import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "./provider.tsx"

export interface ThemeSwitchProps {
  readonly onToggle?: () => void
}

/** Single dark/light toggle. Defaults to following the OS; once picked, the choice sticks. */
export function ThemeSwitch({ onToggle }: ThemeSwitchProps = {}) {
  const { effective, setPreference } = useTheme()
  const dark = effective === "dark"

  return (
    <Button
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      onClick={() => {
        setPreference(dark ? "light" : "dark")
        onToggle?.()
      }}
      size="icon-sm"
      title={dark ? "Light theme" : "Dark theme"}
      variant="ghost"
    >
      {dark ? <Sun /> : <Moon />}
      <span className="sr-only">{dark ? "Light theme" : "Dark theme"}</span>
    </Button>
  )
}
