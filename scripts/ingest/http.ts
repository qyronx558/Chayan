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
import { Agent, fetch as undiciFetch, type Dispatcher } from "undici"

export const USER_AGENT = `ChayanJobsBot/1.0 (+${(process.env.INGEST_PUBLIC_URL || "https://chayanjobs.in").replace(/\/+$/, "")}/editorial-policy)`
const HOST_GAP_MS = Number(process.env.INGEST_HOST_GAP_MS || 2000)
const TIMEOUT_MS = 25_000

const strict = new Agent({ connect: { timeout: 15_000 } })
const lenient = new Agent({ connect: { timeout: 15_000, rejectUnauthorized: false } })

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

async function rawGet(url: string, maxBytes: number, dispatcher: Dispatcher = strict): Promise<RawResponse> {
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
    if (dispatcher === strict && /CERT|SELF_SIGNED|UNABLE_TO_VERIFY|LEAF_SIGNATURE/i.test(code)) {
      return rawGet(url, maxBytes, lenient)
    }
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
