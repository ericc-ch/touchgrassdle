# Real-model proof (EmbeddingGemma 2, live browser)

## Status

deterministic

## Sub-features

- Cold first load pulls text + vision weights + tokenizer (WebGPU:
  q4f16 ~290MB; WASM: fp16 ~910MB, no audio files either way) into
  per-origin Cache Storage, then the board goes ready
  with zero console errors.
- A genuine photo of the day's object outscores a wrong-object photo
  (pairwise property; spike: 97% over 122 photos).
- The user's tabs, day, and storage are untouched (throwaway origin).

## How to get to it (user POV)

First visit on a fresh origin: loader bar climbs monotonically to ready,
starting hint visible throughout. Take photos, get closeness %.

## Driving it with playwriter

Headless helium cannot do this run (stalls on the weight downloads, see
SKILL.md). Needs a server already up — their `pnpm dev` (5173) or the
skill preview (4173, `launch.sh`):

```bash
playwriter session new --tab-group snapdle  # note the id
playwriter -s <id> --timeout 600000 -f .agents/skills/verify-snapdle/scripts/proof-real-model.js
# expect: READY, MATCH "18% close…", NON "1% close…", RESULT … pass=true
playwriter session delete <id>  # after closing the proof page
```

Close the proof page before deleting the session
(`context.pages()` must show only their tabs afterwards).

## Gotchas

- First run on a fresh origin downloads ~290MB; allow up to 10 min for
  Start. Re-runs hit cache and reach ready in seconds.
- Fixtures are day-sensitive: MATCH_PHOTO must depict the current day's
  object (rotation in `src/game/prompts.ts`); NON_PHOTO must not.
- Scores vary by photo (one Commons bike photo = 18%, not a quality
  claim); only the ordering `match > non` is asserted.
- `setInputFiles` on the hidden file input; guess rows appear as
  `main li` with `<score>% close`.
- If Start never enables: read the board text — model-error + Retry
  means the app failed, not the proof. Stall with no error and no byte
  growth in a *headless* browser means helium, retry in the live browser.

## Promotion Criteria

Cannot graduate to native e2e: needs a 290MB download and a live
user browser. Stays a skill-level deterministic workflow instead.

- [x] Cold load completes, correct file set (text + vision, no audio;
  fp16 set proven on the WASM path, which shares the phone's kernels).
- [x] Match outscores non-match (18 vs 1 on bicycle day, 2026-10-11).
- [x] Repeat pass green (re-run, cache-hot).
