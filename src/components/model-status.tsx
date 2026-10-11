import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScorerTerm } from "./scorer-term.tsx"

export interface ModelStatusProps {
  readonly fraction: number | null
  readonly failed: boolean
  readonly error: string | null
  readonly onRetry: () => void
}

/** First-load scorer download (cached after) or load failure. */
export function ModelStatus({ fraction, failed, error, onRetry }: ModelStatusProps) {
  if (failed) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Photo scorer unavailable</CardTitle>
          <CardDescription>
            The <ScorerTerm /> failed to load. Check your connection and retry.
            {error === null ? "" : ` (${error})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRetry} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Getting the photo scorer ready…</CardTitle>
        <CardDescription>
          Downloading the <ScorerTerm /> (once, then saved on this device).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={fraction === null ? null : Math.round(fraction * 100)} />
      </CardContent>
    </Card>
  )
}
