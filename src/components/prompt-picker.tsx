import { Card, CardContent } from "@/components/ui/card"
import type { Prompt } from "@/game/prompts.ts"

export interface PromptPickerProps {
  readonly prompts: ReadonlyArray<Prompt>
  readonly deadIds: ReadonlyArray<string>
  readonly gaveUpIds: ReadonlyArray<string>
  readonly onChoose: (id: string) => void
}

/**
 * Pick-1-of-3 for the day. Each live prompt is a button in the Starting
 * hint style: a title row plus the frozen hint, never the name. The pick
 * is by vibe and the object stays hidden until the reveal. Dead prompts
 * stay visible but disabled, named, so the share card and the board tell
 * the same story.
 */
export function PromptPicker({ prompts, deadIds, gaveUpIds, onChoose }: PromptPickerProps) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <h2 className="text-sm font-semibold">Pick today&apos;s object</h2>
      <ol className="flex flex-col gap-2">
        {prompts.map((prompt, index) => {
          const dead = deadIds.includes(prompt.id) || gaveUpIds.includes(prompt.id)
          if (dead) {
            return (
              <li key={prompt.id}>
                <Card className="py-2" size="sm">
                  <CardContent className="flex flex-col gap-0.5">
                    <p className="break-words text-sm whitespace-pre-wrap text-muted-foreground">
                      Out for today. It was {prompt.label}.
                    </p>
                  </CardContent>
                </Card>
              </li>
            )
          }
          return (
            <li key={prompt.id}>
              <button
                aria-label={`Choose object ${index + 1}`}
                className="w-full cursor-pointer rounded-xl bg-card px-3 py-3 text-left text-sm text-card-foreground ring-1 ring-foreground/10 transition-all outline-none select-none hover:shadow-sm hover:ring-primary/60 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
                onClick={() => onChoose(prompt.id)}
                type="button"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">Object {index + 1}</span>
                  <span className="break-words text-sm whitespace-pre-wrap text-muted-foreground">
                    {prompt.clues.frozen}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
