"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
 FileText, ExternalLink, Printer,
 Calendar, CalendarClock, CalendarPlus, Users, IndianRupee, MapPin,
 GraduationCap, Briefcase, Wallet, Hash, AlarmClock, ShieldCheck,
 ListChecks, ClipboardList, UserRound, Clock, Eye,
 Building2, Wifi, Flag, Mail, Sparkles,
} from "lucide-react"
import { formatDate, formatCompact, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { PrivateTracker } from "@/components/private/PrivateTracker"
import { PrivateInsightStrip } from "@/components/private/PrivateInsightStrip"
import { PrivateQuickSummary } from "@/components/private/PrivateQuickSummary"
import { PrivateApplyRail } from "@/components/private/PrivateApplyRail"
import { MatchScoreBar } from "@/components/private/MatchScoreBar"
import { TrustBadge } from "@/components/private/TrustBadge"
import { EmployerMonitorButton } from "@/components/private/EmployerMonitorButton"
import { PrepKit } from "@/components/private/PrepKit"
import { JobTimeline } from "@/components/jobs/JobTimeline"
import { SmartExternalLink } from "@/components/shared/SmartExternalLink"
import { JobDocumentsChecklist } from "@/components/jobs/JobDocumentsChecklist"
import { RichTextView } from "@/components/shared/RichTextView"
import { containsHtml } from "@/lib/blog-prose"
import { stepify, windowProgress } from "@/lib/job-insights"
import { computeTrustScore, formatSalaryRange } from "@/lib/private-jobs-trust"

interface Company {
 id: string; name: string; slug?: string | null; logo?: string | null
 website?: string | null; description?: string | null; verifiedStatus?: string
}

interface PrivateJob {
 id: string; title: string; slug: string; type: string; category?: string | null
 description?: string | null; location?: string | null; salary?: string | null
 salaryMin?: number | null; salaryMax?: number | null
 experience?: string | null; expMin?: number | null; expMax?: number | null
 qualification?: string | null; skills?: string[]; remotePolicy?: string | null
 vacancies?: number | null; views?: number | null; trustScore?: number | null
 isFresherFriendly?: boolean; isWalkIn?: boolean; walkInVenue?: string | null; walkInDate?: string | null
 proofUrl?: string | null
 applicationUrl?: string | null
 applicationEmail?: string | null; lastDate?: string | null; status: string
 company: Company; createdAt: string; updatedAt?: string | null
}

const typeLabels: Record<string, string> = {
 FULL_TIME: "Full-Time", PART_TIME: "Part-Time", INTERNSHIP: "Internship", CONTRACT: "Contract",
}

const remoteLabels: Record<string, string> = {
 REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site",
}

/**
 * Gov-parity detail layout for private jobs.
 * Same section order and table structures as JobDetailContent:
 * hero → insights → match → countdown → pills → quick summary →
 * details table → dates → eligibility → salary → documents →
 * how-to-apply → trust note → bottom actions, with sticky rail + mobile bar.
 */
export function PrivateJobDetailContent({ job }: { job: PrivateJob }) {
 const { data: session } = useSession()
 const [now, setNow] = useState(() => Date.now())
 const [reportOpen, setReportOpen] = useState(false)
 const [reason, setReason] = useState("")
 const [detailsText, setDetailsText] = useState("")
 const [reporting, setReporting] = useState(false)

 useEffect(() => {
  const timer = setInterval(() => setNow(Date.now()), 30000)
  return () => clearInterval(timer)
 }, [])

 useEffect(() => {
  fetch(`/api/private-jobs/${job.id}/view`, { method: "POST" }).catch(() => {})
 }, [job.id])

 const trackClick = (kind: "APPLY" | "EMAIL") => {
  fetch(`/api/private-jobs/${job.id}/click`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ kind }),
  }).catch(() => {})
 }

 const trust = computeTrustScore({
  applicationUrl: job.applicationUrl,
  applicationEmail: job.applicationEmail,
  proofUrl: job.proofUrl,
  companyWebsite: job.company.website,
  companyVerified: job.company.verifiedStatus === "VERIFIED",
  description: job.description,
 })
 const score = job.trustScore ?? trust.score
 const salary = formatSalaryRange(job.salaryMin, job.salaryMax, job.salary)
 const expRange =
  job.expMin !== null && job.expMin !== undefined
   ? `${job.expMin}–${job.expMax ?? job.expMin} yrs`
   : null

 // ── Countdown / hero KPIs (same math as gov) ──
 const lastDateMs = job.lastDate ? new Date(job.lastDate).getTime() : null
 const validLast = lastDateMs && isFinite(lastDateMs) ? lastDateMs : null
 const diff = validLast ? validLast - now : null
 const daysLeft = diff !== null ? Math.floor(diff / 86400000) : null
 const hoursLeft = diff !== null ? Math.floor((diff % 86400000) / 3600000) : null
 const minsLeft = diff !== null ? Math.floor((diff % 3600000) / 60000) : null
 const isUrgent = diff !== null && diff > 0 && diff <= 7 * 86400000
 const isClosed = diff !== null && diff <= 0
 const canApply = Boolean(job.applicationUrl || job.applicationEmail)
 const progress = windowProgress(job.createdAt, job.lastDate, now)

 const heroKpis = [
  job.vacancies ? { icon: Users, label: "Openings", value: job.vacancies.toLocaleString("en-IN") } : null,
  job.lastDate ? { icon: CalendarClock, label: "Last date", value: formatDate(job.lastDate), urgent: isUrgent } : null,
  salary ? { icon: Wallet, label: "Salary", value: salary } : null,
 ].filter((k): k is NonNullable<typeof k> => k !== null)

 // ── Vacancy Details table (same Table structure as gov) ──
 const details: { icon: typeof Hash; label: string; value: string | null | undefined }[] = [
  { icon: Building2, label: "Company", value: job.company.name },
  { icon: Briefcase, label: "Job Type", value: typeLabels[job.type] || job.type },
  { icon: Hash, label: "Category", value: job.category },
  { icon: MapPin, label: "Location", value: job.location },
  { icon: Wifi, label: "Work Mode", value: job.remotePolicy ? remoteLabels[job.remotePolicy] || job.remotePolicy : null },
  { icon: IndianRupee, label: "Salary", value: salary },
  { icon: Briefcase, label: "Experience", value: job.experience || expRange },
  { icon: GraduationCap, label: "Qualification", value: job.qualification },
  { icon: Sparkles, label: "Key Skills", value: job.skills?.length ? job.skills.join(", ") : null },
  { icon: Users, label: "Openings", value: job.vacancies ? job.vacancies.toLocaleString("en-IN") : null },
  { icon: CalendarPlus, label: "Posted On", value: job.createdAt ? formatDate(job.createdAt) : null },
  { icon: CalendarClock, label: "Last Date to Apply", value: job.lastDate ? formatDate(job.lastDate) : null },
  ...(job.isWalkIn
   ? [
     { icon: MapPin as typeof Hash, label: "Walk-in Venue", value: job.walkInVenue },
     { icon: Calendar as typeof Hash, label: "Walk-in Date", value: job.walkInDate ? formatDate(job.walkInDate) : null },
    ]
   : []),
 ].filter((item) => item.value)

 // ── Important Dates: built only from stored dates (never invented) ──
 const importantDates: Record<string, string> | null = (() => {
  const rec: Record<string, string> = {}
  if (job.createdAt) rec["Posted on"] = formatDate(job.createdAt)
  if (job.walkInDate) rec["Walk-in date"] = formatDate(job.walkInDate)
  if (job.lastDate) rec["Last date to apply"] = formatDate(job.lastDate)
  return Object.keys(rec).length > 0 ? rec : null
 })()
 const dates: { label: string; date: string }[] = importantDates
  ? Object.entries(importantDates).map(([label, date]) => ({ label, date }))
  : []

 const hasEligibility = Boolean(job.qualification || job.experience || expRange || job.skills?.length)
 // Synthetic checklist source so the Documents card matches gov's interactive position.
 const docsSource: string | null =
  "Updated resume (PDF, <2MB)\nGovt ID + address proof\nEducation / experience letters\nPassport-size photo\nOffer / payslip (only if asked, for experienced)"

 const howSteps = stepify(
  [
   job.applicationUrl ? `Open the application link and fill the form on the company site.` : null,
   job.applicationEmail ? `Or email your resume to ${job.applicationEmail} with role title in subject.` : null,
   job.isWalkIn && job.walkInVenue ? `Walk-in${job.walkInDate ? ` on ${formatDate(job.walkInDate)}` : ""} at ${job.walkInVenue} with resume copies + ID.` : null,
  ]
   .filter(Boolean)
   .join("\n"),
 )

 const sections = [
  { id: "job-details", label: "Job Details", icon: ClipboardList, show: details.length > 0 },
  { id: "important-dates", label: "Important Dates", icon: Calendar, show: dates.length > 0 },
  { id: "eligibility", label: "Eligibility", icon: GraduationCap, show: hasEligibility },
  { id: "salary", label: "Salary", icon: Wallet, show: Boolean(salary) },
  { id: "documents", label: "Documents", icon: ListChecks, show: true },
  { id: "how-to-apply", label: "How to Apply", icon: FileText, show: canApply || job.isWalkIn },
 ].filter((s) => s.show)

 const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
 }

 const submitReport = async () => {
  if (!reason.trim()) { toast("Enter a reason", "destructive"); return }
  setReporting(true)
  try {
   const res = await fetch(`/api/private-jobs/${job.id}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, details: detailsText }),
   })
   const json = await res.json()
   if (json.success) { toast("Reported - our team will review", "success"); setReportOpen(false); setReason(""); setDetailsText("") }
   else toast(json.error || "Failed", "destructive")
  } catch { toast("Failed", "destructive") } finally { setReporting(false) }
 }

 return (
  <div className="space-y-6 [scroll-behavior:smooth]">
   {/* ── Header / Masthead ── */}
   <header className="border-b-2 border-rule-2 pb-5">
    <div>
     <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <span className="agate text-xs text-muted-foreground">
       {typeLabels[job.type] || job.type}
      </span>
      {job.category && <span className="agate text-xs text-muted-foreground">{job.category}</span>}
      {job.remotePolicy && (
       <span className="agate inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Wifi className="h-3 w-3" />{remoteLabels[job.remotePolicy] || job.remotePolicy}
       </span>
      )}
      {job.isFresherFriendly && <span className="agate text-xs text-brick">Fresher friendly</span>}
      {job.isWalkIn && <span className="agate text-xs text-brick">Walk-in</span>}
      <span className="agate text-xs text-muted-foreground">
       {job.status === "ACTIVE" ? "Active" : "Expired"}
      </span>
      <TrustBadge score={score} reasons={trust.reasons} />
      {job.vacancies ? (
       <span className="agate text-xs text-muted-foreground">
        {job.vacancies.toLocaleString("en-IN")} openings
       </span>
      ) : null}
     </div>

     <h1 className="font-display text-[2rem] font-bold leading-[1.08] text-foreground sm:text-[2.6rem]">{job.title}</h1>
     <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      {job.company.slug ? (
       <Link href={`/companies/${job.company.slug}`} className="text-base font-medium text-foreground underline decoration-1 underline-offset-4 hover:decoration-brick">
        {job.company.name}
       </Link>
      ) : (
       <span className="text-base font-medium text-foreground">{job.company.name}</span>
      )}
      {job.company.verifiedStatus === "VERIFIED" && (
       <span className="agate text-xs text-muted-foreground">Verified employer</span>
      )}
      {job.location && (
       <span className="agate flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-4 w-4" />{job.location}</span>
      )}
      {job.views !== null && (job.views ?? 0) > 0 ? (
       <span className="agate flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-4 w-4" />{formatCompact(job.views!)} views</span>
      ) : null}
     </p>

     <div className="mt-5 flex flex-wrap items-center gap-2 print:hidden">
      {job.applicationUrl ? (
       <Button size="sm" className="font-medium" asChild>
        <Link href={`/private-jobs/${job.slug}/apply`} onClick={() => trackClick("APPLY")}>
         <ExternalLink className="mr-1.5 h-4 w-4" /> Apply Now
        </Link>
       </Button>
      ) : job.applicationEmail ? (
       <Button size="sm" className="font-medium" asChild>
        <a href={`mailto:${job.applicationEmail}`} onClick={() => trackClick("EMAIL")}>
         <Mail className="mr-1.5 h-4 w-4" /> Apply via Email
        </a>
       </Button>
      ) : null}
      <PrivateTracker privateJobId={job.id} variant="full" />
      <BookmarkButton privateJobId={job.id} size="default" variant="outline" />
      <Button variant="outline" size="icon" onClick={() => window.print()} title="Print">
       <Printer className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setReportOpen(!reportOpen)} className="text-muted-foreground">
       <Flag className="mr-1 h-3.5 w-3.5" /> Report
      </Button>
     </div>
     <div className="mt-2">
      <EmployerMonitorButton privateJobId={job.id} />
     </div>

     {/* KPI strip - 30-second scan */}
     {heroKpis.length > 0 ? (
      <dl className="mt-6 grid grid-cols-1 border-y border-rule sm:grid-cols-3">
       {heroKpis.map((k, i) => (
        <div key={k.label} className={cn(
         "flex items-center gap-3 px-1 py-2.5 sm:px-4",
         i > 0 && "border-t border-rule sm:border-l sm:border-t-0",
        )}>
         <span className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center",
          k.urgent ? "text-brick" : "text-muted-foreground",
         )}>
          <k.icon className="h-4 w-4" />
         </span>
         <div className="min-w-0">
          <dt className="agate text-[10px] text-muted-foreground">{k.label}</dt>
          <dd className={cn("truncate text-sm font-semibold", k.urgent ? "text-brick" : "text-foreground")} title={k.value}>{k.value}</dd>
         </div>
        </div>
       ))}
      </dl>
     ) : null}
    </div>
   </header>

   {/* ── Data-first insight dashboard (same position as gov JobInsightDashboard) ── */}
   <PrivateInsightStrip
    lastDate={job.lastDate}
    salaryMin={job.salaryMin}
    salaryMax={job.salaryMax}
    salaryText={job.salary}
    location={job.location}
    remotePolicy={job.remotePolicy}
    vacancies={job.vacancies}
    views={job.views}
    trustScore={score}
   />

   {/* ── Match score (private-specific, directly below insights) ── */}
   <MatchScoreBar privateJobId={job.id} />

   {/* ── 2-column premium layout (same as gov) ── */}
   <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    {/* Main column */}
    <div className="min-w-0 space-y-6">
     {/* ── Live Countdown (same as gov) ── */}
     {validLast && !isClosed && (
      <div
       role="status"
       aria-live="polite"
       className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-rule p-4",
        isUrgent && "border-brick bg-paper-2",
       )}
      >
       <span className={cn(
        "flex items-center gap-2 text-base font-semibold",
        isUrgent ? "text-brick" : "text-foreground",
       )}>
        <AlarmClock className="h-6 w-6" /> Time Left to Apply
       </span>
       <div className="flex items-center gap-2">
        {[
         { value: daysLeft, unit: "Days" },
         { value: hoursLeft, unit: "Hrs" },
         { value: minsLeft, unit: "Min" },
        ].map((t) => (
         <div key={t.unit} className="border border-rule px-3.5 py-2 text-center">
          <div className={cn("text-xl font-bold leading-none tabular-nums", isUrgent ? "text-brick" : "text-foreground")}>
           {t.value !== null ? t.value : 0}
          </div>
          <div className="agate mt-0.5 text-[10px] text-muted-foreground">{t.unit}</div>
         </div>
        ))}
       </div>
       <p className="agate ml-auto text-xs text-muted-foreground">
        Final date: <span className="font-semibold text-foreground">{formatDate(job.lastDate!)}</span>
       </p>
      </div>
     )}

     {job.isWalkIn && (
      <div className="border-y border-rule bg-paper-2 p-4 text-sm">
       <p className="font-semibold text-foreground">Walk-in {job.walkInDate ? `on ${formatDate(job.walkInDate)}` : ""}</p>
       {job.walkInVenue && <p className="text-muted-foreground">Venue: {job.walkInVenue}</p>}
      </div>
     )}

     {/* ── Quick Navigation pills (same as gov) ── */}
     {sections.length > 1 && (
      <nav aria-label="Job sections" className="flex gap-2 overflow-x-auto pb-1">
       {sections.map((s) => (
        <button
         key={s.id}
         type="button"
         onClick={() => scrollTo(s.id)}
         className="flex shrink-0 items-center gap-1.5 border border-rule px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick"
        >
         <s.icon className="h-3.5 w-3.5" /> {s.label}
        </button>
       ))}
      </nav>
     )}

     {/* ── 2-min TL;DR summary (same position as gov) ── */}
     <PrivateQuickSummary
      title={job.title}
      company={job.company.name}
      vacancies={job.vacancies ?? null}
      lastDate={job.lastDate ?? null}
      salaryMin={job.salaryMin ?? null}
      salaryMax={job.salaryMax ?? null}
      salaryText={job.salary ?? null}
      experience={job.experience || expRange || null}
      qualification={job.qualification ?? null}
      skills={job.skills || []}
     />

     {reportOpen && (
      <Card className="border-brick"><CardContent className="space-y-2 p-4">
       <p className="text-sm font-bold">Report this job (fake, fee-asking, wrong info?)</p>
       <Input placeholder="Reason e.g. Asks for registration fee" value={reason} onChange={(e) => setReason(e.target.value)} />
       <Textarea placeholder="Details (optional)" value={detailsText} onChange={(e) => setDetailsText(e.target.value)} rows={3} />
       <Button size="sm" variant="destructive" disabled={reporting} onClick={submitReport}>{reporting ? "Submitting..." : "Submit report"}</Button>
      </CardContent></Card>
     )}

     {/* ── Job Details Table (same structure as gov Vacancy Details) ── */}
     {details.length > 0 && (
      <section id="job-details" className="scroll-mt-24">
       <Card className="overflow-hidden border-rule">
        <CardHeader className="border-b border-rule bg-paper-2">
         <CardTitle className="flex items-center gap-2 font-display text-lg">
          <ClipboardList className="h-5 w-5 text-muted-foreground" /> Job Details
         </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
         <Table>
          <TableBody>
           {details.map((item) => (
            <TableRow key={item.label} className="border-rule">
             <TableCell className="w-44 font-medium text-muted-foreground sm:w-56">
              <span className="flex items-center gap-2">
               <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" /> {item.label}
              </span>
             </TableCell>
             <TableCell>
              {containsHtml(item.value) ? (
               <RichTextView html={item.value} />
              ) : (
               <span className="whitespace-pre-line">{item.value}</span>
              )}
             </TableCell>
            </TableRow>
           ))}
          </TableBody>
         </Table>
        </CardContent>
       </Card>
      </section>
     )}

     {/* ── Important Dates: visual timeline + table (same as gov) ── */}
     {dates.length > 0 && (
      <section id="important-dates" className="scroll-mt-24">
       <Card className="overflow-hidden border-rule">
        <CardHeader className="border-b border-rule bg-paper-2">
         <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Calendar className="h-5 w-5 text-muted-foreground" /> Important Dates
         </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-4 sm:p-6">
         <JobTimeline importantDates={importantDates} startDate={job.createdAt} lastDate={job.lastDate ?? null} />
         <div className="overflow-hidden border border-rule">
          <Table>
           <TableBody>
            {dates.map((d, i) => {
             const isKeyDate = /last|walk/i.test(d.label)
             return (
              <TableRow key={d.label} className="border-rule">
               <TableCell className="w-10 text-center">
                <span className="agate inline-flex h-6 w-6 items-center justify-center border border-rule text-xs text-muted-foreground">
                 {i + 1}
                </span>
               </TableCell>
               <TableCell className="font-medium text-foreground">{d.label}</TableCell>
               <TableCell className="text-right">
                <Badge variant="outline" className={cn("agate border-rule font-normal", isKeyDate ? "border-brick text-brick" : "text-muted-foreground")}>
                 {d.date}
                </Badge>
               </TableCell>
              </TableRow>
             )
            })}
           </TableBody>
          </Table>
         </div>
        </CardContent>
       </Card>
      </section>
     )}

     {/* ── Eligibility (same card shape as gov) ── */}
     {hasEligibility && (
      <section id="eligibility" className="scroll-mt-24">
       <Card className="border-rule">
        <CardHeader className="border-b border-rule bg-paper-2">
         <CardTitle className="flex items-center gap-2 font-display text-lg">
          <GraduationCap className="h-5 w-5 text-muted-foreground" /> Eligibility Criteria
         </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-4 sm:p-6">
         <div className="flex flex-wrap gap-2">
          {job.qualification && !containsHtml(job.qualification) && (
           <Badge variant="outline" className="agate border-rule font-normal text-muted-foreground">
            <GraduationCap className="mr-1 h-3 w-3" /> {job.qualification}
           </Badge>
          )}
          {(job.experience || expRange) && (
           <Badge variant="outline" className="agate border-rule font-normal text-muted-foreground">
            <Briefcase className="mr-1 h-3 w-3" /> {job.experience || expRange}
           </Badge>
          )}
          {job.isFresherFriendly && (
           <Badge variant="outline" className="agate border-rule font-normal text-muted-foreground">
            <UserRound className="mr-1 h-3 w-3" /> Freshers can apply
           </Badge>
          )}
         </div>
         {job.qualification && containsHtml(job.qualification) && (
          <div>
           <p className="mb-2 text-sm font-semibold text-foreground">Qualification</p>
           <RichTextView html={job.qualification} />
          </div>
         )}
         {(job.skills || []).length > 0 && (
          <div>
           <p className="mb-2 text-sm font-semibold text-foreground">Skills required</p>
           <div className="flex flex-wrap gap-1.5">
            {(job.skills || []).map((s) => (
             <Badge key={s} variant="outline" className="agate border-rule font-normal text-muted-foreground">{s}</Badge>
            ))}
           </div>
          </div>
         )}
        </CardContent>
       </Card>
      </section>
     )}

     {/* ── Salary (same card position as gov Fees) ── */}
     {salary && (
      <section id="salary" className="scroll-mt-24">
       <Card className="border-rule bg-paper-2">
        <CardHeader>
         <CardTitle className="flex items-center gap-2 font-display text-lg text-foreground">
          <Wallet className="h-5 w-5 text-muted-foreground" /> Salary
         </CardTitle>
        </CardHeader>
        <CardContent>
         <p className="text-lg font-semibold text-foreground">{salary}</p>
         <p className="agate mt-1 text-xs text-muted-foreground">
          {job.salaryMin && job.salaryMax ? "Monthly CTC range as listed by employer." : "As listed by employer - confirm in-hand, probation and incentives before joining."}
         </p>
        </CardContent>
       </Card>
      </section>
     )}

     {/* ── Documents Required: interactive checklist (same as gov) ── */}
     <section id="documents" className="scroll-mt-24">
      <Card className="border-rule">
       <CardHeader className="border-b border-rule bg-paper-2">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
         <ListChecks className="h-5 w-5 text-muted-foreground" /> Documents Required
        </CardTitle>
       </CardHeader>
       <CardContent className="p-4 sm:p-6">
        <JobDocumentsChecklist key={job.id} jobId={job.id} documentsRequired={docsSource} />
       </CardContent>
      </Card>
     </section>

     {/* ── How to Apply: vertical timeline + mid CTA (same as gov) ── */}
     {(canApply || job.isWalkIn) && (
      <section id="how-to-apply" className="scroll-mt-24">
       <Card className="border-rule">
        <CardHeader className="border-b border-rule bg-paper-2">
         <CardTitle className="flex items-center gap-2 font-display text-lg">
          <FileText className="h-5 w-5 text-muted-foreground" /> How to Apply
         </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
         {howSteps.length > 1 ? (
          <div>
           <ol className="relative space-y-4 border-l border-rule pl-6">
            {howSteps.map((step, i) => (
             <li key={i} className="relative">
              <span className="agate absolute -left-[37px] flex h-6 w-6 items-center justify-center bg-ink text-xs text-paper">
               {i + 1}
              </span>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{step}</p>
             </li>
            ))}
           </ol>
           {canApply && !isClosed ? (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-y border-rule bg-paper-2 p-4">
             <p className="text-sm font-semibold text-foreground">Keep resume + ID ready. Don&apos;t wait for the last date.</p>
             {job.applicationUrl ? (
              <Button className="font-medium" asChild>
               <Link href={`/private-jobs/${job.slug}/apply`} onClick={() => trackClick("APPLY")}>
                <ExternalLink className="mr-2 h-4 w-4" /> Apply Online Now
               </Link>
              </Button>
             ) : job.applicationEmail ? (
              <Button className="font-medium" asChild>
               <a href={`mailto:${job.applicationEmail}`} onClick={() => trackClick("EMAIL")}>
                <Mail className="mr-2 h-4 w-4" /> Apply via Email
               </a>
              </Button>
             ) : null}
            </div>
           ) : null}
          </div>
         ) : (
          <div className="flex flex-wrap gap-3">
           {job.applicationUrl && (
            <Button className="font-medium" asChild>
             <Link href={`/private-jobs/${job.slug}/apply`} onClick={() => trackClick("APPLY")}>
              <ExternalLink className="mr-2 h-4 w-4" /> Apply Online
             </Link>
            </Button>
           )}
           {job.applicationEmail && (
            <Button variant="outline" asChild>
             <a href={`mailto:${job.applicationEmail}`} onClick={() => trackClick("EMAIL")}>
              <Mail className="mr-2 h-4 w-4" /> Apply via Email
             </a>
            </Button>
           )}
          </div>
         )}
        </CardContent>
       </Card>
      </section>
     )}

     {/* ── Job Description (full text) ── */}
     {job.description && (
      <Card className="border-rule">
       <CardHeader className="border-b border-rule bg-paper-2">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
         <FileText className="h-5 w-5 text-muted-foreground" /> Job Description
        </CardTitle>
       </CardHeader>
       <CardContent className="p-4 sm:p-6">
        <RichTextView html={job.description} />
       </CardContent>
      </Card>
     )}

     {/* ── Get hired faster (private PrepKit, same width as main column) ── */}
     <div>
      <h2 className="mb-3 font-display text-xl font-bold">Get hired faster</h2>
      <PrepKit
       title={job.title}
       company={job.company.name}
       description={job.description}
       skills={job.skills}
       category={job.category}
       experience={job.experience || expRange}
       applicationEmail={job.applicationEmail}
       applicantName={session?.user?.name}
      />
     </div>

     {/* ── About company ── */}
     {(job.company.description || job.company.website) && (
      <Card>
       <CardContent className="p-6">
        <h2 className="mb-4 font-display text-xl font-bold text-foreground">About {job.company.name}</h2>
        {job.company.description && <p className="text-muted-foreground">{job.company.description}</p>}
        <div className="mt-3 flex flex-wrap gap-3">
         {job.company.website && (
          <SmartExternalLink
           href={job.company.website}
           linkTitle={`${job.company.name} - official website`}
           className="inline-flex items-center gap-1.5 text-sm text-brick underline decoration-1 underline-offset-4 hover:decoration-2"
          >
           <ExternalLink className="h-4 w-4" /> Visit {job.company.name} Website
          </SmartExternalLink>
         )}
         {job.company.slug && (
          <Link href={`/companies/${job.company.slug}`} className="text-sm font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2">All jobs at {job.company.name}</Link>
         )}
        </div>
       </CardContent>
      </Card>
     )}

     {/* ── Trust / Verify Note (same position as gov) ── */}
     <div className="flex items-start gap-3 border-y border-rule bg-paper-2 p-4">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="text-sm text-muted-foreground">
       <p className="font-semibold text-foreground">Stay safe: trust score {score}/100 ({trust.label})</p>
       <p className="mt-0.5">
        {trust.reasons.length > 0 ? `${trust.reasons.join(", ")}. ` : ""}
        Never pay registration/security deposits. Verify role, salary and venue from the{" "}
        {job.proofUrl ? (
         <SmartExternalLink href={job.proofUrl} linkTitle="Official posting proof" className="font-medium text-brick underline">
          official posting proof
         </SmartExternalLink>
        ) : job.company.website ? (
         <SmartExternalLink href={job.company.website} linkTitle={`${job.company.name} - official website`} className="font-medium text-brick underline">
          company website
         </SmartExternalLink>
        ) : (
         "company website"
        )}{" "}
        before applying.
       </p>
      </div>
     </div>

     {/* ── Bottom Actions (same as gov: 3rd Apply CTA) ── */}
     <div className="flex flex-wrap gap-3 pt-2">
      {job.proofUrl && (
       <Button variant="outline" size="lg" asChild>
        <SmartExternalLink href={job.proofUrl} linkTitle="Official posting proof">
         <FileText className="mr-2 h-5 w-5" /> View Official Proof
        </SmartExternalLink>
       </Button>
      )}
      {canApply ? (
       job.applicationUrl ? (
        <Button size="lg" className="font-medium" asChild>
         <Link href={`/private-jobs/${job.slug}/apply`} onClick={() => trackClick("APPLY")}>
          <ExternalLink className="mr-2 h-5 w-5" /> Apply Online
         </Link>
        </Button>
       ) : job.applicationEmail ? (
        <Button size="lg" className="font-medium" asChild>
         <a href={`mailto:${job.applicationEmail}`} onClick={() => trackClick("EMAIL")}>
          <Mail className="mr-2 h-5 w-5" /> Apply via Email
         </a>
        </Button>
       ) : null
      ) : null}
     </div>
    </div>

    {/* Sticky conversion rail (same as gov) */}
    <PrivateApplyRail
     privateJobId={job.id}
     slug={job.slug}
     title={job.title}
     company={job.company.name}
     companySlug={job.company.slug ?? null}
     companyWebsite={job.company.website ?? null}
     verifiedEmployer={job.company.verifiedStatus === "VERIFIED"}
     applicationUrl={job.applicationUrl ?? null}
     applicationEmail={job.applicationEmail ?? null}
     proofUrl={job.proofUrl ?? null}
     trustScore={score}
     trustReasons={trust.reasons}
     updatedAt={job.updatedAt || null}
     createdAt={job.createdAt}
     viewsTotal={job.views ?? null}
     lastDate={job.lastDate ?? null}
     sections={sections.map((s) => ({ id: s.id, label: s.label }))}
    />
   </div>

   {/* ── Sticky Mobile Apply Bar with window progress (same as gov) ── */}
   <div className="sticky bottom-0 z-40 -mx-4 mt-4 border-t border-rule bg-background print:hidden lg:hidden">
    {progress !== null && !isClosed ? (
     <div className="h-1 w-full bg-paper-3" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
      <div className={cn("h-full", progress > 85 ? "bg-brick" : "bg-ink")} style={{ width: `${progress}%` }} />
     </div>
    ) : null}
    <div className="flex items-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
     <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-foreground">{job.title}</p>
      <p className={cn(
       "agate flex items-center gap-1.5 text-xs",
       isClosed || isUrgent ? "text-brick" : "text-muted-foreground",
      )}>
       {isClosed ? <Clock className="h-4 w-4" /> : <AlarmClock className="h-4 w-4" />}
       {isClosed
        ? "Applications closed"
        : daysLeft !== null
         ? `${daysLeft} days left to apply`
         : "Applications open"}
      </p>
     </div>
     {canApply ? (
      job.applicationUrl ? (
       <Button className="font-medium" asChild>
        <Link href={`/private-jobs/${job.slug}/apply`} onClick={() => trackClick("APPLY")}>
         <ExternalLink className="mr-1.5 h-4 w-4" /> Apply Now
        </Link>
       </Button>
      ) : job.applicationEmail ? (
       <Button className="font-medium" asChild>
        <a href={`mailto:${job.applicationEmail}`} onClick={() => trackClick("EMAIL")}>
         <Mail className="mr-1.5 h-4 w-4" /> Apply
        </a>
       </Button>
      ) : null
     ) : null}
    </div>
   </div>
  </div>
 )
}
