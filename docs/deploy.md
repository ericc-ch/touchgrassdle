# Deploy

Static site on Cloudflare Workers via Alchemy (`alchemy.run.ts`, v2
Effect style). Prod domain: `snapdle.ericc.ch` (zone adopted,
DNS + cert automatic).

## Commands

- `pnpm plan --stage prod` — preview
- `pnpm alchemy deploy --stage prod --yes` — ship (`deploy` script
  without `--yes` prompts for approval)
- `pnpm alchemy deploy --stage verify --yes` — cold-cache staging slot
  on workers.dev; the custom domain stays on prod

## Layout

- `Cloudflare.Website.StaticSite` runs `pnpm build:deploy`, uploads
  `dist/` as Worker assets, serves through `alchemy/worker.ts`.
- The worker adds COOP `same-origin` + COEP `credentialless` (the
  threaded WASM scorer needs SharedArrayBuffer).
- `assets.htmlHandling` is `"none"` so `/` matches no asset and
  reaches the worker, which serves `index.html` with headers. Asset
  matches bypass the worker entirely (alchemy never sends
  `run_worker_first`), so headers cannot be added to them here.
  Same-origin subresources do not need them.
- Subrequests strip conditional headers: a 304 would preserve a stale
  edge entry with old headers forever.

## The 25 MB wall

Workers static assets cap files at 25 MB. The threaded ONNX Runtime
wasm is ~25.6 MB, so `build:deploy` deletes `dist/assets/*.wasm`
after the build. The browser never requests that file: transformers
resolves the engine to the pinned jsdelivr CDN at runtime (browser
proof: force `navigator.gpu` to undefined, score a photo, watch the
requests). The model weights already download from Hugging Face the
same way, so no model bytes are self-hosted at all.

## R2 leftover

The first deploy design used an R2 bucket for the wasm and was later
removed in favor of the CDN default. Undeclaring a non-empty bucket
fails the deploy with `BucketNotEmpty` and still drops its state
entry, so re-declaring it later creates a fresh bucket instead of
reusing the old one. Stray `snapdle-wasm-*` buckets are
untracked orphans: private, pennies at most, safe to delete from the
dashboard (empty first, then delete the bucket).

## Cache caveat

`/` is the only unversioned path, so it is the only stale-prone
entry. After changing response headers, purge it or the edge keeps
serving the old copy: dashboard Caching → Purge Cache → Custom Purge
→ `snapdle.ericc.ch/` (exact URL purge, no blast radius).
