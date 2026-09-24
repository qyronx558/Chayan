"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-6200474851569598"

// Pages where ads must never load (admin + private user areas).
const EXCLUDED_PREFIXES = ["/admin", "/profile", "/applications"]
const EXCLUDED_EXACT = ["/login", "/register", "/forgot-password", "/reset-password"]

function isExcluded(pathname: string | null): boolean {
  if (!pathname) return false
  if (EXCLUDED_EXACT.includes(pathname)) return true
  return EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/**
 * Loads the AdSense base tag for Auto ads.
 *
 * - Ad formats/placements are controlled entirely in the AdSense dashboard (Auto ads).
 * - GDPR/EEA consent is handled by Google Funding Choices (configured in
 *   AdSense > Privacy & messaging), so this script is intentionally NOT gated
 *   behind the site's own cookie banner. Funding Choices needs the tag present
 *   to display the consent message and enforce consent.
 * - Returns null on excluded routes (admin, auth, profile, applications).
 */
export function AdSenseScript() {
  const pathname = usePathname()

  useEffect(() => {
    if (isExcluded(pathname)) return

    const selector = `script[data-adsense-client="${ADSENSE_CLIENT_ID}"]`
    if (document.head.querySelector(selector)) return

    const script = document.createElement("script")
    script.async = true
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`
    script.crossOrigin = "anonymous"
    script.dataset.adsenseClient = ADSENSE_CLIENT_ID
    document.head.appendChild(script)
  }, [pathname])

  return null
}
