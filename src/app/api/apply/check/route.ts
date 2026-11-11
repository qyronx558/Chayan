import { NextRequest, NextResponse } from "next/server"
import {
  normalizeExternalUrl,
  getExternalHostname,
  headersBlockFraming,
  headersIndicatePdf,
  cookiesWorkInFrame,
} from "@/lib/apply-room"
import { assertPublicTarget, safeFetch, browserHeaders } from "@/lib/proxy"

export const runtime = "nodejs"
export const maxDuration = 15
// Probe from Mumbai: official portals often answer foreign addresses differently.
export const preferredRegion = "bom1"

const PROBE_TIMEOUT_MS = 5000

interface Probe {
  res: Response
  finalUrl: string
}

/**
 * One browser-like GET (headers only, the body is dropped). HEAD is not used:
 * many official servers reject it or omit the framing headers on it.
 */
async function probe(url: string): Promise<Probe | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
  try {
    const { res, finalUrl } = await safeFetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: browserHeaders("text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8"),
    })
    void res.body?.cancel().catch(() => {})
    return { res, finalUrl }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function json(body: Record<string, unknown>, cacheable: boolean) {
  return NextResponse.json(body, {
    headers: {
      // The answer depends only on the URL, so the CDN can serve repeat opens.
      "Cache-Control": cacheable
        ? "public, max-age=300, s-maxage=900, stale-while-revalidate=86400"
        : "public, max-age=30, s-maxage=60",
    },
  })
}

/**
 * GET /api/apply/check?url=<external-url>
 * Tells the in-app browser how a link can be opened:
 *  - frameable: false when the site refuses to be framed (X-Frame-Options /
 *    CSP frame-ancestors); null when the site could not be reached.
 *    reason "not-found" means the address does not exist.
 *  - isPdf: the link is a PDF even if its address does not end in .pdf.
 *  - directUrl: the address to frame. An http:// link is upgraded to https://
 *    when the site supports it; null when it is http-only (browsers will not
 *    show an insecure frame on a secure page).
 *  - sessionInFrame: false when the site's cookies will not work in a frame,
 *    so signing in there needs the site's own tab.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") || ""
  const normalized = normalizeExternalUrl(raw)

  if (!normalized) {
    return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400 })
  }

  const hostname = getExternalHostname(normalized)
  const target = new URL(normalized)
  const unknown = (reason: string) =>
    json({ ok: true, hostname, frameable: null, proxyable: true, directUrl: target.protocol === "https:" ? normalized : null, sessionInFrame: null, reason }, false)

  // SSRF guard: never probe internal or metadata addresses.
  try {
    if (target.username || target.password) throw new Error("Blocked address")
    await assertPublicTarget(target)
  } catch (err) {
    if (err instanceof Error && err.message === "Blocked address") {
      return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400 })
    }
    // The name does not exist at all (typo, expired domain): say so, so the
    // browser shell can stop waiting instead of spinning on an empty frame.
    return unknown("not-found")
  }

  let secureUrl: string | null = null
  if (target.protocol === "http:") {
    const upgraded = new URL(normalized)
    upgraded.protocol = "https:"
    if (upgraded.port === "80") upgraded.port = ""
    secureUrl = upgraded.toString()
  }

  // For http:// links, try the https:// address at the same time.
  const [plain, secure] = await Promise.all([probe(normalized), secureUrl ? probe(secureUrl) : null])
  const secureWorks = !!secure && secure.res.ok && secure.finalUrl.startsWith("https:")
  const chosen = secureWorks ? secure : plain
  if (!chosen) return unknown("unreachable")

  const { res, finalUrl } = chosen
  const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() || null
  const directUrl =
    target.protocol === "https:" ? normalized : secureWorks ? secureUrl : finalUrl.startsWith("https:") ? finalUrl : null

  return json(
    {
      ok: true,
      hostname,
      frameable: !headersBlockFraming(res.headers),
      proxyable: true,
      status: res.status,
      contentType,
      isPdf: res.ok ? headersIndicatePdf(res.headers, finalUrl) : /\.pdf$/i.test(target.pathname),
      directUrl,
      sessionInFrame: cookiesWorkInFrame(res.headers.getSetCookie()),
    },
    res.ok
  )
}
