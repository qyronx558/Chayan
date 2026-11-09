"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { buildBrowseUrl, normalizeExternalUrl } from "@/lib/apply-room"

interface SmartExternalLinkProps {
 href: string
 children: ReactNode
 className?: string
 title?: string
 /** Label used for the browser tab + analytics readability. */
 linkTitle?: string | null
 /** from-path for the browser Back button (defaults to current page at click time). */
 from?: string
 /** Open in a new browser tab instead of the current one. */
 newTab?: boolean
 onClick?: () => void
}

/**
 * Single choke point for ALL external links on ChayanJobs.
 * Routes http(s) URLs through the in-app browser (/browse) so users
 * never leave the platform chrome. Falls back to a plain anchor only
 * when the URL is invalid (never for valid external URLs).
 */
export function SmartExternalLink({ href, children, className, title, linkTitle, from, onClick }: SmartExternalLinkProps) {
 const pathname = usePathname()
 const normalized = normalizeExternalUrl(href)
 if (!normalized) {
  return (
   <a href={href} target="_blank" rel="noopener noreferrer" className={className} title={title}>
    {children}
   </a>
  )
 }
 const browseHref = buildBrowseUrl(normalized, { title: linkTitle ?? undefined, from: from ?? pathname })

 return (
  <Link href={browseHref} target="_blank" rel="noopener noreferrer" className={className} title={title || normalized} onClick={onClick}>
   {children}
  </Link>
 )
}
