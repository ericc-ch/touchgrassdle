import { useState } from "react"
import { ChartColumn, CircleQuestionMark } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { bestScore } from "@/game/state.ts"
import { useDailyGame } from "@/game/session.ts"
import { useNow } from "@/game/clock.ts"
import { formatCountdown, msUntilNextDay } from "@/game/countdown.ts"
import { promptFor } from "@/game/prompts.ts"
import { hasSeenHowTo, markSeenHowTo } from "@/game/storage.ts"
import { CaptureButton } from "./capture-button.tsx"
import { GuessList } from "./guess-list.tsx"
import { HowToPlayDialog } from "./how-to-play-dialog.tsx"
import { ModelStatus } from "./model-status.tsx"
import { SolvedCard } from "./solved-card.tsx"
import { StatsDialog } from "./stats-dialog.tsx"

/** Tick the next-hunt countdown once a second. */
function useCountdown(): string {
  const now = useNow()
  return formatCountdown(msUntilNextDay(new Date(now)))
}

/** The daily hunt: capture, hot/cold feedback, clues, reveal, share. */
export function GameScreen() {
  const game = useDailyGame()
  const countdown = useCountdown()
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

  if (game.status === "prompt-error") {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Prompt data is missing. Rebuild the app to regenerate embeddings.
        </AlertDescription>
      </Alert>
    )
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
  const startHunting = (): void => {
    markSeenHowTo()
    setHowToOpen(false)
  }

  const today = promptFor(new Date())

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Hunt #{game.dayNumber}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {game.solved ? `solved · best ${bestScore(game.day)}` : `${game.remaining} shots left`}
          </span>
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
        </div>
      </div>

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
          disabled={!game.open || !ready}
          onFile={game.scorePhoto}
          remaining={game.remaining}
          scoring={game.scoring}
        />
      )}

      {showSlimLoader ? (
        <ModelStatus
          error={game.modelError}
          failed={failed}
          file={game.modelFile}
          fraction={game.modelFraction}
          onRetry={game.retryLoad}
        />
      ) : null}

      {game.latestClue !== null && game.open ? (
        <Alert>
          <AlertDescription>{game.latestClue}</AlertDescription>
        </Alert>
      ) : null}

      {game.notice !== null ? (
        <Alert variant={game.notice.startsWith("Touchgrassdle") ? "default" : "destructive"}>
          <AlertDescription className="break-words whitespace-pre-wrap">
            {game.notice}
          </AlertDescription>
        </Alert>
      ) : null}

      <GuessList day={game.day} thumbnails={game.thumbnails} />

      <HowToPlayDialog
        error={game.modelError}
        failed={failed}
        fraction={game.modelFraction}
        onOpenChange={handleHowToChange}
        onPlay={startHunting}
        onRetry={game.retryLoad}
        open={howToOpen}
        ready={ready}
      />

      <StatsDialog
        countdown={countdown}
        onOpenChange={setStatsOpen}
        onShare={game.share}
        open={statsOpen}
        shareLabel={`Hunt #${game.dayNumber} — ${game.solved ? `solved in ${game.day.guesses.length}` : "unsolved"}`}
        shared={game.shared}
        stats={game.stats}
      />
    </div>
  )
}
