import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

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
 * First-visit onboarding: the rules plus the model download progress.
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
    ? "Start hunting"
    : fraction === null
      ? "Loading the judge"
      : `Loading the judge: ${Math.round(fraction * 100)}%`
  const startLabel = ready ? "Start hunting" : "Loading the judge"

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How to play</DialogTitle>
          <DialogDescription>
            You hunt one hidden prompt each day. You take photos outside to find it.
          </DialogDescription>
        </DialogHeader>
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          <li>Take up to 6 photos outside. You hunt the same prompt as everyone else.</li>
          <li>Each photo scores 0 to 100. Hotter means closer. You get a clue with each score.</li>
          <li>80 points solves the hunt. Your photos stay on this device.</li>
          <li>Share your 6 squares with friends.</li>
        </ol>
        <div>
          <p
            aria-label="Temperature scale from coldest to hottest: Frozen, Cool, Warm, Hot, Blazing"
            className="text-center text-lg tracking-wide"
          >
            🟦🟩🟨🟧🟥
          </p>
          <p className="text-center text-xs text-muted-foreground">Frozen to Blazing</p>
        </div>
        {failed ? (
          <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 p-3">
            <p className="text-sm font-medium">The judge cannot load.</p>
            <p className="text-sm text-muted-foreground">
              Check your connection and select Retry.
              {error === null ? "" : ` Details: ${error}`}
            </p>
            <Button onClick={onRetry} variant="outline">
              Retry
            </Button>
          </div>
        ) : ready ? (
          <p className="text-center text-xs text-muted-foreground">
            The judge is ready. Your photos stay on this device.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <Progress value={fraction === null ? null : Math.round(fraction * 100)} />
            <p className="text-center text-xs text-muted-foreground">
              The judge scores your photos on this device. The app downloads the judge once.
            </p>
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
