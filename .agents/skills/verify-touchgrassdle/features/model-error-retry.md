# Model error + retry

## Status

graduated-to-e2e

## Sub-features

- Scorer failure shows photo-scorer-unavailable card with the error and Retry.
- Retry re-attempts loading; recovers when the model becomes available.

## How to get to it (user POV)

First visit with no connection (or a broken model cache): the photo scorer
card explains and offers Retry instead of a dead board.

## Driving it with Playwright

```bash
pnpm exec playwright test tests/e2e/model-error.spec.ts
```

`?e2eScorer=fail` throws `ModelLoadError` instantly — no waiting on a
55MB download to time out.

## Gotchas

- Retry deterministically fails again under `fail` mode; recovery is
  covered by the stub specs (same load path, succeeding).
- No console errors expected: the failure is caught into React state.

## Promotion Criteria

- [x] Error card with "Photo scorer unavailable" + Retry button.
- [x] Retry re-renders the error instead of hanging.
