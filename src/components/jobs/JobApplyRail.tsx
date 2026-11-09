"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
 ArrowUpRight,
 ExternalLink,
 Eye,
 FileDown,
 Flag,
 ShieldCheck,
 Users,
} from "lucide-react"
import { formatDate, formatCompact, cn } from "@/lib/utils"
import type { Deadline } from "@/lib/job-insights"
import { Button } from "@/components/ui/button"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { SmartExternalLink } from "@/components/shared/SmartExternalLink"
import { ShareRow } from "@/components/shared/ShareRow"

interface Props {
 jobId: string
 slug: string
 title: string
 department: string
 officialNotification: string | null
 officialWebsite: string | null
 canApply: boolean
 deadline: Deadline
 lastDate: string | null
 updatedAt: string | null
 viewsTotal: number | null
}

/**
 * Desktop right rail - the ONE place for the primary conversion.
 * Order of thought: "can I still apply?" -> "apply" -> "read the source" -> "save it" -> "can I trust it?".
 */
export function JobApplyRail(p: Props) {
 const [trackCount, setTrackCount] = useState<number | null>(null)

 useEffect(() => {
  let cancelled = false
  fetch(`/api/applications/count?jobId=${p.jobId}`)
   .then((r) => (r.ok ? r.json() : null))
   .then((j) => {
    if (!cancelled && j && typeof j.count === "number") setTrackCount(j.count)
   })
   .catch(() => {})
  return () => {
   cancelled = true
  }
 }, [p.jobId])

 const { deadline } = p
 const closed = deadline.state === "closed"
 const urgent = deadline.state === "urgent"
 const upcoming = deadline.state === "upcoming"

 const officialHost = (() => {
  try {
   return p.officialWebsite
    ? new URL(p.officialWebsite.startsWith("http") ? p.officialWebsite : `https://${p.officialWebsite}`).hostname.replace(/^www\./, "")
    : null
  } catch {
   return null
  }
 })()

 const hasProof = (p.viewsTotal ?? 0) > 0 || (trackCount ?? 0) > 0

 return (
  <aside aria-label="Apply" className="space-y-3 print:hidden lg:sticky lg:top-24 lg:self-start">
   {/* ── Apply card ── */}
   <div className="border border-rule bg-card shadow-[0_1px_0_var(--color-rule),0_12px_32px_-18px_rgb(0_0_0/0.35)]">
    <div aria-hidden="true" className={cn("h-1", closed ? "bg-rule-2" : "bg-brick")} />
    <div className="space-y-4 p-5">
     {/* Deadline */}
     <div>
      <p className="agate text-[11px] uppercase tracking-wider text-muted-foreground">
       {closed ? "Status" : upcoming ? "Application window" : "Time to apply"}
      </p>
      <p
       className={cn(
        "mt-1 font-display text-3xl font-bold leading-none tabular-nums",
        urgent ? "text-brick" : closed ? "text-muted-foreground" : "text-foreground",
       )}
      >
       {deadline.label}
      </p>
      {deadline.progress !== null && !closed && !upcoming ? (
       <div
        className="mt-3 h-1.5 w-full bg-paper-3"
        role="progressbar"
        aria-valuenow={deadline.progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Application window elapsed"
       >
        <div className={cn("h-full", urgent ? "bg-brick" : "bg-ink")} style={{ width: `${deadline.progress}%` }} />
       </div>
      ) : null}
      {p.lastDate && !closed ? (
       <p className="agate mt-2 text-xs text-muted-foreground">
        Last date <span className="font-semibold text-foreground">{formatDate(p.lastDate)}</span>
       </p>
      ) : null}
     </div>

     {/* Primary + secondary actions */}
     <div className="space-y-2">
      {p.canApply && !closed ? (
       <Button className="h-11 w-full text-[15px] font-semibold" asChild>
        <Link href={`/apply/${p.slug}/start`}>
         Apply now <ExternalLink className="ml-2 h-4 w-4" />
        </Link>
       </Button>
      ) : closed ? (
       <Button className="h-11 w-full" disabled>
        Applications closed
       </Button>
      ) : null}
      {p.officialNotification ? (
       <Button variant="outline" className="w-full" asChild>
        <SmartExternalLink href={p.officialNotification} linkTitle={`${p.title} - official notification`}>
         <FileDown className="mr-2 h-4 w-4" /> Official notification
        </SmartExternalLink>
       </Button>
      ) : null}
     </div>

     {/* Retention: save + track */}
     <div className="flex items-center gap-2 border-t border-rule pt-4">
      <div className="min-w-0 flex-1">
       <ApplicationTracker jobId={p.jobId} variant="full" className="w-full" />
      </div>
      <BookmarkButton jobId={p.jobId} size="default" variant="outline" />
     </div>

     <ShareRow title={p.title} />
    </div>

    {hasProof ? (
     <div className="agate flex items-center gap-4 border-t border-rule bg-paper-2 px-5 py-2.5 text-[11px] text-muted-foreground">
      {(p.viewsTotal ?? 0) > 0 ? (
       <span className="inline-flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" /> {formatCompact(p.viewsTotal)} views
       </span>
      ) : null}
      {(trackCount ?? 0) > 0 ? (
       <span className="inline-flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" /> {formatCompact(trackCount)} tracking
       </span>
      ) : null}
     </div>
    ) : null}
   </div>

   {/* ── Trust: one compact block (the only disclaimer on the page) ── */}
   <div className="border border-rule bg-card p-4 text-xs">
    <p className="flex items-center gap-2 font-semibold text-foreground">
     <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Checked against the official source
    </p>
    <dl className="mt-2.5 space-y-1.5 text-muted-foreground">
     <div className="flex justify-between gap-3">
      <dt>Department</dt>
      <dd className="text-right font-medium text-foreground">{p.department}</dd>
     </div>
     {officialHost ? (
      <div className="flex justify-between gap-3">
       <dt>Official site</dt>
       <dd className="min-w-0 truncate font-medium text-foreground">
        <SmartExternalLink href={p.officialWebsite!} linkTitle={`${p.title} - official website`} className="inline-flex items-center gap-0.5 hover:text-brick">
         {officialHost} <ArrowUpRight className="h-3 w-3" />
        </SmartExternalLink>
       </dd>
      </div>
     ) : null}
     {p.updatedAt ? (
      <div className="flex justify-between gap-3">
       <dt>Updated</dt>
       <dd className="font-medium tabular-nums text-foreground">{formatDate(p.updatedAt)}</dd>
      </div>
     ) : null}
    </dl>
    <p className="mt-3 border-t border-rule pt-2.5 leading-relaxed text-muted-foreground">
     Not a government website. Confirm fees, dates and eligibility in the notification before paying.{" "}
     <a
      href="#discussion"
      onClick={(e) => {
       e.preventDefault()
       document.getElementById("discussion")?.scrollIntoView({ behavior: "smooth" })
      }}
      className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2 hover:text-brick"
     >
      <Flag className="h-3 w-3" /> Report an error
     </a>
    </p>
   </div>
  </aside>
 )
}
