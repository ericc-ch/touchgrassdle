import * as Alchemy from "alchemy"
import { adopt } from "alchemy/AdoptPolicy"
import * as Cloudflare from "alchemy/Cloudflare"
import { Stack } from "alchemy/Stack"
import * as Effect from "effect/Effect"

export default Alchemy.Stack(
  "snapdle",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const zone = yield* Cloudflare.Zone.Zone("Zone", {
      name: "ericc.ch",
    }).pipe(adopt(true))
    const stack = yield* Stack

    const site = yield* Cloudflare.Website.StaticSite("Website", {
      command: "pnpm build:deploy",
      outdir: "dist",
      main: "./alchemy/worker.ts",
      assets: {
        // "none" so `/` matches no asset and reaches the worker, which
        // serves index.html with COOP/COEP. Asset matches bypass the
        // worker entirely (alchemy never sends run_worker_first), so
        // headers cannot be added to them here.
        htmlHandling: "none",
        notFoundHandling: "single-page-application",
      },
      // The custom domain lives on prod only; other stages keep their
      // workers.dev URL so cold-cache experiments never touch DNS.
      ...(stack.stage === "prod" ? { domain: "snapdle.ericc.ch" } : {}),
    })

    return {
      url: site.url,
      zone: zone.name,
    }
  }),
)
