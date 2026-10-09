# Feature map

User-facing gaps with no automated coverage before this skill. All four
graduated to native Playwright specs (`pnpm e2e`); drive via the spec
command, not ad-hoc steps.

| Feature                                                     | Native spec                                         | Status           |
| ----------------------------------------------------------- | --------------------------------------------------- | ---------------- |
| Daily loop (boot, capture, score, clue, board, persistence) | `tests/e2e/boot.spec.ts`, `tests/e2e/guess.spec.ts` | graduated-to-e2e |
| Day end (reveal, countdown, share, stats)                   | `tests/e2e/day-end.spec.ts`                         | graduated-to-e2e |
| Theme + contrast                                            | `tests/e2e/theme.spec.ts`                           | graduated-to-e2e |
| Model error + retry                                         | `tests/e2e/model-error.spec.ts`                     | graduated-to-e2e |
