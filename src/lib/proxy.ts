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

/** True for links that point at a PDF file (served via /api/doc, not /api/proxy). */
function isPdfLink(url: URL): boolean {
  return /\.pdf$/i.test(url.pathname)
}

/**
 * Click interceptor injected into every proxied page. Because /api/proxy is
 * same-origin, this script CAN see link clicks (impossible in a direct
 * cross-origin iframe) and hands them to the ChayanJobs shell, which opens
 * them as tabs INSIDE the browser - never a raw outside page.
 * No-JS fallback still works: same-site links are pre-rewritten to /api/proxy
 * (in-frame) and cross-site links to /browse with target=_top (full-page shell).
 */
const CJ_FRAME_SCRIPT =
  `<script data-cj-frame="1">(function(){` +
  `function u(a){var r=a.getAttribute('href')||'';if(!r||r.charCodeAt(0)===35)return null;` +
  `if(/^(javascript|data|vbscript|mailto|tel|sms|ftp|file|blob):/i.test(r))return null;` +
  `try{var b=new URL(r,document.baseURI).href;if(!/^https?:/i.test(b))return null;return b;}catch(e){return null;}}` +
  `function h(e){var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;` +
  `var t=u(a);if(!t)return;` +
  `var n=e.ctrlKey||e.metaKey||e.shiftKey||e.button===1||((a.getAttribute('target')||'').toLowerCase()==='_blank');` +
  `e.preventDefault();try{e.stopPropagation();}catch(_){}` +
  `try{window.parent.postMessage({type:'cj-open-tab',url:t,newTab:!!n},window.location.origin);}catch(_){}}` +
  `document.addEventListener('click',h,true);document.addEventListener('auxclick',h,true);` +
  `})();</script>`

/** Remove meta CSP headers and rewrite links so every click stays inside ChayanJobs. */
export function rewriteHtmlForPreview(html: string, officialUrl: string): string {
  let out = html
  const official = new URL(officialUrl)

  // Drop meta CSP / X-Frame equivalents that would block rendering in our frame.
  out = out.replace(/<meta[^>]+http-equiv\s*=\s*["']?\s*content-security-policy\s*["']?[^>]*>/gi, "")
  out = out.replace(/<meta[^>]+http-equiv\s*=\s*["']?\s*X-Frame-Options\s*["']?[^>]*>/gi, "")

  // Neutralize frame-busting inline scripts that force top navigation.
  out = out.replace(/top\s*\.\s*location/gi, "__ChayanJobs_blocked_top_location")
  out = out.replace(/parent\s*\.\s*location/gi, "__ChayanJobs_blocked_parent_location")

  // Base without target: relative resources resolve to the official site.
  // The injected frame script upgrades every click into a ChayanJobs tab.
  const baseTag = `<base href="${officialUrl}">`
  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => `${m}${baseTag}${CJ_FRAME_SCRIPT}`)
  } else if (/<html[^>]*>/i.test(out)) {
    out = out.replace(/<html[^>]*>/i, (m) => `${m}<head>${baseTag}${CJ_FRAME_SCRIPT}</head>`)
  } else {
    out = `<head>${baseTag}${CJ_FRAME_SCRIPT}</head>${out}`
  }

  // Same-site pages route through the preview (in-frame, tab-upgraded by the
  // frame script). Same-site PDFs route through the in-app PDF viewer.
  // Cross-site links route to the full /browse shell with target=_top so the
  // user still lands inside ChayanJobs (auto-opened as a new tab there).
  // Nothing opens as a raw outside page from here; forms keep _blank below.
  out = out.replace(/<a\b[^>]*>/gi, (tag) => {
    const hrefMatch = tag.match(/href\s*=\s*(["'])(.*?)\1/i)
    if (!hrefMatch) return tag
    if (/\/api\/(proxy|doc)\?url=/i.test(hrefMatch[2])) return tag
    const resolved = resolveWebUrl(hrefMatch[2], officialUrl)
    if (!resolved) return tag
    if (resolved.hostname.toLowerCase() === official.hostname.toLowerCase()) {
      const proxied = isPdfLink(resolved)
        ? `/api/doc?url=${encodeURIComponent(resolved.toString())}`
        : `/api/proxy?url=${encodeURIComponent(resolved.toString())}`
      let next = tag.replace(hrefMatch[0], `href="${proxied}"`)
      // Stay inside the preview frame (the frame script upgrades to tabs).
      next = next.replace(/\s+target\s*=\s*(["'])[^"']*\1/i, "")
      return next
    }
    const browseHref = `/browse?url=${encodeURIComponent(resolved.toString())}`
    let next = tag.replace(hrefMatch[0], `href="${browseHref}"`)
    // Break out of the frame into the full ChayanJobs browser shell.
    if (/\s+target\s*=/i.test(next)) {
      next = next.replace(/target\s*=\s*(["'])[^"']*\1/i, `target="_top"`)
    } else {
      next = next.replace(/<a\b/i, `<a target="_top"`)
    }
    if (!/\s+rel\s*=/i.test(next)) {
      next = next.replace(/<a\b/i, `<a rel="noopener"`)
    }
    return next
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
