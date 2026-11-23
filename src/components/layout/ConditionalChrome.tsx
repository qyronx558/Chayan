"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { MobileBottomNav } from "./MobileBottomNav"
import { JoinCommunityFab } from "./JoinCommunityFab"

/**
 * Returns true for fullscreen viewer routes, which render their own
 * minimal chrome (tool rail + thin top bar) and need maximum screen space:
 * - /apply/[slug]/start (government applications)
 * - /private-jobs/[slug]/apply (private applications)
 * - /result/[slug]/view, /admit-card/[slug]/view, /answer-key/[slug]/view,
 *   /syllabus/[slug]/view, /admission/[slug]/view (official documents)
 */
export function isApplicationModePath(pathname: string | null): boolean {
  if (!pathname) return false
  if (pathname === "/browse") return true
  if (pathname.startsWith("/apply/") && pathname.endsWith("/start")) return true
  if (pathname.startsWith("/private-jobs/") && pathname.endsWith("/apply")) return true
  if (!pathname.endsWith("/view")) return false
  return (
    pathname.startsWith("/result/") ||
    pathname.startsWith("/admit-card/") ||
    pathname.startsWith("/answer-key/") ||
    pathname.startsWith("/syllabus/") ||
    pathname.startsWith("/admission/")
  )
}

export function isAdminPath(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === "/admin" || pathname.startsWith("/admin/")
}

export function isEmployerPath(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === "/employer" || pathname.startsWith("/employer/")
}

export function isStandaloneContactPath(pathname: string | null): boolean {
  return pathname === "/contact"
}

/**
 * Hides the normal site Header/Footer on Application Mode routes so the
 * official website gets ~90–96% of useful screen area, and on Admin routes
 * so /admin renders as a standalone SaaS panel (own sidebar + topbar only).
 * Everything else (onboarding, trackers, consent, analytics) keeps running
 * unless separately hidden.
 */
export function ConditionalChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode
  footer: ReactNode
  children: ReactNode
}) {
  const pathname = usePathname()

  if (isAdminPath(pathname) || isEmployerPath(pathname)) {
    // Standalone SaaS shells (admin + employer studio): no main-site
    // header/footer - each renders its own sidebar + topbar only.
    return (
      <div className="min-h-[100dvh] bg-paper-3">
        <main className="min-h-[100dvh]">{children}</main>
      </div>
    )
  }

  if (isApplicationModePath(pathname)) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden">
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    )
  }

  if (isStandaloneContactPath(pathname)) {
    return (
      <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-clip">
        <main className="w-full min-w-0 flex-1 overflow-x-clip">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-clip">
      {header}
      <main className="w-full min-w-0 flex-1 overflow-x-clip">{children}</main>
      {footer}
      <MobileBottomNav />
      <JoinCommunityFab />
    </div>
  )
}
