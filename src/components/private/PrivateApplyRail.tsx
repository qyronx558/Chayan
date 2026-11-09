"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowUpRight, ExternalLink, Eye, Flag, Mail, ShieldAlert, ShieldCheck } from "lucide-react"
import { formatDate, formatCompact, cn } from "@/lib/utils"
import type { Deadline } from "@/lib/job-insights"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { PrivateTracker } from "@/components/private/PrivateTracker"
import { EmployerMonitorButton } from "@/components/private/EmployerMonitorButton"
import { SmartExternalLink } from "@/components/shared/SmartExternalLink"
import { ShareRow } from "@/components/shared/ShareRow"

interface Props {
 privateJobId: string
 slug: string
 title: string
 company: string
 companyWebsite?: string | null
 applicationUrl: string | null
 applicationEmail: string | null
 proofUrl: string | null
 trust: { score: number; label: string; reasons: string[] }
 deadline: Deadline
 /** "Posted 3 days ago" */
 postedLabel: string | null
 lastDate: string | null
 updatedAt: string | null
 viewsTotal: number | null
 onApplyClick: (kind: "APPLY" | "EMAIL") => void
}

/**
 * Right rail. Order of thought for a job seeker:
 * "is it open?" -> apply -> save/track -> "is it safe?" -> share.
 */
