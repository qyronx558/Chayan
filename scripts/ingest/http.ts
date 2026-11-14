/**
 * Polite HTTP client for government sites:
 *  - identifies itself (User-Agent with a contact page)
 *  - obeys robots.txt (User-agent: * / ChayanJobsBot groups)
 *  - at most one request per host every HOST_GAP_MS
 *  - timeouts, small retry budget, size caps
 * Many state/district portals ship incomplete TLS chains; for those (and only
 * after a certificate error) the request is retried without chain validation -
 * the content is public and every fact is still re-verified downstream.
 */
import { constants as cryptoConstants } from "node:crypto"
import { Agent, fetch as undiciFetch, type Dispatcher } from "undici"

export const USER_AGENT = `ChayanJobsBot/1.0 (+${(process.env.INGEST_PUBLIC_URL || "https://chayanjobs.in").replace(/\/+$/, "")}/editorial-policy)`
const HOST_GAP_MS = Number(process.env.INGEST_HOST_GAP_MS || 2000)
const TIMEOUT_MS = 25_000

const strict = new Agent({ connect: { timeout: 15_000 } })
const lenient = new Agent({ connect: { timeout: 15_000, rejectUnauthorized: false } })
// Many state portals still run TLS stacks that need "legacy renegotiation", which
// OpenSSL 3 refuses by default (ERR_SSL_UNSAFE_LEGACY_RENEGOTIATION_DISABLED).
// Only used after that exact error; certificates are still checked first.
const LEGACY = cryptoConstants.SSL_OP_LEGACY_SERVER_CONNECT
const legacy = new Agent({ connect: { timeout: 15_000, secureOptions: LEGACY } })
const legacyLenient = new Agent({ connect: { timeout: 15_000, secureOptions: LEGACY, rejectUnauthorized: false } })

const CERT_ERROR = /CERT|SELF_SIGNED|UNABLE_TO_VERIFY|LEAF_SIGNATURE/i
const LEGACY_ERROR = /UNSAFE_LEGACY_RENEGOTIATION/i

/** Next agent to try after a TLS error, or null when the error is not TLS-compatibility related. */
export function fallbackAgentFor(code: string, current: "strict" | "lenient" | "legacy" | "legacyLenient"): "lenient" | "legacy" | "legacyLenient" | null {
  if (LEGACY_ERROR.test(code)) return current === "strict" ? "legacy" : current === "lenient" ? "legacyLenient" : null
  if (CERT_ERROR.test(code)) return current === "strict" ? "lenient" : current === "legacy" ? "legacyLenient" : null
  return null
}
const AGENTS = { strict, lenient, legacy, legacyLenient }

const nextSlot = new Map<string, number>()
async function throttle(host: string) {
  const now = Date.now()
  const at = Math.max(now, nextSlot.get(host) ?? 0)
  nextSlot.set(host, at + HOST_GAP_MS)
  if (at > now) await new Promise((r) => setTimeout(r, at - now))
}

const robotsCache = new Map<string, Promise<string[]>>()

/** Disallow prefixes that apply to us (our own group, else "*"). */
export function parseRobots(txt: string, agent = "chayanjobsbot"): string[] {
  const groups: { agents: string[]; disallow: string[] }[] = []
  let cur: { agents: string[]; disallow: string[] } | null = null
  let lastWasAgent = false
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim()
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i)
    if (!m) continue
    const key = m[1].toLowerCase()
    const val = m[2].trim()
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) groups.push((cur = { agents: [], disallow: [] }))
      cur.agents.push(val.toLowerCase())
      lastWasAgent = true
    } else {
      lastWasAgent = false
      if (cur && key === "disallow" && val) cur.disallow.push(val)
    }
  }
  const mine = groups.find((g) => g.agents.some((a) => a !== "*" && agent.includes(a)))
  return (mine ?? groups.find((g) => g.agents.includes("*")))?.disallow ?? []
}

async function disallowedFor(origin: string): Promise<string[]> {
  if (!robotsCache.has(origin)) {
    robotsCache.set(
      origin,
      rawGet(`${origin}/robots.txt`, 200_000)
        .then((r) => (r.status === 200 ? parseRobots(r.body.toString("utf8")) : []))
        .catch(() => []),
    )
  }
  return robotsCache.get(origin)!
}

interface RawResponse {
  status: number
  url: string
  contentType: string
  body: Buffer
}

async function rawGet(url: string, maxBytes: number, agent: keyof typeof AGENTS = "strict"): Promise<RawResponse> {
  const dispatcher: Dispatcher = AGENTS[agent]
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await undiciFetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/pdf;q=0.9,*/*;q=0.5", "accept-language": "en-IN,en;q=0.9,hi;q=0.8" },
      redirect: "follow",
      signal: ctrl.signal,
      dispatcher,
    })
    const len = Number(res.headers.get("content-length") || 0)
    if (len > maxBytes) {
      await res.body?.cancel()
      throw new Error(`response too large (${len} bytes)`)
    }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > maxBytes) throw new Error(`response too large (${buf.length} bytes)`)
    return { status: res.status, url: res.url || url, contentType: res.headers.get("content-type") || "", body: buf }
  } catch (e) {
    const code = (e as { cause?: { code?: string } }).cause?.code ?? ""
    const next = fallbackAgentFor(code, agent)
    if (next) return rawGet(url, maxBytes, next)
    throw e
  } finally {
    clearTimeout(t)
  }
}

export class RobotsDisallowed extends Error {}

/** GET with robots + throttle + retries. Throws on robots disallow or after retries. */
export async function politeGet(url: string, opts: { maxBytes?: number; retries?: number } = {}): Promise<RawResponse> {
  const u = new URL(url)
  const disallow = await disallowedFor(u.origin)
  if (disallow.some((p) => p === "/" || u.pathname.startsWith(p))) throw new RobotsDisallowed(`robots.txt disallows ${u.pathname}`)
  const retries = opts.retries ?? 2
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    await throttle(u.host)
    try {
      const res = await rawGet(url, opts.maxBytes ?? 4_000_000)
      if (res.status >= 500 && attempt < retries) {
        lastErr = new Error(`HTTP ${res.status}`)
        continue
      }
      return res
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}
