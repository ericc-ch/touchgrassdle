---
name: verify-snapdle
description: Drive the Snapdle daily photo game in a real browser, capture proof, and graduate workflows into Playwright E2E.
---

# Verify Snapdle

Temporary verification harness for Snapdle (Vite + React SPA, port
4173 preview / 5173 dev). Unit tests (`src/**/*.test.ts`) cover pure game
logic only; everything below covers the untested gap: real browser behavior.

## Launch

```bash
.agents/skills/verify-snapdle/scripts/launch.sh
```

Builds (`tsc -b && vite build`) and starts `vite preview` on
`http://127.0.0.1:4173` (strict port). Saves the preview PID to
`.audit/verify.pid`, waits until `/` answers. Ready looks like:

```text
preview up (pid 12345)
```

Ports: 4173 preview (skill), 5173 dev (`pnpm dev`, unrelated, may run
alongside). No auth, no env vars, no seed data. First real-model load
downloads weights per device (WebGPU: q4f16 ~290MB; WASM: fp16 ~910MB —
the WASM build lacks the block-quantized kernels; no audio on either),
cached after in per-origin Cache Storage; stub modes avoid it entirely.

## Doctor

Read-only. Run before driving:

```bash
.agents/skills/verify-snapdle/scripts/doctor.sh
```

Checks: PID file exists, process alive, port 4173 answers HTTP 200,
COOP/COEP headers present (threaded WASM needs them). Prints `ready: …`
or the exact failed check. Never starts or kills anything.

## Drive

Two layers. Prefer the native specs; use the evidence script for screenshots.

```bash
# One graduated workflow (default: guess). Probes helium for E2E_BROWSER.
.agents/skills/verify-snapdle/scripts/drive.sh [boot|guess|day-end|theme|model-error]
# Full native suite (also the CI shape).
pnpm e2e
```

Scorer modes via `?e2eScorer=` (see `src/game/e2e-scorer.ts`, query-gated,
production untouched): `stub` scores every photo 0, `solve` scores 100,
`fail` forces photo-scorer-unavailable. No model download.

Stable handles (real selectors, no placeholders):

- Headings `Snapdle`, `/Day #\d+/`; buttons `/Take photo \(\d left\)/`,
  `View statistics` (aria-label), `Share score` / `Copied!`, `Retry`;
  titles `Dark theme` / `Light theme` (single toggle); text
  `Starting hint`, `Found it!`, `Out of photos`,
  `Photo scorer unavailable`, `/Next day in \d\d:\d\d:\d\d/`;
  hidden `input[type="file"]` driven with `setInputFiles` (works hidden).
- Dev mode: tap the theme switch 10 times quickly to toggle the control
  panel (a pause over 1.5s resets the count; `?dev=1` also works). Every
  button mutates the live board in place, grouped by phase — `Solve now`,
  `Fill to 6 (fail)`, `Add N%`, scorer-status `ToggleGroup`
  (Real/Loading/Ready/Error), loading-bar fractions (0/11/50/99%).
  See `tests/e2e/dev-mode.spec.ts`.
- Share from inside the stats `dialog` (it overlays the SolvedCard).
- Clipboard assertions need
  `context.grantPermissions(["clipboard-read", "clipboard-write"])`.
- Fresh browser context per test = isolated localStorage. Parallel workers OK.

## Real-model proof (playwriter, not helium)

Stub modes prove wiring, not scoring. The real scorer (~290MB weights,
per-origin Cache Storage) is proven in the user's live browser via
`playwriter` — never headless helium: headless stalls mid-download on the
weight files (bytes stop, no errors, page never becomes ready), while the
same files download fine in a real browser. Do not debug the app for a
helium transport stall.

Rules (learned the hard way):

- Never touch the user's tab or day. Open a throwaway page on the
  loopback twin (`http://127.0.0.1:5173/` when they serve
  `http://localhost:5173/`, or vice versa): separate origin means
  separate localStorage, separate Cache Storage, separate day.
- Requires their dev server (`pnpm dev` on 5173, they start it) OR the
  skill preview (4173, you start it via `launch.sh`). Prefer whichever
  is already up; never start `pnpm dev` yourself.
- First run on a fresh origin downloads ~290MB (watch it land, then it
  is cached); re-runs load from cache in seconds.
- Close the proof page when done, delete the session. Their tabs stay
  exactly as found. Verify with `context.pages()` before and after.
- Drive with `scripts/proof-real-model.js` (see
  `features/real-model-proof.md`): cold-load byte count, match photo vs
  non-match photo on the day's object, `RESULT … pass=true`.

```bash
playwriter session new --tab-group snapdle  # note the id, use as -s
playwriter -s <id> --timeout 600000 -f .agents/skills/verify-snapdle/scripts/proof-real-model.js
playwriter session delete <id>
```

## Evidence

```bash
pnpm exec tsx .agents/skills/verify-snapdle/scripts/evidence.ts
```

Writes `.audit/evidence/board.png` (stub guess on the board),
`.audit/evidence/solved.png` (reveal + share), `.audit/evidence/dev.png`
(dev panel + live `Found it!` after `Solve now`), `.audit/evidence/transcript.json`
(URLs, console errors, storage keys, guess text, share card, dev proof). Drive logs land
at `.audit/evidence/drive-<spec>.log`. Evidence survives cleanup.

## Cleanup

```bash
.agents/skills/verify-snapdle/scripts/cleanup.sh
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
