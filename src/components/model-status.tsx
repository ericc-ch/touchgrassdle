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

/** First-load scorer download (cached after) or load failure. */
export function ModelStatus({ file, fraction, failed, error, onRetry }: ModelStatusProps) {
  if (failed) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Photo scorer unavailable</CardTitle>
          <CardDescription>
            The{" "}
            <abbr title="Compares your photo to today's hidden subject on this device, 0 to 100%.">
              photo scorer
            </abbr>{" "}
            failed to load. Check your connection and retry.
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
          Downloading the{" "}
          <abbr title="Compares your photo to today's hidden subject on this device, 0 to 100%.">
            photo scorer
          </abbr>{" "}
          (once, then saved on this device).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-3 pt-0">
        {file === null ? null : <p className="truncate text-xs text-muted-foreground">{file}</p>}
        <Progress value={fraction === null ? null : Math.round(fraction * 100)} />
      </CardContent>
    </Card>
  )
}
