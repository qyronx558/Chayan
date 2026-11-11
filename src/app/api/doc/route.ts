import { NextRequest, NextResponse } from "next/server"
import { openOfficialPdf, resolveDocTarget } from "@/lib/doc-proxy"
import { sanitizeDownloadFilename } from "@/lib/apply-room"
import { frameErrorHtml, FRAME_ERROR_HEADERS } from "@/lib/proxy"

export const runtime = "nodejs"
export const maxDuration = 60
// Official files are hosted in India; fetch them from Mumbai. No DB access here.
export const preferredRegion = "bom1"

/**
 * GET /api/doc?url=<official-pdf-url>[&download=1][&filename=slug]
 * Streams the official PDF from ChayanJobs origin so it opens AND
 * downloads end-to-end inside the in-app browser (same-origin frame).
 * HTML pages are rejected - use /api/proxy for those.
 *
 * Failures answer with a small HTML page that reports cj-frame-error to the
 * shell (callers that fetch() this route only look at the status code).
 */
export async function GET(req: NextRequest) {
  let target: URL
  try {
    target = resolveDocTarget(req.nextUrl.searchParams.get("url"))
  } catch {
    return new NextResponse(frameErrorHtml("Invalid URL", null), { status: 400, headers: FRAME_ERROR_HEADERS })
  }

  const wantDownload = req.nextUrl.searchParams.get("download") === "1"
  const filename = sanitizeDownloadFilename(
    req.nextUrl.searchParams.get("filename") || target.pathname.split("/").pop()
  )

  try {
    const { stream, length } = await openOfficialPdf(target)
    const headers: Record<string, string> = {
      "Content-Type": "application/pdf",
      "Referrer-Policy": "no-referrer",
      // Published notices and results do not change once issued.
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Security-Policy": "frame-ancestors 'self'",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `${wantDownload ? "attachment" : "inline"}; filename="${filename}"`,
      // NOTE: no Accept-Ranges - the body is a single pass-through stream.
    }
    if (length !== null) headers["Content-Length"] = String(length)
    return new NextResponse(stream, { status: 200, headers })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Document failed"
    const status =
      message === "Blocked address" || message === "Invalid URL"
        ? 400
        : message === "Document too large"
          ? 413
          : message === "Document is not a PDF" || message === "Empty document"
            ? 415
            : 502
    return new NextResponse(frameErrorHtml(message, target.toString()), { status, headers: FRAME_ERROR_HEADERS })
  }
}
