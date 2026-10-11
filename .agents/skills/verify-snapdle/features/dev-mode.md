# Dev mode (ten theme taps)

## Status

verified-via-evidence

## Sub-features

- Ten quick taps on the theme switch toggle the control panel (`?dev=1`
  also enables it; session-scoped, never ships visually). A pause longer
  than 1.5s between taps resets the count.
- Sections grouped by game phase. `Loading`: scorer-status `ToggleGroup`
  (Real/Loading/Ready/Error), bar fractions 0/11/50/99% (drive the slim
  loader card and the How-to-Play label), retry. `Scoring`: `Add N%`
  fake guesses, checking-spinner toggle, sample notice. `Done`:
  `Solve now`, `Fill to 6 (fail)`, `Clear board`, share. Plus overlays
  and storage clear + reload.
- Dev-injected guesses use gray SVG placeholder thumbnails and record stats
  through the same path as real guesses (idempotent per dateKey).

## How to get to it (user POV)

Invisible until enabled: tap the theme switch 10 times quickly, panel
docks at the bottom; tap it 10 more times or use Close to hide.

## Driving it with Playwright

Fresh context, `?e2eScorer=stub`, dismiss How to Play, then:

```ts
const toggle = page.getByRole("button", { name: /^Switch to (light|dark) theme$/ })
for (let index = 0; index < 10; index++) {
  await toggle.click()
}
await page.getByRole("heading", { name: "Dev mode", exact: true }).waitFor()
await page.getByRole("button", { name: "Solve now" }).click()
await page.locator("main").getByText("Found it!").waitFor() // live board, not a preview
```

The trigger, the 1.5s tap window, and `?dev=1` are covered natively by
`tests/e2e/dev-mode.spec.ts`. The live-board mutations are covered by
`.agents/skills/verify-snapdle/scripts/evidence.ts` (`dev.png` + transcript
`devSolve`).

Loading fractions make the model-load UI inspectable without a download:

```ts
await page.getByLabel("Developer mode").getByRole("button", { name: "99%" }).click()
await page.getByRole("button", { name: "How to play" }).click()
await expect(
  page.getByRole("dialog", { name: "How to play" }).getByText("Loading the photo scorer: 99%"),
).toBeVisible()
```

## Gotchas

- Day end auto-opens the stats dialog; scope live-board assertions to
  `main` or expect them behind the overlay.
- `Clear board` does not un-record stats; re-completing is idempotent per
  dateKey, same as reloads.

## Promotion Criteria

- [x] Ten quick theme taps toggle the panel on and off.
- [x] `Solve now` flips the live board to `Found it!` with no file upload.
- [x] Status `Error` shows `Photo scorer unavailable` on the live board.
- [x] Loading fractions drive the slim loader card and the How-to-Play
  label (`tests/e2e/dev-mode.spec.ts`).
