"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { siteConfig } from "@/lib/constants"
import { WhatsAppIcon } from "@/components/jobs/share-icons"
import { hasOwnBottomBar } from "./MobileBottomNav"

const STORAGE_KEY = "cj-join-fab-dismissed"

/**
 * Phone-only floating "Join WhatsApp" pill that sits just above the bottom
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
  <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-30 flex items-center md:hidden print:hidden">
   <a
    href={siteConfig.links.whatsapp}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Join ChayanJobs WhatsApp Community"
    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#25D366] pl-3 pr-9 text-[13px] font-semibold text-white shadow-lg"
   >
    <WhatsAppIcon className="h-4 w-4" /> Join WhatsApp
   </a>
   <button
    type="button"
    onClick={dismiss}
    aria-label="Dismiss"
    className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full text-white/85 hover:text-white"
   >
    <X className="h-3.5 w-3.5" />
   </button>
  </div>
 )
}
