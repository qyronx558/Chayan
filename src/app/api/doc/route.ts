import { NextRequest, NextResponse } from "next/server"
import { fetchOfficialPdf, resolveDocTarget } from "@/lib/doc-proxy"
import { sanitizeDownloadFilename } from "@/lib/apply-room"

/**
 * GET /api/doc?url=<official-pdf-url>[&download=1][&filename=slug]
 * Streams the official PDF from ChayanJobs origin so it opens AND
 * downloads end-to-end inside the in-app browser (same-origin iframe).
 * HTML pages are rejected - use /api/proxy for those.
 */
export async function GET(req: NextRequest) {
  let target: URL
  try {
    target = resolveDocTarget(req.nextUrl.searchParams.get("url"))
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid URL" }, { status: 400 })
  }

  const wantDownload = req.nextUrl.searchParams.get("download") === "1"
  const filename = sanitizeDownloadFilename(
    req.nextUrl.searchParams.get("filename") || target.pathname.split("/").pop()
  )

  try {
    const { buffer, finalUrl } = await fetchOfficialPdf(target)
    const headers: Record<string, string> = {
      "Content-Type": "application/pdf",
      "Content-Length": String(buffer.byteLength),
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "private, max-age=300",
      "Content-Security-Policy": "frame-ancestors 'self'",
      "X-Content-Type-Options": "nosniff",
      // NOTE: no Accept-Ranges - the full body is buffered server-side,
      // so advertising range support would confuse download resume.
    }
    if (wantDownload) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`
    } else {
      headers["Content-Disposition"] = `inline; filename="${filename}"`
      void finalUrl
    }
    return new NextResponse(buffer, { status: 200, headers })
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
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
