import { Card, CardContent } from "@/components/ui/card"
import type { DayState } from "@/game/state.ts"

export interface GuessListProps {
  readonly day: DayState
  readonly thumbnails: ReadonlyArray<string>
  readonly initialHint: string
}

/** Scored guesses, newest last, each with its photo, closeness %, and hint. */
export function GuessList({ day, thumbnails, initialHint }: GuessListProps) {
  if (day.guesses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-1 p-3">
          <span className="text-sm font-semibold">Starting hint</span>
          <p className="break-words text-sm whitespace-pre-wrap text-muted-foreground">
            {initialHint}
          </p>
        </CardContent>
      </Card>
    )
  }
  return (
    <ol className="flex w-full flex-col gap-3">
      {day.guesses.map((guess, index) => {
        const thumbnail = thumbnails[index]
        return (
          <li key={`${guess.takenAt}-${index}`}>
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                {thumbnail !== undefined ? (
                  <img
                    alt={`Photo ${index + 1}, ${guess.score}% close`}
                    className="size-16 shrink-0 rounded-md object-cover"
                    src={thumbnail}
                  />
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-xl font-bold tabular-nums">{guess.score}% close</span>
                  <p className="break-words text-sm whitespace-pre-wrap text-muted-foreground">
                    {guess.clue}
                  </p>
                </div>
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ol>
  )
}
