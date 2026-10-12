import { ChartColumn, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { sharedAction, shareAction } from "@/copy.ts"

export interface SolvedCardProps {
  readonly title: string
  readonly description: string
  readonly countdown: string
  readonly shared: boolean
  readonly onShare: () => void
  readonly onStats: () => void
}

/** Reveal + share + countdown once the day ends (found or every prompt dead). */
export function SolvedCard({
  title,
  description,
  countdown,
  shared,
  onShare,
  onStats,
}: SolvedCardProps) {
  return (
    <Card className="w-full border-primary/40">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={onShare} variant="outline">
            <Share2 />
            {shared ? sharedAction : shareAction}
          </Button>
          <Button aria-label="View statistics" onClick={onStats} size="icon" variant="outline">
            <ChartColumn />
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground tabular-nums">
          Next day in {countdown}
        </p>
      </CardContent>
    </Card>
  )
}
