import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  retryAction,
  scorerDownloadNote,
  scorerFailedNote,
  scorerGettingReadyTitle,
  scorerUnavailableTitle,
} from "@/copy.ts"
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
          <CardTitle>{scorerUnavailableTitle}</CardTitle>
          <CardDescription>
            The <ScorerTerm /> {scorerFailedNote}
            {error === null ? "" : ` (${error})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRetry} variant="outline">
            {retryAction}
          </Button>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{scorerGettingReadyTitle}</CardTitle>
        <CardDescription>
          Downloading the <ScorerTerm /> {scorerDownloadNote}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={fraction === null ? null : Math.round(fraction * 100)} />
      </CardContent>
    </Card>
  )
}
