import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
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
    ? "Start playing"
    : fraction === null
      ? "Loading the photo scorer"
      : `Loading the photo scorer: ${Math.round(fraction * 100)}%`
  const startLabel = ready ? "Start playing" : "Loading the photo scorer"

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How to play</DialogTitle>
          <DialogDescription>
            Pick one of three hidden subjects each day. Take photos outside to match it.
          </DialogDescription>
        </DialogHeader>
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          <li>Pick one of 3 subjects. Everyone gets the same three.</li>
          <li>
            Take up to 6 photos on your pick. Each photo gets a closeness score, 0 to 100%. Higher
            means closer. You get a hint with each score.
          </li>
          <li>
            80% or more finds it. Your photos stay on this device. The <ScorerTerm /> runs here, not
            on a server.
          </li>
          <li>
            Stuck? Give up your pick and try another subject with a fresh 6. A gave-up subject stays
            dead for the day.
          </li>
          <li>Share your scores with friends.</li>
        </ol>
        {failed ? (
          <div className="flex flex-col gap-2 border border-destructive/40 p-3">
            <p className="text-sm font-medium">The photo scorer cannot load.</p>
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
            The photo scorer is ready. Your photos stay on this device.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <Progress value={fraction === null ? null : Math.round(fraction * 100)} />
            <p className="text-center text-xs text-muted-foreground">
              The photo scorer checks your photos on this device. The app downloads it once.
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
