import { NextRequest, NextResponse } from "next/server"
import {
  validateProxyTarget,
  assertPublicTarget,
  fetchOfficialHtml,
  rewriteHtmlForPreview,
} from "@/lib/proxy"

/**
 * GET /api/proxy?url=<official-url>
 * Safe read-only preview: fetches the official page server side (GET only),
 * strips framing blockers, keeps same-site browsing inside the preview,
 * and sends cross-site links and all forms to the official site in a new tab.
 * Passwords, OTP, eKYC and payments always happen on the official site,
 * never through Chayan.
 */
export async function GET(req: NextRequest) {
  let target: URL
  try {
    target = validateProxyTarget(req.nextUrl.searchParams.get("url"))
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400 })
  }

  try {
    await assertPublicTarget(target)
    const { html, finalUrl } = await fetchOfficialHtml(target)
    const rewritten = rewriteHtmlForPreview(html, finalUrl)

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
        "Cache-Control": "private, max-age=120",
        "Content-Security-Policy": "frame-ancestors 'self'",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Preview failed"
    const status =
      message === "Blocked address" || message === "Invalid URL"
        ? 400
        : message === "Page too large to preview"
          ? 413
          : message === "Preview supports web pages only"
            ? 415
            : 502
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
