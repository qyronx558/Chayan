import { lookup } from "node:dns/promises"
import { normalizeExternalUrl } from "@/lib/apply-room"
import { validateProxyTarget, assertPublicTarget } from "@/lib/proxy"

export const DOC_MAX_BYTES = 25 * 1024 * 1024
const DOC_TIMEOUT_MS = 15000

const ALLOWED_PDF_TYPES = ["application/pdf", "application/octet-stream", "binary/octet-stream"]

/** Fetch an official PDF server-side with SSRF + size + type guards. */
export async function fetchOfficialPdf(url: URL): Promise<{ buffer: ArrayBuffer; contentType: string; finalUrl: string }> {
  await assertPublicTarget(url)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DOC_TIMEOUT_MS)
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ChayanJobsDocViewer/1.0; +https://chayanjobs.com)",
        Accept: "application/pdf,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
      },
    })
    if (!res.ok) throw new Error(`Official site responded ${res.status}`)

    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase()
    const isPdfType = ALLOWED_PDF_TYPES.some((t) => contentType.includes(t))
    const looksPdf = /\.pdf(\?|#|$)/i.test(res.url || url.toString())
    if (!isPdfType && !looksPdf) throw new Error("Document is not a PDF")

    const buf = await res.arrayBuffer()
    if (buf.byteLength === 0) throw new Error("Empty document")
    if (buf.byteLength > DOC_MAX_BYTES) throw new Error("Document too large")
    // Magic-byte check: %PDF
    const head = new TextDecoder("ascii").decode(buf.slice(0, 5))
    if (head !== "%PDF-" && !isPdfType) throw new Error("Document is not a PDF")

    return { buffer: buf, contentType: "application/pdf", finalUrl: res.url || url.toString() }
  } finally {
    clearTimeout(timeout)
  }
}

export function resolveDocTarget(raw: string | null | undefined): URL {
  const normalized = normalizeExternalUrl(raw)
  if (!normalized) throw new Error("Invalid URL")
  const url = validateProxyTarget(normalized)
  void lookup
  return url
}
