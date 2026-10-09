import { ChartColumn, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export interface SolvedCardProps {
  readonly label: string
  readonly guessesUsed: number
  readonly best: number
  readonly failed: boolean
  readonly countdown: string
  readonly shared: boolean
  readonly onShare: () => void
  readonly onStats: () => void
}

/** Reveal + share + countdown once the day ends (solved or out of shots). */
export function SolvedCard({
  label,
  guessesUsed,
  best,
  failed,
  countdown,
  shared,
  onShare,
  onStats,
}: SolvedCardProps) {
  return (
    <Card className="w-full border-primary/40">
      <CardHeader>
        <CardTitle>{failed ? "Out of shots" : "Solved!"}</CardTitle>
        <CardDescription>
          {failed
            ? `Today's prompt was: ${label}`
            : `It was ${label} — cracked in ${guessesUsed} ${guessesUsed === 1 ? "shot" : "shots"} (best ${best}).`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={onShare} variant="outline">
            <Share2 />
            {shared ? "Copied!" : "Share score"}
          </Button>
          <Button aria-label="View statistics" onClick={onStats} size="icon" variant="outline">
            <ChartColumn />
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground tabular-nums">
          Next hunt in {countdown}
        </p>
      </CardContent>
    </Card>
  )
}
