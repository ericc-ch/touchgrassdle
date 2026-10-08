import { ThemeProvider } from "./theme/provider.tsx"
import { ThemeSwitch } from "./theme/switch.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function App() {
  return (
    <ThemeProvider>
      <div className="flex min-h-svh flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h1 className="text-lg font-bold">Touchgrassdle</h1>
          <ThemeSwitch />
        </header>
        <main className="flex flex-1 flex-col items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Today&apos;s hunt</CardTitle>
              <CardDescription>Go outside and shoot something.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Game board lands here next.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </ThemeProvider>
  )
}
