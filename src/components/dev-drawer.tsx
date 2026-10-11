import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { disableDevMode } from "@/game/dev-cheat.ts"
import type { DailyGame, GameStatus } from "@/game/session.ts"

export interface DevDrawerProps {
  readonly game: DailyGame
  readonly promptLabel: string
  readonly promptId: string
  readonly onHowTo: () => void
  readonly onStats: () => void
}

const STATUS_VALUE: Record<GameStatus, string> = {
  "loading-model": "loading",
  ready: "ready",
  "model-error": "error",
}

function clearDevStorage(): void {
  try {
    const doomed: Array<string> = []
    for (let index = 0; index < window.localStorage.length; index++) {
      const key = window.localStorage.key(index)
      if (key !== null && key.startsWith("touchgrassdle:")) {
        doomed.push(key)
      }
    }
    for (const key of doomed) {
      window.localStorage.removeItem(key)
    }
    window.sessionStorage.removeItem("touchgrassdle:dev")
  } catch {
    // Reload still resets the session view.
  }
  window.location.reload()
}

/**
 * HESOYAM control panel. Every button mutates the live game in place —
 * the board above is the thing under test, nothing here is a preview.
 */
export function DevDrawer({ game, promptLabel, promptId, onHowTo, onStats }: DevDrawerProps) {
  const { dev } = game
  const boardLocked = !game.open || game.scoring
  const statusValue = dev.statusOverride === null ? "real" : STATUS_VALUE[dev.statusOverride]

  const selectStatus = (values: ReadonlyArray<string>): void => {
    const next = values[values.length - 1] ?? "real"
    if (next === "real") {
      dev.setStatusOverride(null)
      dev.setFractionOverride(null)
      dev.setErrorOverride(null)
    } else if (next === "loading") {
      dev.setStatusOverride("loading-model")
      dev.setFractionOverride(0.5)
      dev.setErrorOverride(null)
    } else if (next === "ready") {
      dev.setStatusOverride("ready")
      dev.setFractionOverride(null)
      dev.setErrorOverride(null)
    } else {
      dev.setStatusOverride("model-error")
      dev.setFractionOverride(null)
      dev.setErrorOverride("Demo scorer failure")
    }
  }

  return (
    <section aria-label="Developer mode" className="shrink-0 border-t bg-background">
      <div className="mx-auto flex max-h-[70svh] w-full max-w-md flex-col gap-3 overflow-y-auto p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Dev mode · HESOYAM</h2>
          <Button
            aria-label="Close dev mode"
            onClick={disableDevMode}
            size="icon-sm"
            variant="ghost"
          >
            <X />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Live board</CardTitle>
            <CardDescription>
              Day #{game.dayNumber} · {promptLabel} ({promptId}) · {game.status} ·{" "}
              {game.day.guesses.length} photos ·{" "}
              {game.solved ? "found" : game.open ? "open" : "closed"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              disabled={boardLocked}
              onClick={() => dev.addFakeGuess(7)}
              size="sm"
              variant="outline"
            >
              Add 7%
            </Button>
            <Button
              disabled={boardLocked}
              onClick={() => dev.addFakeGuess(40)}
              size="sm"
              variant="outline"
            >
              Add 40%
            </Button>
            <Button
              disabled={boardLocked}
              onClick={() => dev.addFakeGuess(58)}
              size="sm"
              variant="outline"
            >
              Add 58%
            </Button>
            <Button
              disabled={boardLocked}
              onClick={() => dev.addFakeGuess(72)}
              size="sm"
              variant="outline"
            >
              Add 72%
            </Button>
            <Button disabled={boardLocked} onClick={dev.solveNow} size="sm" variant="outline">
              Solve now
            </Button>
            <Button disabled={boardLocked} onClick={dev.fillFailed} size="sm" variant="outline">
              Fill to 6 (fail)
            </Button>
            <Button onClick={dev.clearBoard} size="sm" variant="outline">
              Clear board
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scorer status</CardTitle>
            <CardDescription>Overrides what the board shows, live.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <ToggleGroup
              aria-label="Scorer status"
              onValueChange={selectStatus}
              value={[statusValue]}
            >
              <ToggleGroupItem aria-label="Real scorer status" value="real">
                Real
              </ToggleGroupItem>
              <ToggleGroupItem aria-label="Loading scorer status" value="loading">
                Loading
              </ToggleGroupItem>
              <ToggleGroupItem aria-label="Ready scorer status" value="ready">
                Ready
              </ToggleGroupItem>
              <ToggleGroupItem aria-label="Error scorer status" value="error">
                Error
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="flex flex-wrap gap-2">
              <Button onClick={game.retryLoad} size="sm" variant="outline">
                Retry scorer
              </Button>
              <Button onClick={() => dev.setScoringNow(!game.scoring)} size="sm" variant="outline">
                {game.scoring ? "Stop checking" : "Start checking"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overlays and notices</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={onHowTo} size="sm" variant="outline">
              Open How to play
            </Button>
            <Button onClick={onStats} size="sm" variant="outline">
              Open Stats
            </Button>
            <Button onClick={game.share} size="sm" variant="outline">
              Share
            </Button>
            <Button
              onClick={() => dev.setNoticeText("Couldn't score that photo: demo failure (dev)")}
              size="sm"
              variant="outline"
            >
              Sample error
            </Button>
            <Button onClick={() => dev.setNoticeText(null)} size="sm" variant="outline">
              Clear notice
            </Button>
            <Button onClick={clearDevStorage} size="sm" variant="destructive">
              Clear storage + reload
            </Button>
          </CardContent>
        </Card>

        <p className="pb-2 text-center text-xs text-muted-foreground">
          Every button above changes the live board. Stats record once per day. Type HESOYAM again
          to hide.
        </p>
      </div>
    </section>
  )
}
