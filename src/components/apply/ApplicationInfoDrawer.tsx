"use client"

import { ArrowUpRight, Flag, Lock, ShieldCheck } from "lucide-react"
import {
 Sheet,
 SheetContent,
 SheetDescription,
 SheetHeader,
 SheetTitle,
} from "@/components/ui/sheet"
import type { ApplicationInfoRow, ApplicationType } from "@/components/apply/application-types"

interface ApplicationInfoDrawerProps {
 open: boolean
 onOpenChange: (open: boolean) => void
 type: ApplicationType
 title: string
 organization: string
 hostname: string
 officialUrl: string
 sourceLabel: string
 deadlineLabel?: string | null
 updatedLabel?: string | null
 infoRows: ApplicationInfoRow[]
 onReport: () => void
 /** Overrides the default apply-flow explainer (used by document viewers). */
 aboutCopy?: string
 /** Overrides the footer CTA label (used by document viewers). */
 ctaLabel?: string
 /** When set (PDF mode), footer CTA downloads from ChayanJobs origin. */
 downloadUrl?: string | null
 downloadFilename?: string
 onDownload?: () => void
 onApply?: () => void
}

/**
 * Overlay drawer - floats above the iframe, never resizes it.
 * Desktop 320–400px, mobile 85–95vw. ESC closes (Radix default).
 */
export function ApplicationInfoDrawer({
 open,
 onOpenChange,
 title,
 organization,
 hostname,
 officialUrl,
 sourceLabel,
 deadlineLabel,
 updatedLabel,
 infoRows,
 onReport,
 aboutCopy,
 ctaLabel = "Apply Now",
 downloadUrl,
 downloadFilename,
 onDownload,
 onApply,
}: ApplicationInfoDrawerProps) {
 return (
  <Sheet open={open} onOpenChange={onOpenChange}>
   <SheetContent
    side="right"
    className="flex w-[90vw] flex-col p-0 sm:w-[380px] sm:max-w-[380px]"
    aria-label="Job information"
   >
    <SheetHeader className="border-b border-rule px-5 pb-4 pt-5 text-left dark:border-ink">
     <SheetTitle className="pr-6 text-base leading-snug">{title}</SheetTitle>
     <SheetDescription className="text-[13px]">{organization}</SheetDescription>
     <div className="flex flex-wrap items-center gap-1.5 pt-1">
      <span className="inline-flex items-center gap-1 rounded-full bg-paper-3 px-2 py-0.5 text-[11px] font-medium text-foreground dark:bg-paper-3 dark:text-foreground">
       <ShieldCheck className="h-3 w-3" aria-hidden="true" />
       Verified Link
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-paper-3 px-2 py-0.5 font-mono text-[11px] text-muted-foreground dark:bg-ink dark:text-muted-foreground">
       <Lock className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
       {hostname}
      </span>
     </div>
    </SheetHeader>

    <div className="flex-1 overflow-y-auto px-5 py-4">
     <dl className="space-y-3">
      {infoRows.map((row) => (
       <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
        <dt className="shrink-0 text-muted-foreground dark:text-muted-foreground">{row.label}</dt>
        <dd className="text-right font-medium text-foreground dark:text-paper">{row.value}</dd>
       </div>
      ))}
      {deadlineLabel ? (
       <div className="flex items-start justify-between gap-3 text-sm">
        <dt className="shrink-0 text-muted-foreground dark:text-muted-foreground">Last date</dt>
        <dd className="text-right font-semibold text-foreground dark:text-paper">
         {deadlineLabel}
        </dd>
       </div>
      ) : null}
     </dl>

     <div className="mt-4 rounded-xl bg-paper-2 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-ink/60 dark:text-muted-foreground">
      <p>
       {aboutCopy ??
        `You apply on the ${sourceLabel.toLowerCase()} (${hostname}). ChayanJobsJobs only opens the verified official page for you.`}
      </p>
      {updatedLabel ? <p className="mt-1 text-muted-foreground">Last checked · {updatedLabel}</p> : null}
     </div>
    </div>

    <div className="space-y-2 border-t border-rule px-5 py-4 dark:border-ink">
     {downloadUrl ? (
      <a
       href={downloadUrl}
       download={downloadFilename || "document.pdf"}
       onClick={onDownload}
       className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-paper-3 text-sm font-semibold text-paper transition hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule focus-visible:ring-offset-2"
      >
       {ctaLabel}
       <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </a>
     ) : (
      <a
       href={officialUrl}
       target="_blank"
       rel="noopener noreferrer"
       onClick={onApply}
       className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-paper-3 text-sm font-semibold text-paper transition hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule focus-visible:ring-offset-2"
      >
       {ctaLabel}
       <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </a>
     )}
     <button
      type="button"
      onClick={onReport}
      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:text-muted-foreground dark:hover:bg-ink dark:hover:text-muted-foreground"
     >
      <Flag className="h-3.5 w-3.5" aria-hidden="true" />
      Report broken link
     </button>
    </div>
   </SheetContent>
  </Sheet>
 )
}
