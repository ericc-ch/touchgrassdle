Touchgrassdle is a daily hidden-prompt photo game (see `photo-hunt.md`, the source of truth for product/scoring). Single-package Vite + React + Tailwind v4 + shadcn web app. Effect for game logic.

## Tooling (copied from xkeep)

- pnpm as package manager (`pnpm install`, `pnpm <script>`, `pnpm add`). Do not use npm/bun directly for deps.
- Strict TS (mirror of xkeep root flags) + `@effect/language-service`. Follow the code-conventions skill: Effect mandatory, `Schema` for parsing, tagged errors, `Effect.fn`/`Effect.gen`.
- `oxlint` + `oxfmt` (configs copied from xkeep). Path alias `@/*` → `./src/*`.
- Gate: `pnpm check` — typecheck, vitest, lint, format check, build.

## shadcn

- Preset: base-nova (`base` library, lucide icons), Tailwind v4 CSS variables theme in `src/index.css`, `components.json` at root.
- Skill installed at `.agents/skills/shadcn`. Use the registry for components: `pnpm dlx shadcn@latest add <names> -y` (works directly; the CLI detects pnpm via `pnpm-lock.yaml`).
- `cn` is the npm `cn` package (not `@/lib/utils`).
- Theming: semantic tokens scoped under `[data-theme="light"]` / `[data-theme="dark"]` in `src/index.css`; logic in `src/theme/` (Effect Schema parsers + React provider). New presets = new token block + option in `ThemeSwitch`.
