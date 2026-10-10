import { Card, CardContent } from "@/components/ui/card"
import type { DayState } from "@/game/state.ts"

export interface GuessListProps {
  readonly day: DayState
  readonly thumbnails: ReadonlyArray<string>
}

/** Scored guesses, newest last, each with its photo, closeness %, and hint. */
export function GuessList({ day, thumbnails }: GuessListProps) {
  if (day.guesses.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No photos yet. Go outside and take one.
      </p>
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
