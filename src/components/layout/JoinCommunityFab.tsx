"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { communityLinks } from "@/lib/constants"
import { BrandIconLink } from "@/components/shared/CommunityLinks"
import { hasOwnBottomBar } from "./MobileBottomNav"

const STORAGE_KEY = "cj-join-fab-dismissed"

/**
 * Phone-only floating "Join" pill with every channel's logo, that sits just above the bottom
 * nav. Dismissible; the choice is remembered. Steps aside on pages that pin
 * their own bottom action bar (those pages show the community card in the rail).
 */
export function JoinCommunityFab() {
 const pathname = usePathname() || "/"
 /* Hidden until mounted so server HTML and first client render match. */
 const [visible, setVisible] = useState(false)

 useEffect(() => {
  try {
   setVisible(localStorage.getItem(STORAGE_KEY) !== "1")
  } catch {
   setVisible(true)
  }
 }, [])

 if (!visible || hasOwnBottomBar(pathname)) return null

 const dismiss = () => {
  setVisible(false)
  try {
   localStorage.setItem(STORAGE_KEY, "1")
  } catch {
   // storage unavailable
  }
 }

 return (
  <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-30 flex items-center gap-1.5 rounded-full border border-rule-2 bg-background/95 py-1.5 pl-3 pr-1 shadow-lg backdrop-blur md:hidden print:hidden">
   <span className="mr-0.5 text-[11px] font-semibold text-foreground">Join</span>
   {communityLinks.map(({ key }) => (
    <BrandIconLink key={key} k={key} size="sm" />
   ))}
   <button
    type="button"
    onClick={dismiss}
    aria-label="Dismiss"
    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
   >
    <X className="h-3.5 w-3.5" />
   </button>
  </div>
 )
}
