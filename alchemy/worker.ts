/**
 * Edge worker in front of the static assets. Adds the same COOP/COEP
 * headers the dev server sends, so the threaded WASM scorer keeps
 * SharedArrayBuffer in production.
 */
interface AssetEnv {
  readonly ASSETS: {
    readonly fetch: (request: Request) => Promise<Response>
  }
}

const withIsolation = (upstream: Response): Response => {
  const headers = new Headers(upstream.headers)
  headers.set("Cross-Origin-Opener-Policy", "same-origin")
  headers.set("Cross-Origin-Embedder-Policy", "credentialless")
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}

/**
 * Clone a request without conditional headers. The edge revalidates
 * `max-age=0` responses on every hit; forwarding the client's
 * validators would answer 304 and preserve a stale cached entry
 * forever. Always returning 200 keeps the cache entry current.
 */
const uncached = (request: Request): Request => {
  const headers = new Headers(request.headers)
  headers.delete("if-none-match")
  headers.delete("if-modified-since")
  return new Request(request, { headers })
}

export default {
  fetch: (request: Request, env: AssetEnv): Promise<Response> => {
    const url = new URL(request.url)
    if (url.pathname === "/") {
      // `/` matches no asset under htmlHandling "none", so the worker
      // runs and serves the app shell with isolation headers. The query
      // string is preserved.
      const inner = uncached(request)
      const shell = new Request(new URL(`/index.html${url.search}`, inner.url), inner)
      return env.ASSETS.fetch(shell).then(withIsolation)
    }
    return env.ASSETS.fetch(uncached(request)).then(withIsolation)
  },
}
