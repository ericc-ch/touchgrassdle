import { Alert, AlertDescription } from "@/components/ui/alert"
import { bestScore } from "@/game/state.ts"
import { useDailyGame } from "@/game/session.ts"
import { promptFor } from "@/game/prompts.ts"
import { CaptureButton } from "./capture-button.tsx"
import { GuessList } from "./guess-list.tsx"
import { ModelStatus } from "./model-status.tsx"
import { SolvedCard } from "./solved-card.tsx"

/** The daily hunt: capture, hot/cold feedback, clues, reveal, share. */
export function GameScreen() {
  const game = useDailyGame()

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
  const ended = !game.open

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Hunt #{game.dayNumber}</h2>
        <span className="text-sm text-muted-foreground">
          {game.solved ? `solved · best ${bestScore(game.day)}` : `${game.remaining} shots left`}
        </span>
      </div>

      {ended ? (
        <SolvedCard
          best={bestScore(game.day)}
          failed={!game.solved}
          guessesUsed={game.day.guesses.length}
          label={today.prompt.label}
          onShare={game.share}
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
    </div>
  )
}
