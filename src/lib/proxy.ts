import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { normalizeExternalUrl } from "@/lib/apply-room"
import { fetchWithRepairedChain, isIncompleteChainError } from "@/lib/tls-chain"

const MAX_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 12000

/**
 * Official portals (Akamai / Cloudflare / NIC firewalls) answer 403 to
 * anything that does not look like a normal browser, so every server-side
 * fetch of an official page sends ordinary browser headers.
 */
export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

export function browserHeaders(accept: string): Record<string, string> {
  return {
    "User-Agent": BROWSER_USER_AGENT,
    Accept: accept,
    "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
    "Upgrade-Insecure-Requests": "1",
  }
}

/** Thrown when /api/proxy is asked for a URL that is not a web page. */
export class NotHtmlError extends Error {
  constructor(public readonly isPdf: boolean, public readonly finalUrl: string) {
    super("Preview supports web pages only")
  }
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((n) => Number(n))
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [a, b] = parts
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT
  if (a === 169 && b === 254) return true // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 192 && b === 0) return true
  if (a === 198 && (b === 18 || b === 19)) return true
  if (a >= 224) return true // multicast + reserved
  return false
}

function isPrivateIpv6(ip: string): boolean {
  const v = ip.toLowerCase().split("%")[0]
  if (v === "::" || v === "::1") return true
  // IPv4-mapped / compatible / NAT64 forms carry an IPv4 address inside.
  const dotted = v.match(/(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (dotted) return isPrivateIpv4(dotted[1])
  const mapped = v.match(/^(?:::ffff:|64:ff9b::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (mapped) {
    const hi = parseInt(mapped[1], 16)
    const lo = parseInt(mapped[2], 16)
    return isPrivateIpv4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`)
  }
  if (v.startsWith("::ffff:") || v.startsWith("64:ff9b:")) return true
  if (/^f[cd]/.test(v)) return true // unique local
  if (/^fe[89ab]/.test(v)) return true // link-local
  if (v.startsWith("ff")) return true // multicast
  return false
}

function isPrivateIp(ip: string): boolean {
  const v = ip.trim().toLowerCase().replace(/^\[|\]$/g, "")
  const kind = isIP(v)
  if (kind === 4) return isPrivateIpv4(v)
  if (kind === 6) return isPrivateIpv6(v)
  return false
}

function isBlockedHostname(hostname: string): boolean {
  const h = hostname.trim().toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "")
  if (!h) return true
  if (h === "localhost" || h === "metadata.google.internal") return true
  if (h.endsWith(".internal") || h.endsWith(".local") || h.endsWith(".localhost")) return true
  if (isPrivateIp(h)) return true
  return false
}

/**
 * Resolve hostname and refuse private / metadata IPs (SSRF guard).
 * Fails closed: a host that cannot be resolved is not fetched.
 */
export async function assertPublicTarget(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Blocked address")
  if (isBlockedHostname(url.hostname)) {
    throw new Error("Blocked address")
  }
  const host = url.hostname.replace(/^\[|\]$/g, "")
  if (isIP(host)) return
  let records: { address: string }[]
  try {
    records = await lookup(host, { all: true })
  } catch {
    throw new Error("Could not resolve the official site")
  }
  if (records.length === 0) throw new Error("Could not resolve the official site")
  for (const r of records) {
    if (isPrivateIp(r.address)) throw new Error("Blocked address")
  }
}

const MAX_REDIRECTS = 5
const TRANSIENT_RETRIES = 2

/** Connection dropped or handshake garbled: worth one more try. */
function isTransientNetworkError(err: unknown): boolean {
  const e = err as { code?: unknown; cause?: { code?: unknown } } | null
  const code = String(e?.cause?.code ?? e?.code ?? "")
  return (
    code === "ECONNRESET" ||
    code === "EPROTO" ||
    code === "EPIPE" ||
    code === "UND_ERR_SOCKET" ||
    code.startsWith("ERR_SSL_")
  )
}

/**
 * fetch() that validates every hop. Redirects are followed by hand so a public
 * URL cannot bounce the server to an internal address.
 */
export async function safeFetch(
  url: URL | string,
  init: Omit<RequestInit, "redirect"> = {}
): Promise<{ res: Response; finalUrl: string }> {
  let current = new URL(url.toString())
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (current.username || current.password) throw new Error("Blocked address")
    await assertPublicTarget(current)
    const hopUrl = current
    let viaRepair = false
    const attempt = async (): Promise<Response> => {
      if (viaRepair) return fetchWithRepairedChain(hopUrl, init, assertPublicTarget)
      try {
        return await fetch(hopUrl.toString(), { ...init, redirect: "manual" })
      } catch (err) {
        // Site forgot to send its intermediate certificate: fetch the missing
        // piece like a browser does (the chain is still fully verified).
        if (hopUrl.protocol !== "https:" || !isIncompleteChainError(err)) throw err
        viaRepair = true
        return fetchWithRepairedChain(hopUrl, init, assertPublicTarget)
      }
    }
    // Some portals drop a share of connections mid-handshake; a browser just
    // reconnects, so do the same (reads only, nothing is sent twice).
    let res: Response | null = null
    for (let tries = 0; !res; tries++) {
      try {
        res = await attempt()
      } catch (err) {
        if (tries >= TRANSIENT_RETRIES || init.signal?.aborted || !isTransientNetworkError(err)) throw err
      }
    }
    if (res.status >= 300 && res.status < 400 && res.status !== 304) {
      const location = res.headers.get("location")
      if (!location) return { res, finalUrl: current.toString() }
      try {
        await res.body?.cancel()
      } catch {
        // ignore
      }
      let next: URL
      try {
        next = new URL(location, current)
      } catch {
        throw new Error("Official site sent an invalid redirect")
      }
      if (next.protocol !== "http:" && next.protocol !== "https:") throw new Error("Blocked address")
      current = next
      continue
    }
    return { res, finalUrl: current.toString() }
  }
  throw new Error("Official site redirected too many times")
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
  // The preview runs in an opaque origin, where touching storage or cookies
  // throws and takes the whole official page down with it. Give page scripts
  // harmless in-memory stand-ins instead.
  `function S(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},` +
  `setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},` +
  `key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}` +
  `['localStorage','sessionStorage'].forEach(function(n){try{window[n].length}catch(e){` +
  `try{Object.defineProperty(window,n,{value:S(),configurable:true})}catch(_){}}});` +
  `try{document.cookie}catch(e){try{var c='';Object.defineProperty(document,'cookie',{configurable:true,` +
  `get:function(){return c},set:function(v){c=String(v).split(';')[0]}})}catch(_){}}` +
  // Tell the shell as soon as there is something to read. Waiting for
  // DOMContentLoaded (let alone load) can take many seconds on pages that
  // pull in slow ad or tracking scripts.
  `var sent=0,n=0;function R(){if(sent)return;sent=1;try{window.parent.postMessage({type:'cj-frame-ready'},'*')}catch(_){}}` +
  `(function w(){if((document.body&&document.body.childElementCount>2)||n++>100)R();else setTimeout(w,50)})();` +
  `document.addEventListener('DOMContentLoaded',R);` +
  `function u(a){var r=a.getAttribute('href')||'';if(!r||r.charCodeAt(0)===35)return null;` +
  // Links already rewritten to our own routes carry the official URL in ?url=.
  // Unwrap it, otherwise <base> would resolve "/api/proxy" against the official host.
  `var m=/^[/](?:api[/](?:proxy|doc)|browse)[?]url=([^&]+)/.exec(r);if(m){try{r=decodeURIComponent(m[1]);}catch(e){return null;}}` +
  `if(/^(javascript|data|vbscript|mailto|tel|sms|ftp|file|blob):/i.test(r))return null;` +
  `try{var b=new URL(r,document.baseURI).href;if(!/^https?:/i.test(b))return null;return b;}catch(e){return null;}}` +
  `function h(e){var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;` +
  `var t=u(a);if(!t)return;` +
  `var n=e.ctrlKey||e.metaKey||e.shiftKey||e.button===1||((a.getAttribute('target')||'').toLowerCase()==='_blank');` +
  `e.preventDefault();try{e.stopPropagation();}catch(_){}` +
  `try{window.parent.postMessage({type:'cj-open-tab',url:t,newTab:!!n},'*');}catch(_){}}` +
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
  const baseTag = `<base href="${officialUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")}">`
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

/** Read a response body, refusing to buffer more than `max` bytes. */
async function readCapped(res: Response, max: number, tooLarge: string): Promise<Uint8Array> {
  const reader = res.body?.getReader()
  if (!reader) return new Uint8Array(await res.arrayBuffer())
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > max) {
      await reader.cancel().catch(() => {})
      throw new Error(tooLarge)
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.byteLength
  }
  return out
}

/** Decode with the charset the site declares (header first, then <meta>). */
function decodeHtml(bytes: Uint8Array, contentType: string): string {
  let label = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType)?.[1]
  if (!label) {
    const head = new TextDecoder("latin1").decode(bytes.subarray(0, 2048))
    label = /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(head)?.[1]
  }
  if (label) {
    try {
      return new TextDecoder(label, { fatal: false }).decode(bytes)
    } catch {
      // Unknown label: fall back to UTF-8.
    }
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes)
}

