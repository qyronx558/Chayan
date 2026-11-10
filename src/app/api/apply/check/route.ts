import { NextRequest, NextResponse } from "next/server"
import { normalizeExternalUrl, getExternalHostname, headersBlockFraming, headersIndicatePdf } from "@/lib/apply-room"
import { assertPublicTarget, safeFetch } from "@/lib/proxy"

/**
 * GET /api/apply/check?url=<external-url>
 * Returns whether the target site likely blocks iframe embedding
 * (X-Frame-Options / CSP frame-ancestors). Used by ApplyRoomClient
 * to pre-show the "open official site" fallback.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") || ""
  const normalized = normalizeExternalUrl(raw)

  if (!normalized) {
    return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400 })
  }

  const hostname = getExternalHostname(normalized)

  // SSRF guard: never probe internal or metadata addresses.
  try {
    const target = new URL(normalized)
    if (target.username || target.password) throw new Error("Blocked address")
    await assertPublicTarget(target)
  } catch (err) {
    if (err instanceof Error && err.message === "Blocked address") {
      return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400 })
    }
    return NextResponse.json({ ok: true, hostname, frameable: null as boolean | null, proxyable: true, reason: "unreachable" })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    // Try HEAD first (cheap), fall back to ranged GET since some
    // gov servers reject HEAD.
    let res: Response | null = null
    try {
      res = (await safeFetch(normalized, {
        method: "HEAD",
        signal: controller.signal,
      })).res
    } catch {
      res = null
    }

    if (!res || !res.ok) {
      try {
        res = (await safeFetch(normalized, {
          method: "GET",
          headers: { Range: "bytes=0-0" },
          signal: controller.signal,
        })).res
      } catch {
        res = null
      }
    }

    clearTimeout(timeout)

    if (!res) {
      return NextResponse.json({
        ok: true,
        hostname,
        frameable: null as boolean | null, // unknown - let client try iframe
        proxyable: true,
        reason: "unreachable",
      })
    }

    const blocked = headersBlockFraming(res.headers)
    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() || null
    const isPdf = headersIndicatePdf(res.headers, normalized)
    return NextResponse.json({
      ok: true,
      hostname,
      frameable: !blocked,
      proxyable: true,
      status: res.status,
      contentType,
      isPdf,
    })
  } catch {
    return NextResponse.json({
      ok: true,
      hostname,
      frameable: null as boolean | null,
      proxyable: true,
      reason: "check-failed",
    })
  }
}
