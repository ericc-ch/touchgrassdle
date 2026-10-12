import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Prompt } from "@/game/prompts.ts"

export interface PromptPickerProps {
  readonly prompts: ReadonlyArray<Prompt>
  readonly deadIds: ReadonlyArray<string>
  readonly gaveUpIds: ReadonlyArray<string>
  readonly onChoose: (id: string) => void
}

/**
 * Pick-1-of-3 for the day. Each live prompt shows its name and starting
 * hint; dead prompts stay visible but disabled, named so the share card
 * and the board tell the same story.
 */
export function PromptPicker({ prompts, deadIds, gaveUpIds, onChoose }: PromptPickerProps) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <h2 className="text-sm font-semibold">Pick today&apos;s subject</h2>
      <ol className="flex flex-col gap-2">
        {prompts.map((prompt) => {
          const dead = deadIds.includes(prompt.id) || gaveUpIds.includes(prompt.id)
          return (
            <li key={prompt.id}>
              <Card className="py-2" size="sm">
                <CardContent className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold">{prompt.label}</span>
                  <p className="break-words text-sm whitespace-pre-wrap text-muted-foreground">
                    {dead ? `Out for today — it was ${prompt.label}.` : prompt.clues.frozen}
                  </p>
                  {dead ? null : (
                    <Button
                      aria-label={`Choose ${prompt.label}`}
                      onClick={() => onChoose(prompt.id)}
                      size="sm"
                      variant="outline"
                    >
                      Choose {prompt.label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
