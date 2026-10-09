# Daily loop

## Status

graduated-to-e2e

## Sub-features

- Boot: header, Hunt number, empty board, theme switch, zero console errors.
- Capture: hidden file input scores a photo, Frozen 7 guess card with badge,
  score, clue, and thumbnail; shots-left decrements.
- Persistence: day + thumbnails under `touchgrassdle:v1:day:<dateKey>`;
  board intact across reload.

## How to get to it (user POV)

Open the app, tap Shoot, pick a photo. Each guess shows its temperature,
score, and a clue nudging toward the hidden prompt.

## Driving it with Playwright

```bash
pnpm exec playwright test tests/e2e/boot.spec.ts tests/e2e/guess.spec.ts
```

`?e2eScorer=stub` scores every photo 7 Frozen (1-d stub vector vs 768-d
prompt embeddings: cosine 0, logistic maps to 7). No model download.

## Gotchas

- Scorer loading is a module-singleton store (`src/game/scorer.ts`), not a
  mount effect: StrictMode double-mounts in dev, and an effect guard once
  bricked dev loading entirely. The store dedupes concurrent starts.
- `input[type="file"]` is hidden; `setInputFiles` works on it anyway.
- Score assertion is exact (`7`): stub math is deterministic, see
  `src/game/e2e-scorer.ts`.

## Promotion Criteria

- [x] Boot renders with no console/page errors.
- [x] One upload produces a Frozen guess with score, clue, thumbnail.
- [x] Reload preserves the board via the versioned storage key.
- [x] Runs offline in ~seconds (no 55MB model).
