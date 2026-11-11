import { NextRequest, NextResponse } from "next/server"
import {
  validateProxyTarget,
  fetchOfficialHtml,
  rewriteHtmlForPreview,
  frameErrorHtml,
  FRAME_ERROR_HEADERS,
  NotHtmlError,
} from "@/lib/proxy"
import { buildDocProxyUrl } from "@/lib/apply-room"

export const runtime = "nodejs"
export const maxDuration = 30
// Most official portals are hosted in India and many refuse or throttle
// foreign addresses, so fetch them from Mumbai. This route never touches the DB.
export const preferredRegion = "bom1"

/**
 * GET /api/proxy?url=<official-url>
 * Safe read-only preview: fetches the official page server side (GET only),
 * strips framing blockers, keeps same-site browsing inside the preview,
 * and sends cross-site links and all forms to the official site in a new tab.
 * Passwords, OTP, eKYC and payments always happen on the official site,
 * never through ChayanJobs.
 *
 * Failures answer with a small HTML page (never raw JSON, since this is shown
 * in a frame) that reports cj-frame-error to the shell.
 */
export async function GET(req: NextRequest) {
  let target: URL
  try {
    target = validateProxyTarget(req.nextUrl.searchParams.get("url"))
  } catch {
    return new NextResponse(frameErrorHtml("Invalid URL", null), { status: 400, headers: FRAME_ERROR_HEADERS })
  }

  try {
    const { html, finalUrl } = await fetchOfficialHtml(target)
    const rewritten = rewriteHtmlForPreview(html, finalUrl)

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
        // Public official pages fetched without any user credentials: let the
        // CDN answer repeat opens instantly and refresh in the background.
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
        // The page is third-party HTML served from our domain. The sandbox
        // (without allow-same-origin) gives it an opaque origin, so its scripts
        // can never read our cookies or call our APIs as the signed-in user,
        // whether it is framed or opened directly.
        "Content-Security-Policy":
          "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-top-navigation-by-user-activation; frame-ancestors 'self'",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (err) {
    // A "page" that is really a PDF (download.php?id=..): hand it to the viewer.
    if (err instanceof NotHtmlError && err.isPdf) {
      return NextResponse.redirect(new URL(buildDocProxyUrl(err.finalUrl), req.nextUrl.origin), 307)
    }
    const message = err instanceof Error ? err.message : "Preview failed"
    const status =
      message === "Blocked address" || message === "Invalid URL"
        ? 400
        : message === "Page too large to preview"
          ? 413
          : message === "Preview supports web pages only"
            ? 415
            : 502
    return new NextResponse(frameErrorHtml(message, target.toString()), { status, headers: FRAME_ERROR_HEADERS })
  }
}
