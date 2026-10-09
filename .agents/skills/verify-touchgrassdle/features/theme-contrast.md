# Theme + contrast

## Status

graduated-to-e2e

## Sub-features

- Light / dark / system switch (`html[data-theme]`, `color-scheme`).
- High-contrast toggle (`html[data-contrast]`), orange-blue bands.
- Both persist in localStorage and survive reload (no-flash inline script).

## How to get to it (user POV)

Header buttons: sun / moon / monitor for theme, contrast icon for palette.
Choice sticks across visits.

## Driving it with Playwright

```bash
pnpm exec playwright test tests/e2e/theme.spec.ts
```

Clicks `Dark theme` and `High contrast` titles, polls `dataset`, reloads,
re-asserts dataset + storage keys.

## Gotchas

- Assert `documentElement.dataset`, not body classes — theming rides
  `data-theme` / `data-contrast` on `<html>`.
- Storage keys are `touchgrassdle:theme` and `touchgrassdle:contrast`
  (unversioned, unlike day/stats keys).

## Promotion Criteria

- [x] Dark sets `data-theme="dark"`; contrast sets `data-contrast="high"`.
- [x] Reload preserves both via localStorage.
