import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  howToPlayIntro,
  howToPlayRulePhotos,
  howToPlayRulePick,
  howToPlayRuleScorerAfter,
  howToPlayRuleScorerBefore,
  howToPlayRuleShare,
  howToPlayRuleStuck,
  howToPlayTitle,
  loadingScorerAction,
  loadingScorerPercent,
  retryAction,
  scorerFailedTitle,
  scorerLoadingNote,
  scorerReadyNote,
  startPlayingAction,
} from "@/copy.ts"
import { ScorerTerm } from "./scorer-term.tsx"

export interface HowToPlayDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly ready: boolean
  readonly failed: boolean
  readonly fraction: number | null
  readonly error: string | null
  readonly onRetry: () => void
  readonly onPlay: () => void
}

/**
 * First-visit onboarding: the rules plus the scorer download progress.
 * The scorer keeps loading underneath; Play enables once it is ready.
 */
export function HowToPlayDialog({
  open,
  onOpenChange,
  ready,
  failed,
  fraction,
  error,
  onRetry,
  onPlay,
}: HowToPlayDialogProps) {
  const playLabel = ready
    ? startPlayingAction
    : fraction === null
      ? loadingScorerAction
      : loadingScorerPercent(fraction)
  const startLabel = ready ? startPlayingAction : loadingScorerAction

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{howToPlayTitle}</DialogTitle>
          <DialogDescription>{howToPlayIntro}</DialogDescription>
        </DialogHeader>
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          <li>{howToPlayRulePick}</li>
          <li>{howToPlayRulePhotos}</li>
          <li>
            {howToPlayRuleScorerBefore} <ScorerTerm /> {howToPlayRuleScorerAfter}
          </li>
          <li>{howToPlayRuleStuck}</li>
          <li>{howToPlayRuleShare}</li>
        </ol>
        {failed ? (
          <div className="flex flex-col gap-2 border border-destructive/40 p-3">
            <p className="text-sm font-medium">{scorerFailedTitle}</p>
            <p className="text-sm text-muted-foreground">
              Check your connection and select {retryAction}.
              {error === null ? "" : ` Details: ${error}`}
            </p>
            <Button onClick={onRetry} variant="outline">
              {retryAction}
            </Button>
          </div>
        ) : ready ? (
          <p className="text-center text-xs text-muted-foreground">{scorerReadyNote}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <Progress value={fraction === null ? null : Math.round(fraction * 100)} />
            <p className="text-center text-xs text-muted-foreground">{scorerLoadingNote}</p>
          </div>
        )}
        {failed ? null : (
          <Button
            aria-label={startLabel}
            className="w-full"
            disabled={!ready}
            onClick={onPlay}
            size="lg"
          >
            {playLabel}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
