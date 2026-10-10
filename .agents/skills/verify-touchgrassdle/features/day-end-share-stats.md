# Day end (reveal, countdown, share, stats)

## Status

graduated-to-e2e

## Sub-features

- SolvedCard: "Found it!" + subject reveal + best % + ticking countdown.
- Share: clipboard card `Touchgrassdle #N 1/6 · best 100` + squares, no photos.
- StatsDialog auto-opens on day end with totals, histogram, countdown, share.
- Stats idempotent per UTC dateKey (reload records nothing twice).

## How to get to it (user POV)

Solve the day (or run out of photos). The reveal card appears, stats pop up,
Share copies the card for pasting to friends.

## Driving it with Playwright

```bash
pnpm exec playwright test tests/e2e/day-end.spec.ts
```

`?e2eScorer=solve` returns today's prompt embedding (cosine 1, score 100),
so one upload solves. Clipboard needs
`grantPermissions(["clipboard-read", "clipboard-write"])`.

## Gotchas

- Stats dialog overlays the SolvedCard: click Share scoped to the dialog,
  or the click times out behind the overlay.
- Countdown asserts on shape (`HH:MM:SS`), not value — it ticks every second.

## Promotion Criteria

- [x] Solved reveal shows label, photos used, best %.
- [x] Share card starts with `Touchgrassdle #`, has `1/6` and `🟥`.
- [x] Stats dialog auto-opens with Played 1 after solving.
- [x] Reload keeps Found it! and `played` at 1.
