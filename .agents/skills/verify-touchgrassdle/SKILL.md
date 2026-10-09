---
name: verify-touchgrassdle
description: Drive the Touchgrassdle daily photo game in a real browser, capture proof, and graduate workflows into Playwright E2E.
---

# Verify Touchgrassdle

Temporary verification harness for Touchgrassdle (Vite + React SPA, port
4173 preview / 5173 dev). Unit tests (`src/**/*.test.ts`) cover pure game
logic only; everything below covers the untested gap: real browser behavior.

## Launch

```bash
.agents/skills/verify-touchgrassdle/scripts/launch.sh
```

Builds (`tsc -b && vite build`) and starts `vite preview` on
`http://127.0.0.1:4173` (strict port). Saves the preview PID to
`.audit/verify.pid`, waits until `/` answers. Ready looks like:

```text
preview up (pid 12345)
```

Ports: 4173 preview (skill), 5173 dev (`pnpm dev`, unrelated, may run
alongside). No auth, no env vars, no seed data. First real-model load
downloads ~55MB (cached after); verification avoids it via stub modes.

## Doctor

Read-only. Run before driving:

```bash
.agents/skills/verify-touchgrassdle/scripts/doctor.sh
```

Checks: PID file exists, process alive, port 4173 answers HTTP 200,
COOP/COEP headers present (threaded WASM needs them). Prints `ready: …`
or the exact failed check. Never starts or kills anything.

## Drive

Two layers. Prefer the native specs; use the evidence script for screenshots.

```bash
# One graduated workflow (default: guess). Probes helium for E2E_BROWSER.
.agents/skills/verify-touchgrassdle/scripts/drive.sh [boot|guess|day-end|theme|model-error]
# Full native suite (also the CI shape).
pnpm e2e
```

Scorer modes via `?e2eScorer=` (see `src/game/e2e-scorer.ts`, query-gated,
production untouched): `stub` scores every photo 7 Frozen, `solve` scores
100 Blazing, `fail` forces Judge-unavailable. No model download.

Stable handles (real selectors, no placeholders):

- Headings `Touchgrassdle`, `/Hunt #\d+/`; buttons `/Shoot \(\d left\)/`,
  `View statistics` (aria-label), `Share score` / `Copied!`, `Retry`;
  titles `Dark theme`, `High contrast`; text `No shots yet…`, `Solved!`,
  `Out of shots`, `Judge unavailable`, `/Next hunt in \d\d:\d\d:\d\d/`;
  hidden `input[type="file"]` driven with `setInputFiles` (works hidden).
- Share from inside the stats `dialog` (it overlays the SolvedCard).
- Clipboard assertions need
  `context.grantPermissions(["clipboard-read", "clipboard-write"])`.
- Fresh browser context per test = isolated localStorage. Parallel workers OK.

## Evidence

```bash
pnpm exec tsx .agents/skills/verify-touchgrassdle/scripts/evidence.ts
```

Writes `.audit/evidence/board.png` (stub guess on the board),
`.audit/evidence/solved.png` (reveal + share), `.audit/evidence/transcript.json`
(URLs, console errors, storage keys, guess text, share card). Drive logs land
at `.audit/evidence/drive-<spec>.log`. Evidence survives cleanup.

## Cleanup

```bash
.agents/skills/verify-touchgrassdle/scripts/cleanup.sh
```

Kills only the PID in `.audit/verify.pid`, removes the file, lists
`.audit/evidence/` to confirm artifacts survived. Never kills by broad
process name (`pnpm dev` on 5173 is left alone).

## Helpers

All in `scripts/`, all executable:

- `launch.sh` — build + preview, save PID, wait for readiness.
- `doctor.sh` — read-only readiness check.
- `drive.sh [spec]` — run one native spec, tee output to evidence log.
- `evidence.ts` — screenshot + transcript proof (run with `pnpm exec tsx`).

Feature map: `features/README.md` + one file per user-facing gap. Proven
workflows graduate to `tests/e2e/*.spec.ts` (see `maintain-verification-skill`
for upkeep).
