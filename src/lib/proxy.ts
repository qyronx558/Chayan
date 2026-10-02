import { lookup } from "node:dns/promises"
import { normalizeExternalUrl } from "@/lib/apply-room"

const MAX_BYTES = 2 * 1024 * 1024
const FETCH_TIMEOUT_MS = 10000

function isPrivateIp(ip: string): boolean {
  const v = ip.trim().toLowerCase()
  if (v === "localhost" || v === "::1" || v === "::ffff:127.0.0.1") return true
  if (v.startsWith("127.") || v.startsWith("0.")) return true
  if (v === "169.254.169.254" || v.startsWith("169.254.")) return true
  if (v.startsWith("10.") || v.startsWith("192.168.")) return true
  const m172 = v.match(/^172\.(\d+)\./)
  if (m172) {
    const n = Number(m172[1])
    if (n >= 16 && n <= 31) return true
  }
  if (v.startsWith("fc") || v.startsWith("fd") || v === "::") return true
  if (v.endsWith(".internal") || v.endsWith(".local") || v.endsWith(".localhost")) return true
  return false
}

function isBlockedHostname(hostname: string): boolean {
  const h = hostname.trim().toLowerCase().replace(/\.$/, "")
  if (!h) return true
  if (h === "localhost" || h === "metadata.google.internal") return true
  if (h.endsWith(".internal") || h.endsWith(".local") || h.endsWith(".localhost")) return true
  if (isPrivateIp(h)) return true
  return false
}

/** Resolve hostname and refuse private / metadata IPs (SSRF guard). */
export async function assertPublicTarget(url: URL): Promise<void> {
  if (isBlockedHostname(url.hostname)) {
    throw new Error("Blocked address")
  }
  try {
    const records = await lookup(url.hostname, { all: true })
    for (const r of records) {
      if (isPrivateIp(r.address)) throw new Error("Blocked address")
    }
  } catch (err) {
    if ((err as Error)?.message === "Blocked address") throw err
    // If DNS fails, let the fetch fail naturally rather than blocking preview.
  }
}

export function validateProxyTarget(raw: string | null | undefined): URL {
  const normalized = normalizeExternalUrl(raw)
  if (!normalized) throw new Error("Invalid URL")
  const url = new URL(normalized)
  if (url.username || url.password) throw new Error("Invalid URL")
  return url
}

/** Resolve a link against the official page URL. Returns null for non web links. */
function resolveWebUrl(href: string, officialUrl: string): URL | null {
  const value = href.trim()
  if (!value || value.startsWith("#")) return null
  if (/^(javascript|data|vbscript|mailto|tel|sms|ftp|file|blob):/i.test(value)) return null
  try {
    const url = new URL(value, officialUrl)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url
  } catch {
    return null
  }
}

/** Remove meta CSP headers and rewrite links so same-site browsing stays inside ChayanJobs preview. */
export function rewriteHtmlForPreview(html: string, officialUrl: string): string {
  let out = html
  const official = new URL(officialUrl)

  // Drop meta CSP / X-Frame equivalents that would block rendering in our frame.
  out = out.replace(/<meta[^>]+http-equiv\s*=\s*["']?\s*content-security-policy\s*["']?[^>]*>/gi, "")
  out = out.replace(/<meta[^>]+http-equiv\s*=\s*["']?\s*X-Frame-Options\s*["']?[^>]*>/gi, "")

  // Neutralize frame-busting inline scripts that force top navigation.
  out = out.replace(/top\s*\.\s*location/gi, "__ChayanJobs_blocked_top_location")
  out = out.replace(/parent\s*\.\s*location/gi, "__ChayanJobs_blocked_parent_location")

  // Base without target: relative resources resolve to the official site,
  // link clicks stay inside the preview frame unless marked _blank below.
  const baseTag = `<base href="${officialUrl}">`
  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => `${m}${baseTag}`)
  } else if (/<html[^>]*>/i.test(out)) {
    out = out.replace(/<html[^>]*>/i, (m) => `${m}<head>${baseTag}</head>`)
  } else {
    out = `<head>${baseTag}</head>${out}`
  }

  // Same-site links route through the preview so browsing stays on ChayanJobs.
  // Cross-site links open in a new tab on the real address.
  out = out.replace(/<a\b[^>]*>/gi, (tag) => {
    const hrefMatch = tag.match(/href\s*=\s*(["'])(.*?)\1/i)
    if (!hrefMatch) return tag
    if (/\/api\/proxy\?url=/i.test(hrefMatch[2])) return tag
    const resolved = resolveWebUrl(hrefMatch[2], officialUrl)
    if (!resolved) return tag
    if (resolved.hostname.toLowerCase() === official.hostname.toLowerCase()) {
      const proxied = `/api/proxy?url=${encodeURIComponent(resolved.toString())}`
      let next = tag.replace(hrefMatch[0], `href="${proxied}"`)
      // Stay inside the preview frame.
      next = next.replace(/\s+target\s*=\s*(["'])[^"']*\1/i, "")
      return next
    }
    if (!/\s+target\s*=/i.test(tag)) {
      return tag.replace(/<a\b/i, `<a target="_blank" rel="noopener noreferrer"`)
    }
    return tag
  })

  // Forms submit to the official site in a new tab, never through ChayanJobs,
  // so passwords, OTP, eKYC and payments stay on the original domain.
  out = out.replace(/<form(\s[^>]*)?>/gi, (m) => {
    if (/target\s*=/i.test(m)) return m.replace(/target\s*=\s*(["'])[^"']*\1/i, `target="_blank"`)
    return m.replace(/<form/i, `<form target="_blank"`)
  })

  return out
}

export async function fetchOfficialHtml(url: URL): Promise<{ html: string; finalUrl: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ChayanJobsPreview/1.0; +https://ChayanJobs.in)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
        Range: "bytes=0-2097151",
      },
    })

    if (!res.ok) throw new Error(`Official site responded ${res.status}`)

    const contentType = res.headers.get("content-type") || ""
    if (!/text\/html|application\/xhtml/i.test(contentType)) {
      throw new Error("Preview supports web pages only")
    }

    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_BYTES) throw new Error("Page too large to preview")
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf)
    return { html, finalUrl: res.url || url.toString() }
  } finally {
    clearTimeout(timeout)
  }
}
