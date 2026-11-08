"use client"

import { usePathname } from "next/navigation"
import { isAdminPath } from "./ConditionalChrome"
import type { ReactNode } from "react"

/** Hides main-site overlays (onboarding, cookie banner, etc.) inside /admin. */
export function HideOnAdmin({ children }: { children: ReactNode }) {
 const pathname = usePathname()
 if (isAdminPath(pathname)) return null
 return <>{children}</>
}
