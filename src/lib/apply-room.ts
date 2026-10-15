/**
 * Shared helpers for the in-site "Apply Room".
 * Used by both gov jobs (/apply/[slug]/start) and private jobs
 * (/private-jobs/[slug]/apply) so any external website can be
 * embedded inside ChayanJobs with a safe fallback.
 */

/** Only http/https URLs are allowed to be embedded. */
export function isSafeExternalUrl(raw: string | null | undefined): boolean {
  if (!raw) return false
  const value = raw.trim()
  if (!value) return false
  // Block dangerous schemes
  if (/^(javascript|data|vbscript|file|blob):/i.test(value)) return false
  try {
    // Allow protocol-relative URLs by assuming https
    const normalized = value.startsWith("//") ? `https:${value}` : value
    const url = new URL(normalized)
    if (url.protocol === "http:" || url.protocol === "https:") return true
  } catch {
    // Fall through to bare-domain check below.
  }
  // Bare domains like "upsc.gov.in/apply" -> assume https (no spaces allowed).
  if (/\s/.test(value)) return false
  try {
    const url = new URL(`https://${value}`)
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".")
  } catch {
    return false
  }
}

/** Normalize a raw link to an absolute http(s) URL, or null. */
export function normalizeExternalUrl(raw: string | null | undefined): string | null {
  if (!isSafeExternalUrl(raw)) return null
  const value = raw!.trim()
  try {
    if (value.startsWith("//")) return new URL(`https:${value}`).toString()
    const url = new URL(value)
    return url.toString()
  } catch {
    // Bare domains like "upsc.gov.in/apply" -> assume https
    try {
      return new URL(`https://${value}`).toString()
    } catch {
      return null
    }
  }
}

/** Extract readable hostname for the trust banner (e.g. "upsc.gov.in"). */
export function getExternalHostname(raw: string | null | undefined): string {
  const normalized = normalizeExternalUrl(raw)
  if (!normalized) return "official website"
  try {
    return new URL(normalized).hostname.replace(/^www\./, "")
  } catch {
    return "official website"
  }
}

/** Decide from response headers whether a site likely blocks iframe embedding. */
export function headersBlockFraming(headers: Headers): boolean {
  const xfo = headers.get("x-frame-options")?.toLowerCase() || ""
  if (xfo.includes("deny") || xfo.includes("sameorigin")) return true

  const csp =
    headers.get("content-security-policy")?.toLowerCase() ||
    headers.get("content-security-policy-report-only")?.toLowerCase() ||
    ""
  if (!csp) return false
  // Look for frame-ancestors directive
  const match = csp.match(/frame-ancestors([^;]*)/)
  if (!match) return false
  const value = match[1].trim()
  // 'none' always blocks; 'self' blocks third-party embedding on ChayanJobs
  if (value.includes("'none'")) return true
  if (value === "'self'" || value.startsWith("'self' ")) return true
  return false
}

/** True when response headers look like a PDF document. */
export function headersIndicatePdf(headers: Headers, url?: string): boolean {
  const ct = (headers.get("content-type") || "").toLowerCase()
  if (ct.includes("application/pdf")) return true
  if (ct.includes("octet-stream") && url && /\.pdf(\?|#|$)/i.test(url)) return true
  if (url && /\.pdf(\?|#|$)/i.test(url) && !ct.includes("text/html")) return true
  return false
}

/** True when a URL points at a PDF file (served via /api/doc, not /api/proxy). */
export function looksLikePdfUrl(raw: string | null | undefined): boolean {
  if (!raw) return false
  const value = raw.trim()
  if (!value) return false
  try {
    return /\.pdf$/i.test(new URL(value).pathname)
  } catch {
    return /\.pdf(\?|#|$)/i.test(value)
  }
}

/**
 * Heuristic: does raw user input look like a URL (vs a search query)?
 * Accepts absolute http(s), protocol-relative, and bare domains like
 * "ssc.gov.in" or "upsc.gov.in/apply". Everything else is a search.
 */
export function looksLikeUrl(raw: string | null | undefined): boolean {
  if (!raw) return false
  const value = raw.trim()
  if (!value || /\s/.test(value)) return false
  if (/^(javascript|data|vbscript|file|blob|mailto|tel|sms|ftp):/i.test(value)) return false
  if (/^(https?:)?\/\//i.test(value)) return isSafeExternalUrl(value)
  // bare domain with dot + optional path, e.g. ssc.gov.in/result
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/\S*)?$/i.test(value)) return true
  return false
}

/** Build the universal in-app browser URL: /browse?url=&title=&from= */
export function buildBrowseUrl(
  url: string,
  opts?: { title?: string | null; from?: string | null; download?: boolean }
): string {
  const params = new URLSearchParams()
  params.set("url", url)
  if (opts?.title) params.set("title", opts.title)
  if (opts?.from) params.set("from", opts.from)
  if (opts?.download) params.set("download", "1")
  return `/browse?${params.toString()}`
}

/** Build the proxied PDF viewer URL served from ChayanJobs origin. */
export function buildDocProxyUrl(url: string, download = false): string {
  return `/api/doc?url=${encodeURIComponent(url)}${download ? "&download=1" : ""}`
}

/** Build the proxied HTML preview URL served from ChayanJobs origin. */
export function buildHtmlProxyUrl(url: string): string {
  return `/api/proxy?url=${encodeURIComponent(url)}`
}

/** Sanitize a slug/title into a safe download filename (ascii, no traversal). */
export function sanitizeDownloadFilename(raw: string | null | undefined, fallback = "document.pdf"): string {
  const base = (raw || "").trim().replace(/\.pdf$/i, "").slice(0, 80)
  const safe = base
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
  return safe ? `${safe}.pdf` : fallback
}
