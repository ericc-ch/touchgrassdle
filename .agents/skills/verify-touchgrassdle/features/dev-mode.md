# Dev mode (HESOYAM)

## Status

verified-via-evidence

## Sub-features

- Typing `HESOYAM` anywhere toggles the control panel (`?dev=1` also
  enables it; session-scoped, never ships visually).
- Every button mutates the live board in place: `Add N%`, `Solve now`,
  `Fill to 6 (fail)`, `Clear board`, scorer-status `ToggleGroup`
  (Real/Loading/Ready/Error/No prompt), checking-spinner toggle, sample
  notice, dialogs, share, storage clear + reload.
- Dev-injected guesses use gray SVG placeholder thumbnails and record stats
  through the same path as real guesses (idempotent per dateKey).

## How to get to it (user POV)

Invisible until enabled: type HESOYAM, panel docks at the bottom; type it
again (or Close) to hide.

## Driving it with Playwright

Fresh context, `?e2eScorer=stub`, dismiss How to Play, then:

```ts
await page.keyboard.type("HESOYAM")
await page.getByText("Dev mode · HESOYAM").waitFor()
await page.getByRole("button", { name: "Solve now" }).click()
await page.getByText("Found it!").waitFor() // live board, not a preview
```

Covered by `.agents/skills/verify-touchgrassdle/scripts/evidence.ts`
(`dev.png` + transcript `devSolve`), not a native spec — dev-only surface.

## Gotchas

- Day end auto-opens the stats dialog; scope live-board assertions to
  `main` or expect them behind the overlay.
- `Clear board` does not un-record stats; re-completing is idempotent per
  dateKey, same as reloads.

## Promotion Criteria

- [x] HESOYAM toggles the panel on and off.
- [x] `Solve now` flips the live board to `Found it!` with no file upload.
- [x] Status `Error` shows `Photo scorer unavailable` on the live board.