export function PrivateApplyRail(p: Props) {
 const [reportOpen, setReportOpen] = useState(false)
 const [reason, setReason] = useState("")
 const [details, setDetails] = useState("")
 const [sending, setSending] = useState(false)

 const closed = p.deadline.state === "closed"
 const urgent = p.deadline.state === "urgent"
 const { score } = p.trust
 const safe = score >= 50
 const risky = score < 30

 const submitReport = async () => {
  if (!reason.trim()) { toast("Enter a reason", "destructive"); return }
  setSending(true)
  try {
   const res = await fetch(`/api/private-jobs/${p.privateJobId}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, details }),
   })
   const json = await res.json()
   if (json.success) {
    toast("Reported - our team will review", "success")
    setReportOpen(false); setReason(""); setDetails("")
   } else toast(json.error || "Failed", "destructive")
  } catch {
   toast("Failed", "destructive")
  } finally {
   setSending(false)
  }
 }

 return (
  <aside aria-label="Apply" className="space-y-3 print:hidden lg:sticky lg:top-24 lg:self-start">
   {/* ── Apply card ── */}
   <div className="border border-rule bg-card shadow-[0_1px_0_var(--color-rule),0_12px_32px_-18px_rgb(0_0_0/0.35)]">
    <div aria-hidden="true" className={cn("h-1", closed ? "bg-rule-2" : "bg-brick")} />
    <div className="space-y-4 p-5">
     <div>
      <p className="agate text-[11px] uppercase tracking-wider text-muted-foreground">{closed ? "Status" : "Hiring status"}</p>
      <p className={cn("mt-1 font-display text-2xl font-bold leading-tight", urgent ? "text-brick" : closed ? "text-muted-foreground" : "text-foreground")}>
       {p.deadline.label}
      </p>
      {p.deadline.progress !== null && !closed ? (
       <div className="mt-3 h-1.5 w-full bg-paper-3" role="progressbar" aria-valuenow={p.deadline.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
        <div className={cn("h-full", urgent ? "bg-brick" : "bg-ink")} style={{ width: `${p.deadline.progress}%` }} />
       </div>
      ) : null}
      <p className="agate mt-2 text-xs text-muted-foreground">
       {p.lastDate && !closed ? <>Last date <span className="font-semibold text-foreground">{formatDate(p.lastDate)}</span></> : p.postedLabel}
       {p.lastDate && !closed && p.postedLabel ? <> · {p.postedLabel}</> : null}
      </p>
     </div>

     {!closed && p.applicationUrl ? (
      <Button className="h-11 w-full text-[15px] font-semibold" asChild>
       <Link href={`/private-jobs/${p.slug}/apply`} target="_blank" rel="noopener noreferrer" onClick={() => p.onApplyClick("APPLY")}>
        Apply now <ExternalLink className="ml-2 h-4 w-4" />
       </Link>
      </Button>
     ) : null}
     {!closed && p.applicationEmail ? (
      <Button variant={p.applicationUrl ? "outline" : "default"} className={cn("w-full", !p.applicationUrl && "h-11 text-[15px] font-semibold")} asChild>
       <a href={`mailto:${p.applicationEmail}`} onClick={() => p.onApplyClick("EMAIL")}>
        <Mail className="mr-2 h-4 w-4" /> Apply by email
       </a>
      </Button>
     ) : null}
     {closed ? <Button className="h-11 w-full" disabled>Applications closed</Button> : null}

     <div className="flex items-center gap-2 border-t border-rule pt-4">
      <div className="min-w-0 flex-1"><PrivateTracker privateJobId={p.privateJobId} variant="full" className="w-full" /></div>
      <BookmarkButton privateJobId={p.privateJobId} size="icon" variant="outline" />
     </div>
     <EmployerMonitorButton privateJobId={p.privateJobId} />
     <ShareRow title={`${p.title} at ${p.company}`} />
    </div>
    {(p.viewsTotal ?? 0) > 0 ? (
     <div className="agate flex items-center gap-1.5 border-t border-rule bg-paper-2 px-5 py-2.5 text-[11px] text-muted-foreground">
      <Eye className="h-3.5 w-3.5" /> {formatCompact(p.viewsTotal)} views
     </div>
    ) : null}
   </div>

   {/* ── Safety: visible by default, not hidden in a tooltip ── */}
   <div className={cn("border bg-card p-4 text-xs", risky ? "border-brick" : "border-rule")}>
    <div className="flex items-center justify-between gap-3">
     <p className="flex items-center gap-2 font-semibold text-foreground">
      {safe ? <ShieldCheck className="h-4 w-4 text-muted-foreground" /> : <ShieldAlert className={cn("h-4 w-4", risky ? "text-brick" : "text-muted-foreground")} />}
      Safety check
     </p>
     <span className={cn("agate text-[11px] uppercase tracking-wider", risky ? "text-brick" : "text-muted-foreground")}>{p.trust.label} · {score}/100</span>
    </div>
    <div className="mt-2 h-1.5 w-full bg-paper-3" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Trust score">
     <div className={cn("h-full", risky ? "bg-brick" : "bg-ink")} style={{ width: `${score}%` }} />
    </div>
    {p.trust.reasons.length > 0 ? (
     <ul className="mt-3 space-y-1 text-muted-foreground">
      {p.trust.reasons.slice(0, 4).map((r) => (
       <li key={r} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 bg-current" />{r}</li>
      ))}
     </ul>
    ) : null}
    <p className="mt-3 flex gap-2 border-t border-rule pt-2.5 leading-relaxed text-muted-foreground">
     <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
     <span>Genuine employers never ask for registration, security or training fees. Confirm the role on the company site before sharing documents.</span>
    </p>
    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
     {p.proofUrl ? (
      <SmartExternalLink href={p.proofUrl} linkTitle="Official posting proof" className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2 hover:text-brick">
       Posting proof <ArrowUpRight className="h-3 w-3" />
      </SmartExternalLink>
     ) : null}
     {p.companyWebsite ? (
      <SmartExternalLink href={p.companyWebsite} linkTitle={`${p.company} - official website`} className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2 hover:text-brick">
       Company site <ArrowUpRight className="h-3 w-3" />
      </SmartExternalLink>
     ) : null}
     <button type="button" onClick={() => setReportOpen((v) => !v)} className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-brick">
      <Flag className="h-3 w-3" /> Report this job
     </button>
    </div>
    {reportOpen ? (
     <div className="mt-3 space-y-2 border-t border-rule pt-3">
      <Input placeholder="Reason, e.g. asks for a registration fee" value={reason} onChange={(e) => setReason(e.target.value)} />
      <Textarea placeholder="Details (optional)" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} />
      <Button size="sm" variant="destructive" disabled={sending} onClick={submitReport}>{sending ? "Submitting..." : "Submit report"}</Button>
     </div>
    ) : null}
   </div>
  </aside>
 )
}
