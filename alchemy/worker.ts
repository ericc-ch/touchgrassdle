/**
 * Edge worker in front of the static assets. Adds the same COOP/COEP
 * headers the dev server sends, so the threaded WASM scorer keeps
 * SharedArrayBuffer in production. Requests for `*.wasm` come from
 * the R2 bucket (Worker assets cap files at 25 MB); everything else
 * falls through to the built-in asset layer, which also answers when
 * a wasm key is missing from the bucket.
 */
interface R2ObjectLike {
  readonly body: ReadableStream<Uint8Array> | null
  readonly writeHttpMetadata: (headers: Headers) => void
}

interface R2BucketLike {
  readonly get: (key: string) => Promise<R2ObjectLike | null>
}

interface AssetEnv {
  readonly ASSETS: {
    readonly fetch: (request: Request) => Promise<Response>
  }
  readonly WASM_BUCKET: R2BucketLike
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
    if (!url.pathname.endsWith(".wasm")) {
      return env.ASSETS.fetch(uncached(request)).then(withIsolation)
    }
    return env.WASM_BUCKET.get(url.pathname.slice(1)).then((object) => {
      if (object === null || object.body === null) {
        return env.ASSETS.fetch(request).then(withIsolation)
      }
      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set("Content-Type", "application/wasm")
      headers.set("Cache-Control", "public, max-age=31536000, immutable")
      headers.set("Cross-Origin-Opener-Policy", "same-origin")
      headers.set("Cross-Origin-Embedder-Policy", "credentialless")
      return new Response(object.body, { headers })
    })
  },
}
