"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, ChevronDown, ChevronUp, Download, Info, PanelTop, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApplicationFocusDockProps {
 officialUrl: string
 hostname: string
 /** Label for the primary action when there is no PDF, e.g. "Apply Now". */
 applyLabel: string
 downloadUrl?: string | null
 downloadFilename?: string
 onDownload?: (e?: { preventDefault(): void }) => void
 onApply: () => void
 onInfo: () => void
 onReload: () => void
 onExitFocus: () => void
}

const KEY = "cj-focus-dock-compact"

/**
 * Bottom-right action dock for focus (full) mode. Keeps Apply / Download PDF
 * one tap away while the page uses the whole screen. "Compact view" collapses
 * it to a single round button.
 */
export function ApplicationFocusDock({
 officialUrl,
 hostname,
 applyLabel,
 downloadUrl,
 downloadFilename,
 onDownload,
 onApply,
 onInfo,
 onReload,
 onExitFocus,
}: ApplicationFocusDockProps) {
 const [compact, setCompact] = useState(false)

 useEffect(() => {
  try {
   // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved preference after hydration
   setCompact(window.localStorage.getItem(KEY) === "1")
  } catch {
   // ignore
  }
 }, [])

 const toggle = () =>
  setCompact((c) => {
   try {
    window.localStorage.setItem(KEY, c ? "0" : "1")
   } catch {
    // ignore
   }
   return !c
  })

 const primary = downloadUrl ? (
  <a
   href={downloadUrl}
   download={downloadFilename || "document.pdf"}
   onClick={onDownload}
   aria-label="Download PDF"
   className={cn(
    "flex items-center justify-center gap-2 bg-foreground font-semibold text-background transition-colors hover:bg-brick hover:text-brick-ink",
    compact ? "h-12 w-12 rounded-full shadow-xl" : "h-11 rounded-xl px-5 text-sm"
   )}
  >
   <Download className="h-5 w-5" />
   {!compact && "Download PDF"}
  </a>
 ) : (
  <a
   href={officialUrl}
   target="_blank"
   rel="noopener noreferrer"
   onClick={onApply}
   aria-label={`${applyLabel} on ${hostname}`}
   className={cn(
    "flex items-center justify-center gap-2 bg-foreground font-semibold text-background transition-colors hover:bg-brick hover:text-brick-ink",
    compact ? "h-12 w-12 rounded-full shadow-xl" : "h-11 rounded-xl px-5 text-sm"
   )}
  >
   <ArrowUpRight className="h-5 w-5" />
   {!compact && applyLabel}
  </a>
 )

 const mini =
  "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"

 return (
  <div className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 sm:right-6">
   <div className="pointer-events-auto flex flex-col items-end gap-2">
    {compact ? (
     <div className="flex items-center gap-2">
      {primary}
      <button type="button" onClick={toggle} aria-label="Expand actions" title="Expand actions" className="flex h-9 w-9 items-center justify-center rounded-full border border-rule bg-card shadow-lg hover:bg-muted">
       <ChevronUp className="h-4 w-4" />
      </button>
     </div>
    ) : (
     <div className="flex items-center gap-1.5 rounded-2xl border border-rule bg-card/95 p-1.5 shadow-2xl backdrop-blur">
      {primary}
      <button type="button" onClick={onInfo} title="Details" aria-label="Details" className={mini}><Info className="h-4 w-4" /></button>
      <button type="button" onClick={onReload} title="Reload" aria-label="Reload" className={mini}><RefreshCw className="h-4 w-4" /></button>
      <button type="button" onClick={onExitFocus} title="Show toolbars (F)" aria-label="Show toolbars" className={mini}><PanelTop className="h-4 w-4" /></button>
      <button type="button" onClick={toggle} title="Compact view" aria-label="Compact view" className={mini}><ChevronDown className="h-4 w-4" /></button>
     </div>
    )}
    {!compact && (
     <p className="rounded-full bg-card/90 px-2.5 py-0.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
      Official source · {hostname}
     </p>
    )}
   </div>
  </div>
 )
}
