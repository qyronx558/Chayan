"use client"

/**
 * Single share helper for every UniversalCard.
 * Web Share API on mobile, clipboard fallback on desktop, toast-safe.
 */
export async function shareOrCopy(opts: {
  title: string
  text?: string
  url: string
}): Promise<"shared" | "copied" | "dismissed"> {
  const absolute = opts.url.startsWith("http")
    ? opts.url
    : typeof window !== "undefined"
      ? `${window.location.origin}${opts.url.startsWith("/") ? opts.url : `/${opts.url}`}`
      : opts.url

  try {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
        title: opts.title,
        text: opts.text ?? opts.title,
        url: absolute,
      })
      return "shared"
    }
  } catch {
    // user dismissed native sheet — not an error
    return "dismissed"
  }

  try {
    const nav = navigator as Navigator & { clipboard?: { writeText: (t: string) => Promise<void> } }
    if (nav.clipboard?.writeText) {
      await nav.clipboard.writeText(absolute)
      return "copied"
    }
    return "dismissed"
  } catch {
    return "dismissed"
  }
}
