import { ThemeProvider } from "./theme/provider.tsx"
import { ThemeSwitch } from "./theme/switch.tsx"
import { GameScreen } from "./components/game-screen.tsx"

export function App() {
  return (
    <ThemeProvider>
      <div className="flex min-h-svh flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h1 className="text-lg font-bold">Touchgrassdle</h1>
          <ThemeSwitch />
        </header>
        <main className="flex flex-1 flex-col items-center p-4">
          <GameScreen />
        </main>
      </div>
    </ThemeProvider>
  )
}
