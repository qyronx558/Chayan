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
      {/* ── Header / Hero - same shape as gov, private sky/teal accent ── */}
      <header className="relative overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-r from-sky-50 via-white to-teal-50 shadow-lg dark:border-gray-700 dark:from-[#0a1628] dark:via-gray-950 dark:to-[#06231f]">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 flex h-56 w-56 items-center justify-center">
          <Building2 className="h-48 w-48 text-sky-900/10 dark:text-white/10" />
        </div>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500" />

        <div className="relative p-6 pt-8 sm:p-8 sm:pt-9">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border border-gray-200 bg-white/80 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800">
              {typeLabels[job.type] || job.type}
            </Badge>
            {job.category && <Badge variant="secondary">{job.category}</Badge>}
            {job.remotePolicy && (
              <Badge variant="outline" className="bg-white/80 dark:bg-gray-800">
                <Wifi className="mr-1 h-3 w-3" />{remoteLabels[job.remotePolicy] || job.remotePolicy}
              </Badge>
            )}
            {job.isFresherFriendly && <Badge className="bg-emerald-600">Fresher friendly</Badge>}
            {job.isWalkIn && <Badge className="bg-amber-500">Walk-in</Badge>}
            <Badge variant={job.status === "ACTIVE" ? "default" : "secondary"}>
              {job.status === "ACTIVE" ? "Active" : "Expired"}
            </Badge>
            <TrustBadge score={score} reasons={trust.reasons} />
            {job.vacancies ? (
              <Badge className="border border-gray-200 bg-white/80 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {job.vacancies.toLocaleString("en-IN")} openings
              </Badge>
            ) : null}
          </div>

          <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-3xl">{job.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-sky-700" />
            {job.company.slug ? (
              <Link href={`/companies/${job.company.slug}`} className="text-base font-semibold text-sky-800 hover:underline dark:text-sky-300">
                {job.company.name}
              </Link>
            ) : (
              <span className="text-base font-semibold text-sky-800 dark:text-sky-300">{job.company.name}</span>
            )}
            {job.company.verifiedStatus === "VERIFIED" && (
              <Badge variant="outline" className="text-[11px] text-emerald-700">Verified employer</Badge>
            )}
            {job.location && (
              <>
                <span className="text-sky-500">•</span>
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300"><MapPin className="h-4 w-4" />{job.location}</span>
              </>
            )}
            {job.views !== null && (job.views ?? 0) > 0 ? (
              <>
                <span className="text-sky-500">•</span>
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><Eye className="h-4 w-4" />{formatCompact(job.views!)} views</span>
              </>
            ) : null}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2 print:hidden">
            {job.applicationUrl ? (
              <Button size="sm" className="bg-gradient-to-r from-sky-600 to-teal-600 font-semibold text-white shadow-sm hover:opacity-90" asChild>
                <Link href={`/private-jobs/${job.slug}/apply`} onClick={() => trackClick("APPLY")}>
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Apply Now
                </Link>
              </Button>
            ) : job.applicationEmail ? (
              <Button size="sm" className="bg-gradient-to-r from-sky-600 to-teal-600 font-semibold text-white shadow-sm hover:opacity-90" asChild>
                <a href={`mailto:${job.applicationEmail}`} onClick={() => trackClick("EMAIL")}>
                  <Mail className="mr-1.5 h-4 w-4" /> Apply via Email
                </a>
              </Button>
            ) : null}
            <PrivateTracker privateJobId={job.id} variant="full" />
            <BookmarkButton privateJobId={job.id} size="default" variant="outline" className="border-sky-300 bg-white/80 text-gray-700 hover:bg-sky-50 hover:text-sky-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200" />
            <Button variant="outline" size="icon" className="border-gray-300 bg-white/80 text-gray-600 hover:bg-sky-50 hover:text-sky-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300" onClick={() => window.print()} title="Print">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setReportOpen(!reportOpen)} className="text-gray-500">
              <Flag className="mr-1 h-3.5 w-3.5" /> Report
            </Button>
          </div>
          <div className="mt-2">
            <EmployerMonitorButton privateJobId={job.id} />
          </div>

          {/* KPI strip - 30-second scan (same as gov) */}
          {heroKpis.length > 0 ? (
            <dl className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {heroKpis.map((k) => (
                <div key={k.label} className={cn(
                  "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 backdrop-blur",
                  k.urgent
                    ? "border-red-300 bg-red-50/90 dark:border-red-800 dark:bg-red-950/60"
                    : "border-white/60 bg-white/70 dark:border-gray-700 dark:bg-gray-800/80",
                )}>
                  <span className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    k.urgent ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
                  )}>
                    <k.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{k.label}</dt>
                    <dd className={cn("truncate text-sm font-extrabold", k.urgent ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white")} title={k.value}>{k.value}</dd>
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
                "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border-2 border-l-8 p-4 shadow-md",
                isUrgent
                  ? "border-red-300 border-l-red-600 bg-red-50 dark:border-red-800 dark:border-l-red-500 dark:bg-red-950/60"
                  : "border-sky-300 border-l-sky-600 bg-gradient-to-r from-sky-50 via-white to-teal-50 dark:border-gray-600 dark:from-[#0a1628] dark:via-gray-900 dark:to-[#06231f]",
              )}
            >
              <span className={cn(
                "flex items-center gap-2 text-base font-bold",
                isUrgent ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white",
              )}>
                <AlarmClock className="h-6 w-6" /> Time Left to Apply
              </span>
              <div className="flex items-center gap-2">
                {[
                  { value: daysLeft, unit: "Days" },
                  { value: hoursLeft, unit: "Hrs" },
                  { value: minsLeft, unit: "Min" },
                ].map((t) => (
                  <div key={t.unit} className={cn(
                    "rounded-lg px-3.5 py-2 text-center shadow-sm ring-1",
                    isUrgent ? "bg-white ring-red-300 dark:bg-red-900 dark:ring-red-700" : "bg-white ring-sky-200 dark:bg-gray-800 dark:ring-gray-600",
                  )}>
                    <div className={cn("text-xl font-extrabold leading-none tabular-nums", isUrgent ? "text-red-700 dark:text-red-300" : "text-teal-800 dark:text-teal-300")}>
                      {t.value !== null ? t.value : 0}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t.unit}</div>
                  </div>
                ))}
              </div>
              <p className="ml-auto text-sm font-medium text-gray-700 dark:text-gray-200">
                Final date: <span className="font-bold">{formatDate(job.lastDate!)}</span>
              </p>
            </div>
          )}

          {job.isWalkIn && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
              <p className="font-bold text-amber-800 dark:text-amber-300">Walk-in {job.walkInDate ? `on ${formatDate(job.walkInDate)}` : ""}</p>
              {job.walkInVenue && <p className="text-amber-700 dark:text-amber-400">Venue: {job.walkInVenue}</p>}
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
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-sky-700 dark:hover:bg-sky-950 dark:hover:text-sky-300"
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
            <Card className="border-red-200"><CardContent className="space-y-2 p-4">
              <p className="text-sm font-bold">Report this job (fake, fee-asking, wrong info?)</p>
              <Input placeholder="Reason e.g. Asks for registration fee" value={reason} onChange={(e) => setReason(e.target.value)} />
              <Textarea placeholder="Details (optional)" value={detailsText} onChange={(e) => setDetailsText(e.target.value)} rows={3} />
              <Button size="sm" variant="destructive" disabled={reporting} onClick={submitReport}>{reporting ? "Submitting..." : "Submit report"}</Button>
            </CardContent></Card>
          )}

          {/* ── Job Details Table (same structure as gov Vacancy Details) ── */}
          {details.length > 0 && (
            <section id="job-details" className="scroll-mt-24">
              <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5 text-sky-600" /> Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {details.map((item, i) => (
                        <TableRow key={item.label} className={cn(i % 2 === 1 && "bg-gray-50/70 dark:bg-gray-800/40")}>
                          <TableCell className="w-44 font-medium text-gray-700 sm:w-56 dark:text-gray-300">
                            <span className="flex items-center gap-2">
                              <item.icon className="h-4 w-4 shrink-0 text-sky-500" /> {item.label}
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
              <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-sky-600" /> Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-4 sm:p-6">
                  <JobTimeline importantDates={importantDates} startDate={job.createdAt} lastDate={job.lastDate ?? null} />
                  <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                    <Table>
                      <TableBody>
                        {dates.map((d, i) => {
                          const isKeyDate = /last|walk/i.test(d.label)
                          return (
                            <TableRow key={d.label} className={cn(i % 2 === 1 && "bg-gray-50/70 dark:bg-gray-800/40")}>
                              <TableCell className="w-10 text-center">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                  {i + 1}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium text-gray-700 dark:text-gray-300">{d.label}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={isKeyDate ? "default" : "outline"} className={cn(!isKeyDate && "bg-white dark:bg-gray-800")}>
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
              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <GraduationCap className="h-5 w-5 text-sky-600" /> Eligibility Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-4 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    {job.qualification && !containsHtml(job.qualification) && (
                      <Badge variant="secondary" className="bg-sky-50 text-xs text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                        <GraduationCap className="mr-1 h-3 w-3" /> {job.qualification}
                      </Badge>
                    )}
                    {(job.experience || expRange) && (
                      <Badge variant="secondary" className="bg-purple-50 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        <Briefcase className="mr-1 h-3 w-3" /> {job.experience || expRange}
                      </Badge>
                    )}
                    {job.isFresherFriendly && (
                      <Badge variant="secondary" className="bg-emerald-50 text-xs text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        <UserRound className="mr-1 h-3 w-3" /> Freshers can apply
                      </Badge>
                    )}
                  </div>
                  {job.qualification && containsHtml(job.qualification) && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Qualification</p>
                      <RichTextView html={job.qualification} />
                    </div>
                  )}
                  {(job.skills || []).length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Skills required</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(job.skills || []).map((s) => (
                          <Badge key={s} variant="secondary">{s}</Badge>
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
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-amber-800 dark:text-amber-300">
                    <Wallet className="h-5 w-5 text-amber-600" /> Salary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">{salary}</p>
                  <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">
                    {job.salaryMin && job.salaryMax ? "Monthly CTC range as listed by employer." : "As listed by employer - confirm in-hand, probation and incentives before joining."}
                  </p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* ── Documents Required: interactive checklist (same as gov) ── */}
          <section id="documents" className="scroll-mt-24">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ListChecks className="h-5 w-5 text-sky-600" /> Documents Required
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
              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-sky-600" /> How to Apply
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {howSteps.length > 1 ? (
                    <div>
                      <ol className="relative space-y-4 border-l-2 border-sky-200 pl-6 dark:border-sky-900">
                        {howSteps.map((step, i) => (
                          <li key={i} className="relative">
                            <span className="absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-teal-600 text-xs font-bold text-white shadow">
                              {i + 1}
                            </span>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">{step}</p>
                          </li>
                        ))}
                      </ol>
                      {canApply && !isClosed ? (
                        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-gradient-to-r from-sky-50 to-teal-50 p-4 dark:from-sky-950/40 dark:to-teal-950/40">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Keep resume + ID ready. Don&apos;t wait for the last date.</p>
                          {job.applicationUrl ? (
                            <Button className="bg-gradient-to-r from-sky-600 to-teal-600 font-semibold text-white hover:opacity-90" asChild>
                              <Link href={`/private-jobs/${job.slug}/apply`} onClick={() => trackClick("APPLY")}>
                                <ExternalLink className="mr-2 h-4 w-4" /> Apply Online Now
                              </Link>
                            </Button>
                          ) : job.applicationEmail ? (
                            <Button className="bg-gradient-to-r from-sky-600 to-teal-600 font-semibold text-white hover:opacity-90" asChild>
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
                        <Button className="bg-gradient-to-r from-sky-600 to-teal-600 text-white" asChild>
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
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-sky-600" /> Job Description
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <RichTextView html={job.description} />
              </CardContent>
            </Card>
          )}

          {/* ── Get hired faster (private PrepKit, same width as main column) ── */}
          <div>
            <h2 className="mb-3 text-xl font-semibold">Get hired faster</h2>
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
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">About {job.company.name}</h2>
                {job.company.description && <p className="text-gray-600 dark:text-gray-300">{job.company.description}</p>}
                <div className="mt-3 flex flex-wrap gap-3">
                  {job.company.website && (
                    <SmartExternalLink
                      href={job.company.website}
                      linkTitle={`${job.company.name} - official website`}
                      className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700"
                    >
                      <ExternalLink className="h-4 w-4" /> Visit {job.company.name} Website
                    </SmartExternalLink>
                  )}
                  {job.company.slug && (
                    <Link href={`/companies/${job.company.slug}`} className="text-sm font-semibold text-sky-700 hover:underline">All jobs at {job.company.name} →</Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Trust / Verify Note (same position as gov) ── */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold text-amber-800 dark:text-amber-300">Stay safe - trust score {score}/100 ({trust.label})</p>
              <p className="mt-0.5">
                {trust.reasons.length > 0 ? `${trust.reasons.join(" · ")}. ` : ""}
                Never pay registration/security deposits. Verify role, salary and venue from the{" "}
                {job.proofUrl ? (
                  <SmartExternalLink href={job.proofUrl} linkTitle="Official posting proof" className="font-medium text-amber-700 underline dark:text-amber-400">
                    official posting proof
                  </SmartExternalLink>
                ) : job.company.website ? (
                  <SmartExternalLink href={job.company.website} linkTitle={`${job.company.name} - official website`} className="font-medium text-amber-700 underline dark:text-amber-400">
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
                <Button size="lg" className="bg-gradient-to-r from-sky-600 to-teal-600 font-semibold text-white shadow-sm hover:opacity-90" asChild>
                  <Link href={`/private-jobs/${job.slug}/apply`} onClick={() => trackClick("APPLY")}>
                    <ExternalLink className="mr-2 h-5 w-5" /> Apply Online
                  </Link>
                </Button>
              ) : job.applicationEmail ? (
                <Button size="lg" className="bg-gradient-to-r from-sky-600 to-teal-600 font-semibold text-white shadow-sm hover:opacity-90" asChild>
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
      <div className="sticky bottom-0 z-40 -mx-4 mt-4 border-t bg-white/95 backdrop-blur print:hidden lg:hidden dark:border-gray-700 dark:bg-gray-900/95">
        {progress !== null && !isClosed ? (
          <div className="h-1 w-full bg-gray-100 dark:bg-gray-800" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
            <div className={cn("h-full", progress > 85 ? "bg-red-500" : "bg-gradient-to-r from-sky-500 to-teal-600")} style={{ width: `${progress}%` }} />
          </div>
        ) : null}
        <div className="flex items-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{job.title}</p>
            <p className={cn(
              "flex items-center gap-1.5 text-sm font-bold",
              isClosed ? "text-red-600 dark:text-red-400" : isUrgent ? "text-red-600 dark:text-red-400" : "text-teal-700 dark:text-teal-400",
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
              <Button className="bg-gradient-to-r from-sky-600 to-teal-600 font-semibold text-white shadow-sm hover:opacity-90" asChild>
                <Link href={`/private-jobs/${job.slug}/apply`} onClick={() => trackClick("APPLY")}>
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Apply Now
                </Link>
              </Button>
            ) : job.applicationEmail ? (
              <Button className="bg-gradient-to-r from-sky-600 to-teal-600 font-semibold text-white shadow-sm hover:opacity-90" asChild>
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
