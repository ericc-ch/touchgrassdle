import { ThemeProvider } from "./theme/provider.tsx"
import { GameScreen } from "./components/game-screen.tsx"

export function App() {
  return (
    <ThemeProvider>
      <div className="flex min-h-svh flex-col">
        <GameScreen />
      </div>
    </ThemeProvider>
  )
}
