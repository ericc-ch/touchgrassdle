import { ThemeProvider } from "./theme/provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"
import { GameScreen } from "./components/game-screen.tsx"

export function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="flex min-h-svh flex-col">
          <GameScreen />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  )
}
