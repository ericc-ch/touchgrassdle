import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { photoAlt, photoHeading, photoPreviewAlt, photoTitle, zoomPhotoAction } from "@/copy.ts"
import { clueForAttempt, type Prompt } from "@/game/prompts.ts"
import type { DayState } from "@/game/state.ts"

export interface GuessListProps {
  readonly day: DayState
  readonly prompt: Prompt
  readonly thumbnails: ReadonlyArray<string>
}

/**
 * Scored guesses, newest last. Same design language as the starting hint:
 * small card, semibold label row, muted clue. The hint is derived at
 * render from our prompt bank — guess n shows hint n — never stored.
 * Thumbnails are square buttons that open a zoomable preview (Dialog with
 * the full image plus its numbered clue caption).
 */
export function GuessList({ day, prompt, thumbnails }: GuessListProps) {
  const [preview, setPreview] = useState<number | null>(null)
  if (day.guesses.length === 0) {
    return null
  }
  const selected = preview === null ? undefined : day.guesses[preview]
  const selectedThumbnail = preview === null ? undefined : thumbnails[preview]
  const selectedClue = preview === null ? "" : clueForAttempt(prompt, preview)
  return (
    <>
      <ol className="flex w-full flex-col gap-2">
        {day.guesses.map((guess, index) => {
          const thumbnail = thumbnails[index]
          return (
            <li key={`${guess.takenAt}-${index}`}>
              <Card className="py-2" size="sm">
                <CardContent className="flex items-center gap-2.5">
                  {thumbnail !== undefined ? (
                    <button
                      aria-label={zoomPhotoAction(index)}
                      className="shrink-0 cursor-zoom-in"
                      onClick={() => setPreview(index)}
                      type="button"
                    >
                      <img
                        alt={photoAlt(index, guess.score)}
                        className="size-12 shrink-0 object-cover"
                        src={thumbnail}
                      />
                    </button>
                  ) : null}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold tabular-nums">
                      {photoHeading(index, guess.score)}
                    </span>
                    <p className="break-words text-sm whitespace-pre-wrap text-muted-foreground">
                      {clueForAttempt(prompt, index)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ol>
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setPreview(null)
          }
        }}
        open={preview !== null}
      >
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{photoTitle(preview ?? 0)}</DialogTitle>
          <DialogDescription>
            {selected === undefined ? "" : `${selected.score}% close — ${selectedClue}`}
          </DialogDescription>
          {selectedThumbnail === undefined ? null : (
            <img
              alt={photoPreviewAlt(selected === undefined ? null : selected.score)}
              className="max-h-[70vh] w-full object-contain"
              src={selectedThumbnail}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
