import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { DayState } from "@/game/state.ts"
import { temperatureStyle } from "./temperature-styles.ts"

export interface GuessListProps {
  readonly day: DayState
  readonly thumbnails: ReadonlyArray<string>
}

/** Scored guesses, newest last, each with its photo, temp, and clue. */
export function GuessList({ day, thumbnails }: GuessListProps) {
  if (day.guesses.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No shots yet. Go outside and shoot something.
      </p>
    )
  }
  return (
    <ol className="flex w-full flex-col gap-3">
      {day.guesses.map((guess, index) => {
        const style = temperatureStyle(guess.temperature)
        const thumbnail = thumbnails[index]
        return (
          <li key={`${guess.takenAt}-${index}`}>
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                {thumbnail !== undefined ? (
                  <img
                    alt={`Guess ${index + 1}`}
                    className="size-16 shrink-0 rounded-md object-cover"
                    src={thumbnail}
                  />
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Badge className={style.badge} variant="outline">
                      {style.square} {style.label}
                    </Badge>
                    <span className="text-xl font-bold tabular-nums">{guess.score}</span>
                  </div>
                  <Progress className="h-1.5" value={guess.score} />
                  <p className="truncate text-sm text-muted-foreground">{guess.clue}</p>
                </div>
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ol>
  )
}
