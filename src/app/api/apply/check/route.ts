import { NextRequest, NextResponse } from "next/server"
import { normalizeExternalUrl, getExternalHostname, headersBlockFraming, headersIndicatePdf } from "@/lib/apply-room"

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

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    // Try HEAD first (cheap), fall back to ranged GET since some
    // gov servers reject HEAD.
    let res: Response | null = null
    try {
      res = await fetch(normalized, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      })
    } catch {
      res = null
    }

    if (!res || !res.ok) {
      try {
        res = await fetch(normalized, {
          method: "GET",
          redirect: "follow",
          headers: { Range: "bytes=0-0" },
          signal: controller.signal,
        })
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
