# Theme

## Status

graduated-to-e2e

## Sub-features

- Single dark/light toggle (`html[data-theme]`, `color-scheme`).
- Defaults to following the OS; once picked, the choice sticks (no System
  option). Zero border radius in both modes.
- Persists in localStorage and survives reload (no-flash inline script).

## How to get to it (user POV)

Header button: moon in light mode, sun in dark mode. Choice sticks across
visits.

## Driving it with Playwright

```bash
pnpm exec playwright test tests/e2e/theme.spec.ts
```

Clicks the `Dark theme` title, polls `dataset`, reloads, re-asserts dataset
+ storage key, then toggles back via `Light theme`.

## Gotchas

- Assert `documentElement.dataset`, not body classes — theming rides
  `data-theme` on `<html>`.
- Storage key is `snapdle:theme` (unversioned, unlike day/stats keys).

## Promotion Criteria

- [x] Dark sets `data-theme="dark"`.
- [x] Reload preserves the choice via localStorage.
