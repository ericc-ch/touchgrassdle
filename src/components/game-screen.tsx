import { useEffect, useRef, useState } from "react"
import { ChartColumn } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { bestScore } from "@/game/state.ts"
import { useDailyGame } from "@/game/session.ts"
import { formatCountdown, msUntilNextDay } from "@/game/countdown.ts"
import { promptFor } from "@/game/prompts.ts"
import { CaptureButton } from "./capture-button.tsx"
import { GuessList } from "./guess-list.tsx"
import { ModelStatus } from "./model-status.tsx"
import { SolvedCard } from "./solved-card.tsx"
import { StatsDialog } from "./stats-dialog.tsx"

/** Tick the next-hunt countdown once a second. */
function useCountdown(): string {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return formatCountdown(msUntilNextDay(now))
}

/** The daily hunt: capture, hot/cold feedback, clues, reveal, share. */
export function GameScreen() {
  const game = useDailyGame()
  const countdown = useCountdown()
  const [statsOpen, setStatsOpen] = useState(false)
  const statsShownRef = useRef(false)

  const ended = game.status === "ready" && !game.open
  useEffect(() => {
    if (ended && !statsShownRef.current) {
      statsShownRef.current = true
      setStatsOpen(true)
    }
  }, [ended])

  if (game.status === "prompt-error") {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Prompt data is missing. Rebuild the app to regenerate embeddings.
        </AlertDescription>
      </Alert>
    )
  }

  if (game.status === "loading-model" || game.status === "model-error") {
    return (
      <div className="w-full max-w-md">
        <ModelStatus
          error={game.modelError}
          failed={game.status === "model-error"}
          file={game.modelFile}
          fraction={game.modelFraction}
          onRetry={game.retryLoad}
        />
      </div>
    )
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
          disabled={!game.open}
          onFile={game.scorePhoto}
          remaining={game.remaining}
          scoring={game.scoring}
        />
      )}

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
