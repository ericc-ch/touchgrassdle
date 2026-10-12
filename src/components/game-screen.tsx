import { useState } from "react"
import { ChartColumn, CircleQuestionMark } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { bestScore } from "@/game/state.ts"
import { useDailyGame } from "@/game/session.ts"
import { useNow } from "@/game/clock.ts"
import { formatCountdown, msUntilNextDay } from "@/game/countdown.ts"
import { tripleFor } from "@/game/prompts.ts"
import { hasSeenHowTo, markSeenHowTo } from "@/game/storage.ts"
import { ThemeSwitch } from "@/theme/switch.tsx"
import { noteThemeTap, useDevMode } from "@/game/dev-mode.ts"
import { CaptureButton } from "./capture-button.tsx"
import { DevDrawer } from "./dev-drawer.tsx"
import { GiveUpButton } from "./give-up-button.tsx"
import { GuessList } from "./guess-list.tsx"
import { HowToPlayDialog } from "./how-to-play-dialog.tsx"
import { ModelStatus } from "./model-status.tsx"
import { PromptPicker } from "./prompt-picker.tsx"
import { SolvedCard } from "./solved-card.tsx"
import { StatsDialog } from "./stats-dialog.tsx"

/** Tick the next-day countdown once a second. */
function useCountdown(): string {
  const now = useNow()
  return formatCountdown(msUntilNextDay(new Date(now)))
}

/** The daily photo game: pick a subject, take photos, get closeness %, hints, reveal, share. */
export function GameScreen() {
  const game = useDailyGame()
  const countdown = useCountdown()
  const dev = useDevMode()
  const [statsOpen, setStatsOpen] = useState(false)
  const [howToOpen, setHowToOpen] = useState<boolean>(() => !hasSeenHowTo())
  // Open stats once when the day ends. Render-time derivation replaces
  // the effect: same timing, no subscription, StrictMode-safe.
  const [wasEnded, setWasEnded] = useState(false)
  const ended = game.status === "ready" && game.over
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

  const today = tripleFor(new Date())
  const labelById = new Map(today.prompts.map((prompt) => [prompt.id, prompt.label] as const))
  const labelOf = (id: string): string => labelById.get(id) ?? id
  const gaveUpLabels = game.day.gaveUpIds.map(labelOf)
  const choiceLabel = game.chosen === null ? null : game.chosen.label

  const statusLine = game.solved
    ? `found · best ${bestScore(game.day)}%`
    : game.over
      ? "day over"
      : game.failedCurrent
        ? "out of photos"
        : game.chosen === null
          ? "pick an object"
          : `${game.remaining} photos left`

  const showSwitch = game.open && game.chosen !== null

  const solvedTitle = "Found it!"
  const photoWord = game.day.guesses.length === 1 ? "photo" : "photos"
  const solvedDescription =
    choiceLabel === null
      ? ""
      : `It was ${choiceLabel}. Found in ${game.day.guesses.length} ${photoWord}. Best ${bestScore(game.day)}%.` +
        (gaveUpLabels.length === 0 ? "" : ` Skipped: ${gaveUpLabels.join(", ")}.`)
  const failedDescription = `Today's objects: ${today.prompts.map((prompt) => prompt.label).join(", ")}.`
  const shareLabel =
    game.solved && choiceLabel !== null
      ? `Day #${game.dayNumber} — ${choiceLabel} found in ${game.day.guesses.length}`
      : `Day #${game.dayNumber} — not found`

  const boardLine =
    game.chosen === null
      ? `no choice · dead ${gaveUpLabels.join(", ") || "none"}`
      : `${game.chosen.label} (${game.chosen.id}) · dead ${gaveUpLabels.join(", ") || "none"}`

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
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>{statusLine}</span>
              {showSwitch ? (
                <>
                  <span aria-hidden="true">·</span>
                  <GiveUpButton key={game.day.choiceId} onGiveUp={game.giveUpChoice} />
                </>
              ) : null}
            </span>
          </div>

          {game.chosen === null || game.failedCurrent ? null : (
            <Card className="shrink-0 py-2" size="sm">
              <CardContent className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">Starting hint</span>
                <p className="break-words text-sm whitespace-pre-wrap text-muted-foreground">
                  {game.chosen.clues.frozen}
                </p>
              </CardContent>
            </Card>
          )}

          {game.failedCurrent && choiceLabel !== null && !ended ? (
            <Card className="shrink-0 py-2" size="sm">
              <CardContent className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">Out of photos on {choiceLabel}</span>
                <p className="break-words text-sm whitespace-pre-wrap text-muted-foreground">
                  That object stays dead. Pick another object below. You get 6 new photos.
                </p>
              </CardContent>
            </Card>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {game.chosen === null ? (
              ended ? null : (
                <PromptPicker
                  deadIds={game.day.deadIds}
                  gaveUpIds={game.day.gaveUpIds}
                  onChoose={game.choose}
                  prompts={game.prompts}
                />
              )
            ) : (
              <div className="flex flex-col gap-2">
                <GuessList day={game.day} prompt={game.chosen} thumbnails={game.thumbnails} />
                {game.failedCurrent && !ended ? (
                  <PromptPicker
                    deadIds={game.day.deadIds}
                    gaveUpIds={game.day.gaveUpIds}
                    onChoose={game.choose}
                    prompts={game.prompts}
                  />
                ) : null}
              </div>
            )}
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
                countdown={countdown}
                description={game.solved ? solvedDescription : failedDescription}
                onShare={game.share}
                onStats={() => setStatsOpen(true)}
                shared={game.shared}
                title={game.solved ? solvedTitle : "Out of photos"}
              />
            ) : game.failedCurrent || game.chosen === null ? null : (
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
        shareLabel={shareLabel}
        shared={game.shared}
        stats={game.stats}
      />
      {dev ? (
        <DevDrawer
          boardLine={boardLine}
          game={game}
          onHowTo={() => setHowToOpen(true)}
          onStats={() => setStatsOpen(true)}
        />
      ) : null}
    </div>
  )
}
