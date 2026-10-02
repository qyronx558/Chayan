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
    return url.protocol === "http:" || url.protocol === "https:"
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