export async function fetchOfficialHtml(url: URL): Promise<{ html: string; finalUrl: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const { res, finalUrl } = await safeFetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: browserHeaders("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"),
    })

    if (!res.ok) {
      await res.body?.cancel().catch(() => {})
      throw new Error(`Official site responded ${res.status}`)
    }

    const contentType = res.headers.get("content-type") || ""
    // Some servers send no Content-Type at all for HTML; only refuse when the
    // header clearly names something else.
    if (contentType && !/text\/html|application\/xhtml|text\/plain/i.test(contentType)) {
      await res.body?.cancel().catch(() => {})
      const isPdf = /application\/pdf/i.test(contentType) || /\.pdf$/i.test(new URL(finalUrl).pathname)
      throw new NotHtmlError(isPdf, finalUrl)
    }

    const bytes = await readCapped(res, MAX_BYTES, "Page too large to preview")
    return { html: decodeHtml(bytes, contentType), finalUrl }
  } catch (err) {
    if (controller.signal.aborted) throw new Error("Official site took too long to respond")
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/** Headers for the small error page below (sandboxed, never cached). */
export const FRAME_ERROR_HEADERS: Record<string, string> = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-ancestors 'self'",
  "X-Content-Type-Options": "nosniff",
}

/**
 * Error page for /api/proxy and /api/doc. Inside the in-app browser it tells
 * the shell (cj-frame-error) so the shell can switch to another way of opening
 * the link; opened on its own it is still a readable page, never raw JSON.
 */
export function frameErrorHtml(message: string, officialUrl: string | null): string {
  const payload = JSON.stringify({ type: "cj-frame-error", message }).replace(/</g, "\\u003c")
  const link = officialUrl
    ? `<a href="${escapeHtml(officialUrl)}" target="_blank" rel="noopener noreferrer">Open the official site</a>`
    : ""
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"><title>Could not open this page</title>` +
    `<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;` +
    `font:15px/1.5 system-ui,sans-serif;color:#222;background:#fafafa}main{max-width:26rem;padding:2rem;text-align:center}` +
    `a{display:inline-block;margin-top:1rem;padding:.6rem 1.1rem;border-radius:.6rem;background:#111;color:#fff;text-decoration:none}` +
    `small{display:block;margin-top:.5rem;color:#777}</style></head><body><main>` +
    `<strong>This page could not be opened inside ChayanJobs.</strong>` +
    `<small>${escapeHtml(message)}</small>${link}</main>` +
    `<script>try{window.parent.postMessage(${payload},'*')}catch(e){}</script></body></html>`
  )
}

