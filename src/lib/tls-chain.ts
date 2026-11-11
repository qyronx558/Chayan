import https from "node:https"
import tls from "node:tls"
import zlib from "node:zlib"
import { Readable } from "node:stream"
import { X509Certificate } from "node:crypto"

/**
 * Many official portals are misconfigured: they send only their own
 * certificate and leave out the intermediate one that links it to a trusted
 * root. Browsers quietly download the missing piece (its address is written
 * inside the certificate, the "CA Issuers" field) and carry on; Node refuses
 * the connection. This module does what browsers do.
 *
 * Trust is NOT relaxed: the downloaded intermediate is only added as a
 * candidate link, and the chain must still verify up to one of Node's built-in
 * root authorities. A site with a self-signed, expired or wrong-host
 * certificate keeps failing.
 */

const CHAIN_ERRORS = new Set([
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
])
const MAX_CHAIN_DEPTH = 4
const MAX_CERT_BYTES = 64 * 1024
const STEP_TIMEOUT_MS = 6000
/** Hosts whose missing certificates were already fetched (per server instance). */
const intermediateCache = new Map<string, Promise<string[]>>()

/** True when a fetch() failed only because the site sent an incomplete chain. */
export function isIncompleteChainError(err: unknown): boolean {
  const cause = (err as { cause?: { code?: unknown } } | null)?.cause
  return typeof cause?.code === "string" && CHAIN_ERRORS.has(cause.code)
}

function readLeaf(host: string, port: number): Promise<X509Certificate | null> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      // Verification is off for this one handshake only: nothing is sent or
      // read on it, it exists to look at the certificate the site presents.
      { host, port, servername: host, rejectUnauthorized: false, ALPNProtocols: ["http/1.1"] },
      () => {
        const cert = socket.getPeerX509Certificate() ?? null
        socket.destroy()
        resolve(cert)
      }
    )
    socket.setTimeout(STEP_TIMEOUT_MS, () => {
      socket.destroy()
      resolve(null)
    })
    socket.on("error", () => resolve(null))
  })
}

async function downloadIssuer(
  cert: X509Certificate,
  assertPublic: (url: URL) => Promise<void>
): Promise<X509Certificate | null> {
  const uri = /CA Issuers - URI:(\S+)/.exec(cert.infoAccess ?? "")?.[1]
  if (!uri) return null
  try {
    const url = new URL(uri)
    // The address comes from the remote site, so it gets the same SSRF check
    // as any other outbound fetch, and redirects are not followed.
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    await assertPublic(url)
    const res = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(STEP_TIMEOUT_MS) })
    if (!res.ok) return null
    const bytes = Buffer.from(await res.arrayBuffer())
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_CERT_BYTES) return null
    return new X509Certificate(bytes) // accepts DER and PEM
  } catch {
    return null
  }
}

async function collectIntermediates(
  host: string,
  port: number,
  assertPublic: (url: URL) => Promise<void>
): Promise<string[]> {
  const pems: string[] = []
  // Flaky portals drop some handshakes, so look twice before giving up.
  let current = (await readLeaf(host, port)) ?? (await readLeaf(host, port))
  for (let depth = 0; current && depth < MAX_CHAIN_DEPTH; depth++) {
    const issuer = await downloadIssuer(current, assertPublic)
    if (!issuer) break
    pems.push(issuer.toString())
    if (issuer.checkIssued(issuer)) break // reached a root
    current = issuer
  }
  return pems
}

function decodeBody(res: import("node:http").IncomingMessage): { body: Readable; decoded: boolean } {
  const encoding = String(res.headers["content-encoding"] || "").toLowerCase()
  if (encoding === "gzip" || encoding === "x-gzip") return { body: res.pipe(zlib.createGunzip()), decoded: true }
  if (encoding === "deflate") return { body: res.pipe(zlib.createInflate()), decoded: true }
  if (encoding === "br") return { body: res.pipe(zlib.createBrotliDecompress()), decoded: true }
  return { body: res, decoded: false }
}

/**
 * Repeat a request that failed with an incomplete-chain error, this time
 * supplying the intermediates the site forgot. Redirects are never followed
 * (the caller validates every hop itself). Throws the usual TLS error when the
 * chain still does not lead to a trusted root.
 */
export async function fetchWithRepairedChain(
  url: URL,
  init: { method?: string; headers?: HeadersInit; signal?: AbortSignal | null },
  assertPublic: (url: URL) => Promise<void>
): Promise<Response> {
  const port = url.port ? Number(url.port) : 443
  const key = `${url.hostname}:${port}`
  let pending = intermediateCache.get(key)
  if (!pending) {
    pending = collectIntermediates(url.hostname, port, assertPublic)
    intermediateCache.set(key, pending)
    // Do not remember a failed lookup; the next request tries again.
    void pending.then((pems) => {
      if (pems.length === 0) intermediateCache.delete(key)
    })
  }
  const intermediates = await pending
  if (intermediates.length === 0) throw new Error("Official site has an invalid security certificate")

  const headers: Record<string, string> = { "accept-encoding": "gzip, deflate, br" }
  new Headers(init.headers).forEach((value, name) => {
    headers[name] = value
  })

  return new Promise<Response>((resolve, reject) => {
    const options: https.RequestOptions & { ALPNProtocols: string[] } = {
      method: init.method || "GET",
      headers,
      ca: [...tls.rootCertificates, ...intermediates],
      ALPNProtocols: ["http/1.1"],
      signal: init.signal ?? undefined,
    }
    const req = https.request(
      url,
      options,
      (res) => {
        const status = res.statusCode || 502
        const out = new Headers()
        const { body, decoded } = decodeBody(res)
        for (const [name, value] of Object.entries(res.headers)) {
          if (value === undefined) continue
          if (decoded && (name === "content-encoding" || name === "content-length")) continue
          if (name === "transfer-encoding" || name === "connection" || name === "keep-alive") continue
          for (const v of Array.isArray(value) ? value : [value]) out.append(name, v)
        }
        if (status === 204 || status === 205 || status === 304) {
          res.resume()
          resolve(new Response(null, { status, headers: out }))
          return
        }
        body.on("error", () => res.destroy())
        resolve(new Response(Readable.toWeb(body) as unknown as ReadableStream<Uint8Array>, { status, headers: out }))
      }
    )
    req.on("error", reject)
    req.end()
  })
}
