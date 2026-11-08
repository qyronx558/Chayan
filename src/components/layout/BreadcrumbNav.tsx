"use client"

import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface BreadcrumbSegment {
 label: string
 href: string
}

interface BreadcrumbNavProps {
 segments?: BreadcrumbSegment[]
 className?: string
 homeLabel?: string
}

function generateSegmentsFromPath(pathname: string): BreadcrumbSegment[] {
 const parts = pathname.split("/").filter(Boolean)

 const excludeSegments = new Set(["public", "category"])

 return parts
  .filter((part) => !excludeSegments.has(part))
  .map((part, index) => {
   const href = "/" + parts.slice(0, index + 1).join("/")
   const label = part
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
   return { label, href }
  })
}

export function BreadcrumbNav({ segments, className, homeLabel = "Home" }: BreadcrumbNavProps) {
 const pathname = usePathname()
 const breadcrumbs = segments ?? generateSegmentsFromPath(pathname)

 if (breadcrumbs.length === 0) return null

 return (
  <nav aria-label="Breadcrumb" className={cn("", className)}>
   <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
    <li>
     <Link
      href="/"
      className="flex items-center gap-1 underline decoration-1 underline-offset-4 transition-colors hover:text-brick"
     >
      <Home className="h-3.5 w-3.5" />
      <span className="sr-only">{homeLabel}</span>
     </Link>
    </li>
    {breadcrumbs.map((segment, index) => {
     const isLast = index === breadcrumbs.length - 1
     return (
      <li key={segment.href} className="flex items-center gap-1.5">
       <ChevronRight className="h-3.5 w-3.5 text-rule" aria-hidden />
       {isLast ? (
        <span className="font-medium text-foreground" aria-current="page">
         {segment.label}
        </span>
       ) : (
        <Link
         href={segment.href}
         className="underline decoration-1 underline-offset-4 transition-colors hover:text-brick"
        >
         {segment.label}
        </Link>
       )}
      </li>
     )
    })}
   </ol>
  </nav>
 )
}
