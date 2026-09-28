"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

/**
 * Returns true for Application Mode routes, which render their own
 * minimal chrome (tool rail + thin top bar) and need maximum screen space:
 * - /apply/[slug]/start (government)
 * - /private-jobs/[slug]/apply (private)
 */
export function isApplicationModePath(pathname: string | null): boolean {
  if (!pathname) return false
  if (pathname.startsWith("/apply/") && pathname.endsWith("/start")) return true
  if (pathname.startsWith("/private-jobs/") && pathname.endsWith("/apply")) return true
  return false
}

/**
 * Hides the normal site Header/Footer on Application Mode routes so the
 * official website gets ~90–96% of useful screen area. Everything else
 * (onboarding, trackers, consent, analytics) keeps running.
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

  if (isApplicationModePath(pathname)) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden">
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  )
}
