# Handoff (2026-10-11)

Goal: finish the EmbeddingGemma 2 scorer swap verification — tap-to-open
photo-scorer explainer and an honest unified load bar — without breaking
the green gate.

Plan: prove the tooltip opens on tap in the live browser (playwriter,
throwaway 127.0.0.1 origin), confirm the bar never fakes 100% on a real
download, keep `pnpm check` green throughout.

State: gate green at commit time (`tsc`, 30/30 vitest, oxlint/oxfmt clean
save 2 pre-existing warnings, 7/7 e2e from the matching code). Preview
instance cleaned up; dev server (5173) left running; your localhost tab
and day untouched. Playwriter sessions all deleted.

Done:

- EG2 scorer swap + fp16-on-WASM + anchored mobile layout (`351054f`,
  `ad5794a`, `ee96d1e`): proven — cold WASM load + bike photo 36% with
  zero errors in headless Helium; match 18% vs non-match 1% twice in the
  live browser (`pw-eg2-proof.png`).
- Verify-skill maintenance (`b1b078c`): real-model proof via playwriter,
  stale 55MB copy swept.
- Tooltip + bar rework (`a871d90`, this commit): `tsc` + 30/30 green.
  Mouse-click opens the tooltip (headless matrix). Bar is high-water
  capped at 99%.

Unfinished:

- Tap/focus do NOT open the tooltip in tests (headless focus: closed;
  live-browser touchstart/touchend/focus/click sequence: closed). Only
  mouse click proven open. Resume: `src/components/scorer-term.tsx`.
- Bar cap (99%) never observed on a real multi-file download — only
  reasoned about. Resume: `src/game/scorer.ts` `reportProgress`.
- Dev-mode expansion for the verify skill (HESOYAM sections for
  loading/scoring/done) was designed, never built.

Next:

1. Open How to Play on the phone, tap "photo scorer" — if it opens,
   close this out; if not, read Gotchas and dig.
2. Fresh-origin load with network throttling: watch the bar climb
   without hitting 100% early or jumping backwards.
3. Build the dev-mode verification sections (`dev-drawer.tsx`,
   `.agents/skills/verify-touchgrassdle/features/dev-mode.md`).

Decisions made:

- Controlled Tooltip + onClick toggle + `closeOnClick={false}`: base-ui
  cancels tap opens on pointer-down by default (source:
  `TooltipTrigger.js` `onPointerDown`/`onClick`).
- Bar = high-water mark capped at 99%; filenames deleted from UI (the
  throttled-label experiment caused the 0→100 bug and the flicker).
- Playwriter in the live browser is the only trusted driver for
  model/touch behavior; headless Helium stalls on weight downloads.

Gotchas:

- Base-ui TooltipTrigger renders a `<button>` by default; ours uses
  `render={<span tabIndex={0}>}`. Focus heuristics (`:focus-visible`)
  may be why programmatic/touch focus never opens it — click path is
  state-driven and should be immune, but isn't proven.
- `context.pages()` in a playwriter session sees only that session's
  pages, never your existing tabs — but always verify before/after.
- Extension sessions can't create touch contexts
  (`Target.createBrowserContext` fails); touch must be tested with the
  real device or synthetic touch+focus+click sequences.
- `pkill -f` matches its own command line — use `pgrep -f 'pattern[f]'`.

Code map (where things live):

- Load bar: `src/game/scorer.ts` (`reportProgress`, `seenFraction`,
  `ScorerSnapshot.fraction`) → `src/game/session.ts` (`modelFraction`)
  → `src/components/model-status.tsx` (`Progress`) and the How-to-Play
  dialog label in `src/components/how-to-play-dialog.tsx`.
- Tooltip: `src/components/scorer-term.tsx` (the term + explainer, used
  in `model-status.tsx` and `how-to-play-dialog.tsx`) on top of
  `src/components/ui/tooltip.tsx` (shadcn/base-ui primitives,
  `TooltipProvider` wired in `src/app.tsx`).
