"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowUpRight, ExternalLink, Eye, Flag, Mail, ShieldAlert, ShieldCheck } from "lucide-react"
import { formatDate, formatCompact, cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { paperShadow } from "@/components/desk/DeskKit"
import type { Deadline } from "@/lib/job-insights"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { PrivateTracker } from "@/components/private/PrivateTracker"
import { EmployerMonitorButton } from "@/components/private/EmployerMonitorButton"
import { SmartExternalLink } from "@/components/shared/SmartExternalLink"
import { CheckCircle2 } from "lucide-react"
import { appliedOn } from "@/components/private/AppliedBadge"
import { unmarkApplied, useAppliedAt } from "@/lib/private-jobs/applied-store"
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

 const BLUE = "oklch(45% 0.13 255)"
 const RED = "oklch(52% 0.19 27)"
 const tone = closed ? "oklch(50% 0.02 60)" : urgent ? RED : BLUE
 /* an airport-style three-letter code for the employer: "Tata Consultancy Services" -> TCS, "Zomato" -> ZOM */
 const initials = (s: string) => {
  const words = s.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean)
  const code = words.length > 1 ? words.slice(0, 3).map((w) => w[0]).join("") : (words[0] ?? "").slice(0, 3)
  return code.toUpperCase() || "JOB"
 }

 return (
  <aside aria-label="Apply" className="space-y-5 print:hidden lg:sticky lg:top-24 lg:self-start">
   {/* ── Apply card: a boarding pass for the next step of your career ── */}
   <div className="overflow-hidden rounded-[14px] border border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)]" style={{ boxShadow: "0 1px 1px rgb(0 0 0 / .06), 0 22px 36px -22px rgb(20 30 70 / .55)" }}>
    <div className={cn(typeFont.className, "flex items-center justify-between px-5 py-2 text-[10.5px] font-bold tracking-[0.25em] text-[oklch(98%_0.01_90)]")} style={{ background: tone }}>
     <span>BOARDING PASS</span>
     <span aria-hidden>✈</span>
    </div>
    <div className="space-y-4 px-5 pb-5 pt-4">
     {/* from you → to them */}
     <div className={cn(typeFont.className, "flex items-end justify-between gap-2")} aria-hidden>
      <div>
       <p className="text-[9.5px] text-muted-foreground">FROM</p>
       <p className="font-display text-[1.6rem] font-black leading-none text-foreground">YOU</p>
      </div>
      <svg viewBox="0 0 90 20" className="mb-1 h-5 flex-1" fill="none">
       <path d="M2 14 C 30 2, 60 2, 84 12" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 4" className="text-muted-foreground" />
       <path d="M80 8 l6 4 -7 2" stroke="currentColor" strokeWidth="1.4" className="text-muted-foreground" />
      </svg>
      <div className="text-right">
       <p className="text-[9.5px] text-muted-foreground">TO</p>
       <p className="font-display text-[1.6rem] font-black leading-none" style={{ color: tone }}>{initials(p.company)}</p>
      </div>
     </div>

     <div>
      <p className={cn(typeFont.className, "text-[9.5px] font-bold text-muted-foreground")}>{closed ? "STATUS" : "GATE CLOSES"}</p>
      <p className="mt-0.5 font-display text-[1.45rem] font-black leading-tight" style={{ color: closed ? undefined : urgent ? RED : undefined }}>
       <span className={closed ? "text-muted-foreground" : urgent ? "" : "text-foreground"}>{p.deadline.label}</span>
      </p>
      {p.deadline.progress !== null && !closed ? (
       <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--hs-surface-2)]" role="progressbar" aria-valuenow={p.deadline.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
        <div className="h-full rounded-full" style={{ width: `${p.deadline.progress}%`, background: tone }} />
       </div>
      ) : null}
      <dl className={cn(typeFont.className, "mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]")}>
       {p.lastDate && !closed ? (
        <div><dt className="text-[9.5px] text-muted-foreground">LAST DATE</dt><dd className="font-bold text-foreground">{formatDate(p.lastDate)}</dd></div>
       ) : null}
       {p.postedLabel ? (
        <div><dt className="text-[9.5px] text-muted-foreground">BOARDING</dt><dd className="font-bold text-foreground">{p.postedLabel.replace(/^Posted /, "")}</dd></div>
       ) : null}
      </dl>
     </div>

     <AppliedNote privateJobId={p.privateJobId} />
     {!closed && p.applicationUrl ? (
      <Button className="h-12 w-full rounded-full text-[15px] font-semibold" asChild>
       <Link href={`/private-jobs/${p.slug}/apply`} target="_blank" rel="noopener noreferrer" onClick={() => p.onApplyClick("APPLY")}>
        Apply now <ExternalLink className="ml-2 h-4 w-4" />
       </Link>
      </Button>
     ) : null}
     {!closed && p.applicationEmail ? (
      <Button variant={p.applicationUrl ? "outline" : "default"} className={cn("w-full rounded-full", !p.applicationUrl && "h-12 text-[15px] font-semibold")} asChild>
       <a href={`mailto:${p.applicationEmail}`} onClick={() => p.onApplyClick("EMAIL")}>
        <Mail className="mr-2 h-4 w-4" /> Apply by email
       </a>
      </Button>
     ) : null}
     {closed ? <Button className="h-12 w-full rounded-full" disabled>Applications closed</Button> : null}
     {!closed ? <p className={cn(handFont.className, "-mt-1 text-center text-[1rem] text-muted-foreground")}>a real employer never asks you for a fee.</p> : null}
    </div>

    {/* perforation + stub */}
    <div className="relative" aria-hidden>
     <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-[var(--hs-border-strong)] bg-background" />
     <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-[var(--hs-border-strong)] bg-background" />
     <div className="mx-5 border-t-2 border-dashed border-[var(--hs-border-strong)]" />
    </div>
    <div className="space-y-3 px-5 pb-4 pt-4">
     <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1"><PrivateTracker privateJobId={p.privateJobId} variant="full" className="w-full" /></div>
      <BookmarkButton privateJobId={p.privateJobId} size="icon" variant="outline" />
     </div>
     <EmployerMonitorButton privateJobId={p.privateJobId} />
     <ShareRow title={`${p.title} at ${p.company}`} />
     <div className={cn(typeFont.className, "flex items-center justify-between gap-3 pt-1 text-[10px] text-muted-foreground")}>
      {/* barcode, purely decorative */}
      <span className="flex h-6 items-stretch gap-[2px]" aria-hidden>
       {Array.from({ length: 26 }, (_, i) => <span key={i} className="bg-foreground/70" style={{ width: (i * 7) % 3 === 0 ? 2 : 1 }} />)}
      </span>
      {(p.viewsTotal ?? 0) > 0 ? <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {formatCompact(p.viewsTotal)} views</span> : null}
     </div>
    </div>
   </div>

   {/* ── Safety: a customs declaration, visible by default ── */}
   <div className={cn("relative rounded-[4px] border-2 bg-[var(--hs-paper-slip)] p-4 text-xs", risky ? "border-[var(--color-brick)]" : "border-[var(--hs-border-strong)]")} style={{ boxShadow: paperShadow }}>
    <div className="flex items-start justify-between gap-3">
     <div>
      <p className={cn(typeFont.className, "text-[9.5px] font-bold tracking-[0.25em] text-muted-foreground")}>CUSTOMS · SAFETY CHECK</p>
      <p className="mt-1 flex items-center gap-2 font-display text-[1.05rem] font-black text-foreground">
       {safe ? <ShieldCheck className="h-4 w-4" style={{ color: "oklch(45% 0.1 160)" }} /> : <ShieldAlert className={cn("h-4 w-4", risky ? "text-[var(--color-brick)]" : "text-muted-foreground")} />}
       {p.trust.label}
      </p>
     </div>
     {/* the inspector's stamp */}
     <span
      className={cn(typeFont.className, "shrink-0 rotate-[-8deg] rounded-full border-[2.5px] px-2.5 py-1.5 text-center text-[10px] font-bold leading-tight")}
      style={{ color: risky ? RED : safe ? "oklch(45% 0.1 160)" : "oklch(52% 0.12 70)", borderColor: "currentColor" }}
     >
      {score}<span className="opacity-70">/100</span><br />{risky ? "HOLD" : safe ? "CLEARED" : "CHECK"}
     </span>
    </div>
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--hs-surface-2)]" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Trust score">
     <div className="h-full rounded-full" style={{ width: `${score}%`, background: risky ? RED : safe ? "oklch(50% 0.1 160)" : "oklch(62% 0.13 75)" }} />
    </div>
    {p.trust.reasons.length > 0 ? (
     <ul className="mt-3 space-y-1.5 text-foreground/80">
      {p.trust.reasons.slice(0, 4).map((r) => (
       <li key={r} className="flex gap-2"><span className={cn(typeFont.className, "shrink-0 text-[10px] font-bold text-muted-foreground")}>☐</span>{r}</li>
      ))}
     </ul>
    ) : null}
    <p className="mt-3 flex gap-2 rounded-[3px] px-2.5 py-2 leading-relaxed text-[oklch(30%_0.05_60)]" style={{ background: "oklch(93% 0.06 90)" }}>
     <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
     <span>Genuine employers never ask for registration, security or training fees. Confirm the role on the company site before sharing documents.</span>
    </p>
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
     {p.proofUrl ? (
      <SmartExternalLink href={p.proofUrl} linkTitle="Official posting proof" className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2 hover:text-[var(--color-brick)]">
       Posting proof <ArrowUpRight className="h-3 w-3" />
      </SmartExternalLink>
     ) : null}
     {p.companyWebsite ? (
      <SmartExternalLink href={p.companyWebsite} linkTitle={`${p.company} - official website`} className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2 hover:text-[var(--color-brick)]">
       Company site <ArrowUpRight className="h-3 w-3" />
      </SmartExternalLink>
     ) : null}
     <button type="button" onClick={() => setReportOpen((v) => !v)} className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-[var(--color-brick)]">
      <Flag className="h-3 w-3" /> Report this job
     </button>
    </div>
    {reportOpen ? (
     <div className="mt-3 space-y-2 border-t border-dashed border-[var(--hs-border-strong)] pt-3">
      <Input placeholder="Reason, e.g. asks for a registration fee" value={reason} onChange={(e) => setReason(e.target.value)} />
      <Textarea placeholder="Details (optional)" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} />
      <Button size="sm" variant="destructive" disabled={sending} onClick={submitReport}>{sending ? "Submitting..." : "Submit report"}</Button>
     </div>
    ) : null}
   </div>
  </aside>
 )
}

/** "You applied on 12 Nov" with a way to undo a mistaken record. */
function AppliedNote({ privateJobId }: { privateJobId: string }) {
 const at = useAppliedAt(privateJobId)
 if (!at) return null
 return (
  <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
   <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
   <p className="min-w-0">
    <span className="font-medium">You applied on {appliedOn(at)}</span>
    <span className="block text-xs text-emerald-800/80 dark:text-emerald-300/80">
     Saved in <Link href="/private-applications" className="underline">My applications</Link>.{" "}
     <button type="button" className="underline" onClick={() => unmarkApplied(privateJobId)}>Didn&apos;t apply?</button>
    </span>
   </p>
  </div>
 )
}
