# Deploy

Static site on Cloudflare Workers via Alchemy (`alchemy.run.ts`, v2
Effect style). Prod domain: `touchgrassdle.ericc.ch` (zone adopted,
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
  threaded WASM scorer needs SharedArrayBuffer) and serves `*.wasm`
  from the `Wasm` R2 bucket. Everything else falls through to ASSETS.
- `assets.htmlHandling` is `"none"` so `/` matches no asset and
  reaches the worker, which serves `index.html` with headers. Asset
  matches bypass the worker entirely: alchemy beta never sends
  `run_worker_first` to the API, so headers cannot cover hashed
  assets. Same-origin subresources do not need them.
- Subrequests strip conditional headers: a 304 would preserve a stale
  edge entry with old headers forever.

## The 25 MB wall

Workers static assets cap files at 25 MB; the threaded ONNX wasm is
~25.6 MB and fails the deploy with `AssetTooLargeError`. The build
moves `dist/assets/*.wasm` to `dist-r2/` (`stage-large-assets.ts`,
run by `build:deploy`), the `UploadLargeAssets` Action (`R2
WriteBucket` + `WriteBucketLocal`) uploads them to R2, and the worker
serves them same-origin. The Action re-runs only when the
onnxruntime-web sources change and runs after the site (it takes
`site.url` as input), so it always reads freshly built files. Old R2
keys are kept: dist names embed the content hash, which makes
rollback safe.

## Cache caveat

`/` is the only unversioned path, so it is the only stale-prone
entry. After changing response headers, purge it or the edge keeps
serving the old copy: dashboard Caching → Purge Cache → Custom Purge
→ `touchgrassdle.ericc.ch/` (exact URL purge, no blast radius).
