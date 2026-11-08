"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, Download, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApplicationFloatingCTAProps {
 officialUrl: string
 hostname: string
 /** e.g. "Official Website" | "Official Application" */
 sublabel: string
 onApply: () => void
 /** Desktop floating card vs mobile bottom bar. */
 variant: "desktop" | "mobile"
 /** Main CTA text. Defaults to "Apply Now". */
 title?: string
 /** When set (PDF mode), CTA downloads from ChayanJobs origin end-to-end. */
 downloadUrl?: string | null
 downloadFilename?: string
 onDownload?: () => void
}

/**
 * Always-visible CTA. Web mode: explicit "Continue" exit (last resort).
 * PDF mode: primary Download from ChayanJobs origin (no exit needed).
 */
export function ApplicationFloatingCTA({
 officialUrl,
 hostname,
 sublabel,
 onApply,
 variant,
 title = "Apply Now",
 downloadUrl,
 downloadFilename,
 onDownload,
}: ApplicationFloatingCTAProps) {
 const [intro, setIntro] = useState(true)

 useEffect(() => {
  const t = window.setTimeout(() => setIntro(false), 550)
  return () => window.clearTimeout(t)
 }, [])

 const isDownload = Boolean(downloadUrl)

 if (variant === "mobile") {
  return (
   <div className="border-t border-rule bg-background px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
    {isDownload ? (
     <a
      href={downloadUrl as string}
      download={downloadFilename || "document.pdf"}
      onClick={onDownload}
      aria-label={`Download ${title} from ChayanJobs`}
      className={cn(
       "flex h-12 w-full items-center justify-center gap-2 bg-ink text-base font-medium text-paper",
       "transition-colors hover:bg-ink-2",
       "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick focus-visible:ring-offset-2",
       intro && "opacity-90"
      )}
     >
      {title}
      <Download className="h-5 w-5" aria-hidden="true" />
     </a>
    ) : (
     <a
      href={officialUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onApply}
      aria-label={`${title} on ${hostname}`}
      className={cn(
       "flex h-12 w-full items-center justify-center gap-2 bg-ink text-base font-medium text-paper",
       "transition-colors hover:bg-ink-2",
       "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick focus-visible:ring-offset-2",
       intro && "opacity-90"
      )}
     >
      {title}
      <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
     </a>
    )}
    <p className="agate mt-1 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
     <ShieldCheck className="h-3 w-3" aria-hidden="true" />
     {sublabel}, {hostname}
    </p>
   </div>
  )
 }

 if (isDownload) {
  return (
   <a
    href={downloadUrl as string}
    download={downloadFilename || "document.pdf"}
    onClick={onDownload}
    aria-label={`Download ${title} from ChayanJobs`}
    className={cn(
     "fixed bottom-5 right-5 z-40 hidden w-[200px] flex-col justify-center gap-0.5 bg-ink px-4 py-3 text-paper md:flex",
     "transition-colors hover:bg-ink-2",
     "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick focus-visible:ring-offset-2",
     intro ? "opacity-90" : "opacity-100"
    )}
   >
    <span className="flex items-center justify-between text-[15px] font-medium leading-tight">
     {title}
     <Download className="h-5 w-5" aria-hidden="true" />
    </span>
    <span className="text-[11px] font-normal leading-tight text-paper/70">{sublabel}</span>
   </a>
  )
 }

 return (
  <a
   href={officialUrl}
   target="_blank"
   rel="noopener noreferrer"
   onClick={onApply}
   aria-label={`${title} on ${hostname}`}
   className={cn(
    "fixed bottom-5 right-5 z-40 hidden w-[200px] flex-col justify-center gap-0.5 bg-ink px-4 py-3 text-paper md:flex",
    "transition-colors hover:bg-ink-2",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick focus-visible:ring-offset-2",
    intro ? "opacity-90" : "opacity-100"
   )}
  >
   <span className="flex items-center justify-between text-[15px] font-medium leading-tight">
    {title}
    <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
   </span>
   <span className="text-[11px] font-normal leading-tight text-paper/70">{sublabel}</span>
  </a>
 )
}
