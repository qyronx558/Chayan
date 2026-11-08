"use client"

import * as React from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function BackToTop({ className }: { className?: string }) {
 const [visible, setVisible] = React.useState(false)

 React.useEffect(() => {
  const onScroll = () => setVisible(window.scrollY > 600)
  onScroll()
  window.addEventListener("scroll", onScroll, { passive: true })
  return () => window.removeEventListener("scroll", onScroll)
 }, [])

 function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" })
 }

 return (
  <button
   type="button"
   onClick={scrollToTop}
   aria-label="Back to top"
   className={cn(
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-background/5 text-muted-foreground transition-all duration-300 hover:border-rule hover:bg-paper-3 hover:text-paper",
    visible
     ? "translate-y-0 opacity-100"
     : "pointer-events-none translate-y-2 opacity-0",
    className
   )}
  >
   <ArrowUp className="h-4 w-4" />
  </button>
 )
}
