"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  inferTypeFromPath,
  isTrackablePath,
  prettifyTitle,
  recordView,
  updateProgress,
} from "@/lib/recently-viewed"

/**
 * Global visit tracker — mounted once in the root layout.
 * Like YouTube / Netflix watch history:
 * - records every detail-page visit (job, result, admit card, blog…)
 * - tracks max scroll depth so the home section can show "resume" progress
 */
export function ActivityTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || !isTrackablePath(pathname)) return

    // Wait a tick so <title> from the new route is committed.
    const t = window.setTimeout(() => {
      recordView({
        href: pathname,
        title: prettifyTitle(pathname, document.title),
        type: inferTypeFromPath(pathname),
      })
    }, 600)
    return () => window.clearTimeout(t)
  }, [pathname])

  useEffect(() => {
    if (!pathname || !isTrackablePath(pathname)) return
    let max = 0
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = document.documentElement
        const total = el.scrollHeight - el.clientHeight
        if (total <= 0) return
        const pct = (el.scrollTop / total) * 100
        if (pct > max + 4) {
          max = pct
          updateProgress(pathname, max)
        }
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [pathname])

  return null
}
