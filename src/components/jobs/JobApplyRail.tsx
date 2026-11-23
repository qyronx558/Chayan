"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
 ArrowUpRight,
 ExternalLink,
 Eye,
 FileDown,
 Flag,
 Users,
} from "lucide-react"
import { formatDate, formatCompact, cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { paperShadow } from "@/components/desk/DeskKit"
import type { Deadline } from "@/lib/job-insights"
import { Button } from "@/components/ui/button"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { SmartExternalLink } from "@/components/shared/SmartExternalLink"
import { ShareRow } from "@/components/shared/ShareRow"
import { CommunityLinks } from "@/components/shared/CommunityLinks"

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
 const tone = closed ? "oklch(50% 0.02 60)" : urgent ? "var(--color-brick)" : upcoming ? "oklch(48% 0.12 250)" : "var(--hs-trust)"

 return (
  <aside aria-label="Apply" className="space-y-6 print:hidden lg:sticky lg:top-24 lg:self-start">
   {/* ── Apply card: the counterfoil ── */}
   <div className="relative rounded-[4px] border border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)]" style={{ boxShadow: paperShadow }}>
    {/* deadline, as a tear-off date leaf */}
    <div className="flex items-stretch gap-4 px-5 pb-4 pt-5">
     <div className="flex w-[84px] shrink-0 flex-col overflow-hidden rounded-[3px] border border-[var(--hs-border-strong)] text-center" aria-hidden>
      <span className={cn(typeFont.className, "py-1 text-[10px] font-bold text-[oklch(98%_0.01_90)]")} style={{ background: tone }}>
       {closed ? "STATUS" : upcoming ? "OPENS" : "LEFT"}
      </span>
      <span className="flex flex-1 flex-col items-center justify-center bg-[var(--hs-surface)] py-2">
       {deadline.daysLeft !== null ? (
        <>
         <span className="font-display text-[2.3rem] font-black leading-none tabular-nums" style={{ color: tone }}>{Math.max(deadline.daysLeft, 0)}</span>
         <span className={cn(typeFont.className, "mt-0.5 text-[10px] font-bold text-muted-foreground")}>{deadline.daysLeft === 1 ? "DAY" : "DAYS"}</span>
        </>
       ) : (
        <span className={cn(handFont.className, "px-1 text-[1.05rem] leading-tight")} style={{ color: tone }}>{closed ? "over" : upcoming ? "soon" : "open"}</span>
       )}
      </span>
      <span className="h-1.5 bg-[repeating-linear-gradient(90deg,var(--hs-border-strong)_0_2px,transparent_2px_6px)]" />
     </div>
     <div className="min-w-0 flex-1">
      <p className={cn(typeFont.className, "text-[10.5px] font-bold uppercase text-muted-foreground")}>
       {closed ? "Status" : upcoming ? "Application window" : "Time to apply"}
      </p>
      <p className={cn("mt-1 font-display text-[1.45rem] font-black leading-tight", urgent ? "text-[var(--color-brick)]" : closed ? "text-muted-foreground" : "text-foreground")}>
       {deadline.label}
      </p>
      {p.lastDate && !closed ? (
       <p className={cn(typeFont.className, "mt-1.5 text-[11.5px] text-muted-foreground")}>
        last date <span className="font-bold text-foreground">{formatDate(p.lastDate)}</span>
       </p>
      ) : null}
     </div>
    </div>

    {deadline.progress !== null && !closed && !upcoming ? (
     <div className="px-5 pb-4">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--hs-surface-2)]" role="progressbar" aria-valuenow={deadline.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
       <div className="h-full rounded-full" style={{ width: `${deadline.progress}%`, background: urgent ? "var(--color-brick)" : "var(--foreground)" }} />
      </div>
      <p className={cn(handFont.className, "mt-1 text-[0.95rem] text-muted-foreground")}>{deadline.progress}% of the window has gone by</p>
     </div>
    ) : null}

    {/* perforation */}
    <div className="relative mx-0 border-t-2 border-dashed border-[var(--hs-border-strong)]" aria-hidden>
     <span className="absolute -left-[9px] -top-[9px] h-4 w-4 rounded-full border border-[var(--hs-border-strong)] bg-background" />
     <span className="absolute -right-[9px] -top-[9px] h-4 w-4 rounded-full border border-[var(--hs-border-strong)] bg-background" />
    </div>

    <div className="space-y-3 px-5 pb-5 pt-5">
     {p.canApply && !closed ? (
      <Button className="h-12 w-full rounded-full text-[15px] font-semibold" asChild>
       <Link href={`/apply/${p.slug}/start`} target="_blank" rel="noopener noreferrer">
        Apply now <ExternalLink className="ml-2 h-4 w-4" />
       </Link>
      </Button>
     ) : closed ? (
      <Button className="h-12 w-full rounded-full" disabled>
       Applications closed
      </Button>
     ) : null}
     {p.officialNotification ? (
      <Button variant="outline" className="h-11 w-full rounded-full border-[var(--hs-border-strong)] bg-transparent" asChild>
       <SmartExternalLink href={p.officialNotification} linkTitle={`${p.title} - official notification`}>
        <FileDown className="mr-2 h-4 w-4" /> Official notification
       </SmartExternalLink>
      </Button>
     ) : null}

     {/* Retention: save + track */}
     <div className="flex items-center gap-2 pt-2">
      <div className="min-w-0 flex-1">
       <ApplicationTracker jobId={p.jobId} variant="full" className="w-full" />
      </div>
      <BookmarkButton jobId={p.jobId} size="default" variant="outline" />
     </div>

     <ShareRow title={p.title} />
     <CommunityLinks variant="rail" />
    </div>

    {hasProof ? (
     <div className={cn(typeFont.className, "flex items-center gap-4 border-t border-dashed border-[var(--hs-border-strong)] px-5 py-2.5 text-[11px] text-muted-foreground")}>
      {(p.viewsTotal ?? 0) > 0 ? (
       <span className="inline-flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" /> {formatCompact(p.viewsTotal)} read this
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

   {/* ── Trust: one compact slip (the only disclaimer on the page) ── */}
   <div className="relative rotate-[0.4deg] rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] p-4 text-xs" style={{ boxShadow: paperShadow }}>
    <p className="flex items-center gap-2.5 font-semibold text-foreground">
     <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0 -rotate-[10deg]" aria-hidden>
      <circle cx="32" cy="32" r="28" fill="none" stroke="oklch(50% 0.1 160)" strokeWidth="2" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="oklch(50% 0.1 160)" strokeWidth="1" strokeDasharray="2 2" />
      <path d="M21 33 l7 7 l15 -16" fill="none" stroke="oklch(50% 0.1 160)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
     </svg>
     Checked against the official source
    </p>
    <dl className={cn(typeFont.className, "mt-3 space-y-1.5 text-[11.5px] text-muted-foreground")}>
     <div className="flex justify-between gap-3">
      <dt>Department</dt>
      <dd className="text-right font-bold text-foreground">{p.department}</dd>
     </div>
     {officialHost ? (
      <div className="flex justify-between gap-3">
       <dt>Official site</dt>
       <dd className="min-w-0 truncate font-bold text-foreground">
        <SmartExternalLink href={p.officialWebsite!} linkTitle={`${p.title} - official website`} className="inline-flex items-center gap-0.5 hover:text-brick">
         {officialHost} <ArrowUpRight className="h-3 w-3" />
        </SmartExternalLink>
       </dd>
      </div>
     ) : null}
     {p.updatedAt ? (
      <div className="flex justify-between gap-3">
       <dt>Updated</dt>
       <dd className="font-bold tabular-nums text-foreground">{formatDate(p.updatedAt)}</dd>
      </div>
     ) : null}
    </dl>
    <p className="mt-3 border-t border-dashed border-[var(--hs-border-strong)] pt-2.5 leading-relaxed text-muted-foreground">
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
