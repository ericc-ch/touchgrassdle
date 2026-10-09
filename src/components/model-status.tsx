import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export interface ModelStatusProps {
  readonly file: string | null
  readonly fraction: number | null
  readonly failed: boolean
  readonly error: string | null
  readonly onRetry: () => void
}

/** First-load model download (~55MB, cached after) or load failure. */
export function ModelStatus({ file, fraction, failed, error, onRetry }: ModelStatusProps) {
  if (failed) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Judge unavailable</CardTitle>
          <CardDescription>
            The on-device scorer failed to load. Check your connection and retry.
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
        <CardTitle>Waking the judge…</CardTitle>
        <CardDescription>
          {file === null ? "Downloading the on-device scorer (once, then cached)." : file}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={fraction === null ? null : Math.round(fraction * 100)} />
      </CardContent>
    </Card>
  )
}
