import { writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { Page } from "@playwright/test"

// 1x1 transparent PNG.
const PIXEL_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

/** 1px PNG for capture uploads, written once per machine to the OS temp dir. */
export function pixelPngPath(): string {
  const path = join(tmpdir(), "snapdle-pixel.png")
  try {
    writeFileSync(path, Buffer.from(PIXEL_PNG, "base64"), { flag: "wx" })
  } catch {
    // Already exists (parallel worker got there first); reuse it.
  }
  return path
}

/**
 * Load the app with a stubbed scorer (see `src/game/e2e-scorer.ts`).
 * `stub` scores every photo 0, `solve` scores 100,
 * `fail` shows photo-scorer-unavailable. No model download, fully deterministic.
 * Dismisses the first-visit How to Play dialog, except in `fail` mode
 * where Play never enables (the dialog itself carries the Retry path).
 * Then picks the first of the three daily subjects, unless `pick` is false.
 */
export async function gotoStub(
  page: Page,
  mode: "stub" | "solve" | "fail",
  options?: { readonly pick?: boolean },
): Promise<void> {
  await page.goto(`/?e2eScorer=${mode}`, { waitUntil: "domcontentloaded" })
  if (mode === "fail") {
    return
  }
  const start = page.getByRole("button", { name: "Start playing", exact: true })
  await start.waitFor({ timeout: 15_000 })
  await start.click()
  if (options?.pick === false) {
    return
  }
  await page
    .getByRole("button", { name: /^Choose/ })
    .first()
    .click()
}
