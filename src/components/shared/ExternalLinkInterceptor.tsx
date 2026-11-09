"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { buildBrowseUrl, normalizeExternalUrl } from "@/lib/apply-room"
import { isAdminPath, isApplicationModePath, isEmployerPath } from "@/components/layout/ConditionalChrome"

/** Hosts that hand off to native apps / share sheets and cannot be framed. */
const NATIVE_HOSTS = new Set([
  "wa.me", "api.whatsapp.com", "web.whatsapp.com", "t.me", "telegram.me",
  "twitter.com", "x.com", "www.facebook.com", "facebook.com", "m.facebook.com",
  "www.linkedin.com", "linkedin.com", "maps.google.com", "calendar.google.com",
  "tools.google.com", "adssettings.google.com", "accounts.google.com",
])

function shouldKeepNative(url: URL): boolean {
  if (NATIVE_HOSTS.has(url.hostname)) return true
  if (url.hostname.endsWith("google.com") && /^\/(maps|calendar)/.test(url.pathname)) return true
  return false
}

/**
 * Site-wide guarantee: any http(s) link to ANOTHER website opens inside the
 * ChayanJobs in-app browser (/browse) in a new tab, never as a raw jump out.
 * Covers links inside rich text, blog posts, comments and any plain <a>.
 * Opt out per link with data-cj-native="true". Inactive inside the viewer
 * itself (its "open original" buttons are deliberate escape hatches),
 * and on admin / employer consoles.
 */
export function ExternalLinkInterceptor() {
  const pathname = usePathname()

  useEffect(() => {
    if (isAdminPath(pathname) || isEmployerPath(pathname) || isApplicationModePath(pathname)) return

    const handler = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button > 1) return
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null
      if (!a || a.dataset.cjNative === "true" || a.hasAttribute("download")) return

      let url: URL
      try {
        url = new URL(a.href, window.location.href)
      } catch {
        return
      }
      if (url.protocol !== "http:" && url.protocol !== "https:") return
      if (url.origin === window.location.origin) return
      if (shouldKeepNative(url)) return
      const normalized = normalizeExternalUrl(url.toString())
      if (!normalized) return

      e.preventDefault()
      e.stopPropagation()
      const title = (a.getAttribute("title") || a.textContent || "").trim().slice(0, 100)
      const href = buildBrowseUrl(normalized, { title: title || undefined, from: window.location.pathname })
      window.open(href, "_blank", "noopener,noreferrer")
    }

    document.addEventListener("click", handler, true)
    document.addEventListener("auxclick", handler, true)
    return () => {
      document.removeEventListener("click", handler, true)
      document.removeEventListener("auxclick", handler, true)
    }
  }, [pathname])

  return null
}
