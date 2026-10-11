Snapdle is a daily hidden-prompt photo game (see `photo-hunt.md`, the source of truth for product/scoring). Single-package Vite + React + Tailwind v4 + shadcn web app. Effect for game logic.

## Tooling (copied from xkeep)

- pnpm as package manager (`pnpm install`, `pnpm <script>`, `pnpm add`). Do not use npm/bun directly for deps.
- Strict TS (mirror of xkeep root flags) + `@effect/language-service`. Follow the code-conventions skill: Effect mandatory, `Schema` for parsing, tagged errors, `Effect.fn`/`Effect.gen`.
- `useEffect` is banned (`no-restricted-imports`; `src/components/ui/**` registry files exempt): synchronize with `useSyncExternalStore`, derive during render, or move work into event handlers.
- `oxlint` + `oxfmt` (configs copied from xkeep). Path alias `@/*` → `./src/*`.
- Gate: `pnpm check` — typecheck, vitest, lint, format check, build.

## shadcn

- Preset: base-nova (`base` library, lucide icons), Tailwind v4 CSS variables theme in `src/index.css`, `components.json` at root.
- Skill installed at `.agents/skills/shadcn`. Use the registry for components: `pnpm dlx shadcn@latest add <names> -y` (works directly; the CLI detects pnpm via `pnpm-lock.yaml`).
- `cn` is the npm `cn` package (not `@/lib/utils`).
- Theming: semantic tokens scoped under `[data-theme="light"]` / `[data-theme="dark"]` in `src/index.css`; logic in `src/theme/` (Effect Schema parsers + React provider). New presets = new token block + option in `ThemeSwitch`.
- Scorer: EmbeddingGemma 2 via `@huggingface/transformers` (`onnx-community/embeddinggemma-2-ONNX`). Weights per device: WebGPU loads q4f16 (~290MB: 157 text + 98 vision + 32 tokenizer); WASM loads fp16 (~910MB) because the WASM build lacks the block-quantized kernels (GatherBlockQuantized/MatMulNBits — q4f16, q4 and quantized all fail session creation there). Audio encoder never fetched. Photos and today's prompt query embed on-device into one vector space; starting hint shows while loading. Runtimes: WebGPU when `requestAdapter()` resolves, else WASM — chosen up front because transformers chains session creation on one shared promise and a failed first attempt poisons later retries.
- COOP/COEP headers (`vite.config.ts` dev+preview) enable the threaded WASM build. Production hosting must send them too.
- Browser proof: `pnpm build && pnpm smoke:browser` (headless Helium via nix store, `E2E_BROWSER` overrides). Leaves no stray server.
- E2E: Playwright `tests/e2e/` (stub scorer via `?e2eScorer=stub|solve|fail`, no model download). `pnpm e2e` probes `helium` for `E2E_BROWSER` (bundled Chromium lacks system libs on nix). Verification skill: `.agents/skills/verify-snapdle/` (launch/doctor/drive/evidence/cleanup, proof in `.audit/evidence/`).
- Storage is versioned (`snapdle:v1:…`). Stats (`src/game/stats.ts`: played/wins/streaks/1-6 histogram, Wordle rules — only completed days count, losses reset streak) record once per UTC dateKey. Contrast mode (`standard`/`high`, orange-blue bands) rides the theme provider as `data-contrast`, separate from light/dark.
