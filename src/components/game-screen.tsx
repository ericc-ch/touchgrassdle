import { useState } from "react"
import { ChartColumn, CircleQuestionMark } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { bestScore } from "@/game/state.ts"
import { useDailyGame } from "@/game/session.ts"
import { useNow } from "@/game/clock.ts"
import { formatCountdown, msUntilNextDay } from "@/game/countdown.ts"
import { promptFor } from "@/game/prompts.ts"
import { hasSeenHowTo, markSeenHowTo } from "@/game/storage.ts"
import { ThemeSwitch } from "@/theme/switch.tsx"
import { noteThemeTap, useDevMode } from "@/game/dev-mode.ts"
import { CaptureButton } from "./capture-button.tsx"
import { DevDrawer } from "./dev-drawer.tsx"
import { GuessList } from "./guess-list.tsx"
import { HowToPlayDialog } from "./how-to-play-dialog.tsx"
import { ModelStatus } from "./model-status.tsx"
import { SolvedCard } from "./solved-card.tsx"
import { StatsDialog } from "./stats-dialog.tsx"

/** Tick the next-day countdown once a second. */
function useCountdown(): string {
  const now = useNow()
  return formatCountdown(msUntilNextDay(new Date(now)))
}

/** The daily photo game: take photos, get closeness %, hints, reveal, share. */
export function GameScreen() {
  const game = useDailyGame()
  const countdown = useCountdown()
  const dev = useDevMode()
  const [statsOpen, setStatsOpen] = useState(false)
  const [howToOpen, setHowToOpen] = useState<boolean>(() => !hasSeenHowTo())
  // Open stats once when the day ends. Render-time derivation replaces
  // the effect: same timing, no subscription, StrictMode-safe.
  const [wasEnded, setWasEnded] = useState(false)
  const ended = game.status === "ready" && !game.open
  if (ended !== wasEnded) {
    setWasEnded(ended)
    if (ended) {
      setStatsOpen(true)
    }
  }

  const ready = game.status === "ready"
  const failed = game.status === "model-error"
  const loading = !ready
  const showSlimLoader = loading && !howToOpen

  const handleHowToChange = (open: boolean): void => {
    if (!open) {
      markSeenHowTo()
    }
    setHowToOpen(open)
  }
  const startPlaying = (): void => {
    markSeenHowTo()
    setHowToOpen(false)
  }

  const today = promptFor(new Date())

  return (
    <div className="flex h-dvh flex-col">
      <header className="shrink-0 border-b">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-4 py-2.5">
          <h1 className="text-lg font-bold tracking-tight">Snapdle</h1>
          <nav aria-label="Game" className="flex items-center gap-0.5">
            <Button
              aria-label="How to play"
              onClick={() => setHowToOpen(true)}
              size="icon-sm"
              variant="ghost"
            >
              <CircleQuestionMark />
            </Button>
            <Button
              aria-label="View statistics"
              onClick={() => setStatsOpen(true)}
              size="icon-sm"
              variant="ghost"
            >
              <ChartColumn />
            </Button>
            <ThemeSwitch onToggle={noteThemeTap} />
          </nav>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto flex h-full w-full max-w-md flex-col gap-2 px-4 pt-3">
          <div className="flex shrink-0 items-center justify-between">
            <h2 className="text-sm font-semibold">Day #{game.dayNumber}</h2>
            <span className="text-sm text-muted-foreground">
              {game.solved
                ? `found · best ${bestScore(game.day)}%`
                : `${game.remaining} photos left`}
            </span>
          </div>

          <Card className="shrink-0 py-2" size="sm">
            <CardContent className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Starting hint</span>
              <p className="break-words text-sm whitespace-pre-wrap text-muted-foreground">
                {today.prompt.clues.frozen}
              </p>
            </CardContent>
          </Card>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <GuessList day={game.day} prompt={today.prompt} thumbnails={game.thumbnails} />
          </div>

          {showSlimLoader ? (
            <div className="shrink-0">
              <ModelStatus
                error={game.modelError}
                failed={failed}
                fraction={game.modelFraction}
                onRetry={game.retryLoad}
              />
            </div>
          ) : null}

          {game.notice !== null ? (
            <Alert
              className="shrink-0"
              variant={game.notice.startsWith("Snapdle") ? "default" : "destructive"}
            >
              <AlertDescription className="break-words whitespace-pre-wrap">
                {game.notice}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {ended ? (
              <SolvedCard
                best={bestScore(game.day)}
                countdown={countdown}
                failed={!game.solved}
                guessesUsed={game.day.guesses.length}
                label={today.prompt.label}
                onShare={game.share}
                onStats={() => setStatsOpen(true)}
                shared={game.shared}
              />
            ) : (
              <CaptureButton
                disabled={!game.open}
                onFile={game.scorePhoto}
                remaining={game.remaining}
                scoring={game.scoring}
                waiting={game.open && !ready}
              />
            )}
          </div>
        </div>
      </main>

      <HowToPlayDialog
        error={game.modelError}
        failed={failed}
        fraction={game.modelFraction}
        onOpenChange={handleHowToChange}
        onPlay={startPlaying}
        onRetry={game.retryLoad}
        open={howToOpen}
        ready={ready}
      />

      <StatsDialog
        countdown={countdown}
        onOpenChange={setStatsOpen}
        onShare={game.share}
        open={statsOpen}
        shareLabel={`Day #${game.dayNumber} — ${game.solved ? `found in ${game.day.guesses.length}` : "not found"}`}
        shared={game.shared}
        stats={game.stats}
      />
      {dev ? (
        <DevDrawer
          game={game}
          onHowTo={() => setHowToOpen(true)}
          onStats={() => setStatsOpen(true)}
          promptId={today.prompt.id}
          promptLabel={today.prompt.label}
        />
      ) : null}
    </div>
  )
}
