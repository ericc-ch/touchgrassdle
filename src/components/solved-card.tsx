import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export interface SolvedCardProps {
  readonly label: string
  readonly guessesUsed: number
  readonly best: number
  readonly failed: boolean
  readonly shared: boolean
  readonly onShare: () => void
}

/** Reveal + share once the day ends (solved or out of shots). */
export function SolvedCard({ label, guessesUsed, best, failed, shared, onShare }: SolvedCardProps) {
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
      <CardContent>
        <Button className="w-full" onClick={onShare} variant="outline">
          <Share2 />
          {shared ? "Copied!" : "Share score"}
        </Button>
      </CardContent>
    </Card>
  )
}
