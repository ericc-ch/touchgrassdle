import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  histogramHeading,
  maxStreakFact,
  nextDayHeading,
  playedFact,
  sharedAction,
  shareAction,
  statsTitle,
  streakFact,
  winPercentFact,
  wonFact,
} from "@/copy.ts"
import { winPercent, type Stats } from "@/game/stats.ts"

export interface StatsDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly stats: Stats
  readonly countdown: string
  readonly shareLabel: string
  readonly shared: boolean
  readonly onShare: () => void
}

/** Wordle-style statistics modal: totals, guess histogram, countdown, share. */
export function StatsDialog({
  open,
  onOpenChange,
  stats,
  countdown,
  shareLabel,
  shared,
  onShare,
}: StatsDialogProps) {
  const facts: ReadonlyArray<{ readonly label: string; readonly value: number }> = [
    { label: playedFact, value: stats.played },
    { label: wonFact, value: stats.wins },
    { label: winPercentFact, value: winPercent(stats) },
    { label: streakFact, value: stats.currentStreak },
    { label: maxStreakFact, value: stats.maxStreak },
  ]
  const best = Math.max(1, ...stats.byGuesses)

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{statsTitle}</DialogTitle>
          <DialogDescription>{shareLabel}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-2 text-center">
          {facts.map((fact) => (
            <div key={fact.label}>
              <div className="text-2xl font-bold tabular-nums">{fact.value}</div>
              <div className="text-xs text-muted-foreground">{fact.label}</div>
            </div>
          ))}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">{histogramHeading}</h3>
          <ol className="flex flex-col gap-1">
            {stats.byGuesses.map((count, index) => (
              <li className="flex items-center gap-2" key={index}>
                <span className="w-3 text-right text-xs tabular-nums">{index + 1}</span>
                <div
                  className="flex h-5 min-w-7 items-center justify-end rounded bg-secondary px-1.5 text-xs font-bold tabular-nums"
                  style={{ width: `${Math.max(10, (count / best) * 100)}%` }}
                >
                  {count}
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <div className="text-center">
            <div className="text-xs font-semibold tracking-wide text-muted-foreground">
              {nextDayHeading}
            </div>
            <div className="text-xl font-bold tabular-nums">{countdown}</div>
          </div>
          <Button className="flex-1" onClick={onShare} variant="outline">
            <Share2 />
            {shared ? sharedAction : shareAction}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
