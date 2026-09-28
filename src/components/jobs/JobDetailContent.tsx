"use client"

import {
  FileText, ExternalLink, Printer,
  Calendar, CalendarClock, CalendarPlus, Users, IndianRupee, MapPin,
  GraduationCap, Briefcase, Wallet, Hash, AlarmClock, ShieldCheck,
  ListChecks, ClipboardList, UserRound, Clock, BadgeCheck, Eye,
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDate, formatCompact, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { AshokaChakra } from "@/components/layout/AshokaChakra"
import { JobQuickSummary } from "@/components/jobs/JobQuickSummary"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { JobInsightDashboard } from "@/components/jobs/JobInsightDashboard"
import { JobTimeline } from "@/components/jobs/JobTimeline"
import { JobDocumentsChecklist } from "@/components/jobs/JobDocumentsChecklist"
import { JobSelectionStepper } from "@/components/jobs/JobSelectionStepper"
import { JobApplyRail } from "@/components/jobs/JobApplyRail"
import { RichTextView } from "@/components/shared/RichTextView"
import { containsHtml } from "@/lib/blog-prose"
import { feeKpi, stepify, windowProgress } from "@/lib/job-insights"

interface JobDetailContentProps {
  jobId: string
  title: string
  department: string
  departmentId: string
  advertisementNo: string | null
  totalVacancies: number | null
  salary: string | null
  location: string | null
  ageLimit: string | null
  ageRelaxation: string | null
  education: string | null
  selectionProcess: string | null
  applicationFee: string | null
  importantDates: Record<string, string> | null
  documentsRequired: string | null
  howToApply: string | null
  officialNotification: string | null
  officialWebsite: string | null
  applyLink: string | null
  experience: string | null
  startDate: string | null
  lastDate: string | null
  slug: string
  updatedAt?: string | null
  viewsTotal?: number | null
}

export function JobDetailContent({
  jobId,
  title,
  department,
  advertisementNo,
  totalVacancies,
  salary,
  location,
  ageLimit,
  ageRelaxation,
  education,
  selectionProcess,
  applicationFee,
  importantDates,
  documentsRequired,
  howToApply,
  officialNotification,
  officialWebsite,
  applyLink,
  experience,
  startDate,
  lastDate,
  slug,
  updatedAt = null,
  viewsTotal = null,
}: JobDetailContentProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  const dates: { label: string; date: string }[] = importantDates
    ? Object.entries(importantDates).map(([label, date]) => ({ label, date }))
    : []

  const lastDateMs = lastDate ? new Date(lastDate).getTime() : null
  const diff = lastDateMs ? lastDateMs - now : null
  const daysLeft = diff !== null ? Math.floor(diff / 86400000) : null
  const hoursLeft = diff !== null ? Math.floor((diff % 86400000) / 3600000) : null
  const minsLeft = diff !== null ? Math.floor((diff % 3600000) / 60000) : null
  const isUrgent = diff !== null && diff > 0 && diff <= 7 * 86400000
  const isClosed = diff !== null && diff <= 0
  const canApply = Boolean(applyLink || officialWebsite)
  const progress = windowProgress(startDate, lastDate, now)
  const feeShort = feeKpi(applicationFee)

  const heroKpis = [
    totalVacancies ? { icon: Users, label: "Vacancies", value: totalVacancies.toLocaleString("en-IN") } : null,
    lastDate ? { icon: CalendarClock, label: "Last date", value: formatDate(lastDate), urgent: isUrgent } : null,
    feeShort ? { icon: Wallet, label: "Fee", value: feeShort } : null,
  ].filter((k): k is NonNullable<typeof k> => k !== null)

  const details: { icon: typeof Hash; label: string; value: string | null }[] = [
    { icon: Hash, label: "Advertisement No", value: advertisementNo },
    { icon: Users, label: "Total Vacancies", value: totalVacancies ? totalVacancies.toLocaleString("en-IN") : null },
    { icon: IndianRupee, label: "Salary / Pay Scale", value: salary },
    { icon: MapPin, label: "Location", value: location },
    { icon: UserRound, label: "Age Limit", value: ageLimit },
    { icon: UserRound, label: "Age Relaxation", value: ageRelaxation },
    { icon: GraduationCap, label: "Education Qualification", value: education },
    { icon: Briefcase, label: "Experience", value: experience },
    { icon: Wallet, label: "Application Fee", value: applicationFee },
    { icon: CalendarPlus, label: "Application Begin", value: startDate ? formatDate(startDate) : null },
    { icon: CalendarClock, label: "Last Date to Apply", value: lastDate ? formatDate(lastDate) : null },
  ].filter((item) => item.value)

  const sections = [
    { id: "job-details", label: "Vacancy Details", icon: ClipboardList, show: details.length > 0 },
    { id: "important-dates", label: "Important Dates", icon: Calendar, show: dates.length > 0 },
    {
      id: "eligibility", label: "Eligibility", icon: GraduationCap,
      show: Boolean(education || ageLimit || experience || selectionProcess),
    },
    { id: "fees", label: "Application Fees", icon: Wallet, show: Boolean(applicationFee) },
    { id: "documents", label: "Documents", icon: ListChecks, show: Boolean(documentsRequired) },
    { id: "how-to-apply", label: "How to Apply", icon: FileText, show: Boolean(howToApply) },
  ].filter((s) => s.show)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const howSteps = stepify(howToApply)

  return (
    <div className="space-y-6 [scroll-behavior:smooth]">
      {/* ── Header / Hero - Tricolour + KPI strip ─────── */}
      <header className="relative overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-r from-orange-50 via-white to-green-50 shadow-lg dark:border-gray-700 dark:from-[#231303] dark:via-gray-950 dark:to-[#071a0e]">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(to_right,#FF9933_0%,#FF9933_33.3%,#F8F8F8_33.3%,#F8F8F8_66.6%,#138808_66.6%,#138808_100%)]"
        >
          <div className="animate-flag-sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 flex h-56 w-56 items-center justify-center">
          <AshokaChakra className="h-48 w-48 text-[#06038D]/10 dark:text-white/10" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-flag-sheen absolute inset-y-[-20%] left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] bg-[linear-gradient(to_right,#FF9933_0%,#FF9933_33.3%,#F8F8F8_33.3%,#F8F8F8_66.6%,#138808_66.6%,#138808_100%)]"
        />

        <div className="relative p-6 pt-8 sm:p-8 sm:pt-9">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {advertisementNo && (
              <Badge className="border border-gray-200 bg-white/80 text-gray-700 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">Advt No: {advertisementNo}</Badge>
            )}
            <Badge className="border border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
              <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verified
            </Badge>
            {isUrgent && (
              <Badge className="bg-amber-400 font-bold text-amber-950 shadow-md ring-2 ring-amber-500/50">
                <AlarmClock className="mr-1 h-3.5 w-3.5" /> Closing Soon
              </Badge>
            )}
            {isClosed && (
              <Badge className="bg-red-600 font-bold text-white shadow-md ring-2 ring-red-500/40">
                <Clock className="mr-1 h-3.5 w-3.5" /> Closed
              </Badge>
            )}
            {totalVacancies ? (
              <Badge className="border border-gray-200 bg-white/80 text-gray-700 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">{totalVacancies.toLocaleString("en-IN")} Vacancies</Badge>
            ) : null}
          </div>

          <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-[#1e3a5f] dark:text-gray-100">{department}</span>
            {location && (
              <>
                <span className="text-orange-500">•</span>
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300"><MapPin className="h-4 w-4" />{location}</span>
              </>
            )}
            {viewsTotal !== null && viewsTotal > 0 ? (
              <>
                <span className="text-orange-500">•</span>
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><Eye className="h-4 w-4" />{formatCompact(viewsTotal)} views</span>
              </>
            ) : null}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2 print:hidden">
            {canApply ? (
              <Button size="sm" className="bg-gradient-to-r from-[#FF9933] to-[#138808] font-semibold text-white shadow-sm hover:opacity-90" asChild>
                <Link href={`/apply/${slug}/start`}>
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Apply Now
                </Link>
              </Button>
            ) : null}
            <ApplicationTracker jobId={jobId} variant="full" />
            <BookmarkButton jobId={jobId} size="default" variant="outline" className="border-orange-300 bg-white/80 text-gray-700 hover:bg-orange-50 hover:text-orange-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200" />
            <Button variant="outline" size="icon" className="border-gray-300 bg-white/80 text-gray-600 hover:bg-orange-50 hover:text-orange-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300" onClick={() => window.print()} title="Print">
              <Printer className="h-4 w-4" />
            </Button>
          </div>

          {/* KPI strip - 30-second scan */}
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
                    k.urgent ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
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

      {/* ── Data-first insight dashboard (graphs + snapshot) ── */}
      <JobInsightDashboard
        totalVacancies={totalVacancies}
        salary={salary}
        applicationFee={applicationFee}
        ageLimit={ageLimit}
        education={education}
        startDate={startDate}
        lastDate={lastDate}
      />

      {/* ── 2-column premium layout ── */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* ── Live Countdown ── */}
          {lastDateMs && !isClosed && (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border-2 border-l-8 p-4 shadow-md",
                isUrgent
                  ? "border-red-300 border-l-red-600 bg-red-50 dark:border-red-800 dark:border-l-red-500 dark:bg-red-950/60"
                  : "border-orange-300 border-l-[#FF9933] bg-gradient-to-r from-orange-50 via-white to-green-50 dark:border-gray-600 dark:from-[#231303] dark:via-gray-900 dark:to-[#071a0e]",
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
                    isUrgent ? "bg-white ring-red-300 dark:bg-red-900 dark:ring-red-700" : "bg-white ring-orange-200 dark:bg-gray-800 dark:ring-gray-600",
                  )}>
                    <div className={cn("text-xl font-extrabold leading-none tabular-nums", isUrgent ? "text-red-700 dark:text-red-300" : "text-green-800 dark:text-green-300")}>
                      {t.value !== null ? t.value : 0}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t.unit}</div>
                  </div>
                ))}
              </div>
              <p className="ml-auto text-sm font-medium text-gray-700 dark:text-gray-200">
                Final date: <span className="font-bold">{formatDate(lastDate!)}</span>
              </p>
            </div>
          )}

          {/* ── Quick Navigation pills ── */}
          {sections.length > 1 && (
            <nav aria-label="Job sections" className="flex gap-2 overflow-x-auto pb-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-orange-700 dark:hover:bg-orange-950 dark:hover:text-orange-300"
                >
                  <s.icon className="h-3.5 w-3.5" /> {s.label}
                </button>
              ))}
            </nav>
          )}

          {/* ── 2-min TL;DR summary (share lives here only - deduped) ── */}
          <JobQuickSummary
            title={title}
            department={department}
            slug={slug}
            totalVacancies={totalVacancies}
            lastDate={lastDate}
            applicationFee={applicationFee}
            ageLimit={ageLimit}
            education={education}
          />

          {/* ── Job Details Table ── */}
          {details.length > 0 && (
            <section id="job-details" className="scroll-mt-24">
              <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5 text-orange-600" /> Vacancy Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {details.map((item, i) => (
                        <TableRow key={item.label} className={cn(i % 2 === 1 && "bg-gray-50/70 dark:bg-gray-800/40")}>
                          <TableCell className="w-44 font-medium text-gray-700 sm:w-56 dark:text-gray-300">
                            <span className="flex items-center gap-2">
                              <item.icon className="h-4 w-4 shrink-0 text-orange-500" /> {item.label}
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

          {/* ── Important Dates: visual timeline + table ── */}
          {dates.length > 0 && (
            <section id="important-dates" className="scroll-mt-24">
              <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-orange-600" /> Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-4 sm:p-6">
                  <JobTimeline importantDates={importantDates} startDate={startDate} lastDate={lastDate} />
                  <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                    <Table>
                      <TableBody>
                        {dates.map((d, i) => {
                          const isKeyDate = /begin|start|last|clos/i.test(d.label)
                          return (
                            <TableRow key={d.label} className={cn(i % 2 === 1 && "bg-gray-50/70 dark:bg-gray-800/40")}>
                              <TableCell className="w-10 text-center">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
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

          {/* ── Eligibility + visual selection stepper ── */}
          {(education || ageLimit || experience || selectionProcess) && (
            <section id="eligibility" className="scroll-mt-24">
              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <GraduationCap className="h-5 w-5 text-orange-600" /> Eligibility Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-4 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    {education && !containsHtml(education) && (
                      <Badge variant="secondary" className="bg-orange-50 text-xs text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                        <GraduationCap className="mr-1 h-3 w-3" /> {education}
                      </Badge>
                    )}
                    {ageLimit && (
                      <Badge variant="secondary" className="bg-green-50 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                        <UserRound className="mr-1 h-3 w-3" /> Age: {ageLimit}
                      </Badge>
                    )}
                    {experience && (
                      <Badge variant="secondary" className="bg-purple-50 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        <Briefcase className="mr-1 h-3 w-3" /> {experience}
                      </Badge>
                    )}
                  </div>
                  {education && containsHtml(education) && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Education Qualification
                      </p>
                      <RichTextView html={education} />
                    </div>
                  )}
                  {ageRelaxation && (
                    <div>
                      <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Age Relaxation</p>
                      <RichTextView html={ageRelaxation} className="text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                  {selectionProcess && (
                    <div>
                      <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Selection Process</p>
                      <JobSelectionStepper selectionProcess={selectionProcess} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* ── Application Fees (full text; chart lives in dashboard) ── */}
          {applicationFee && (
            <section id="fees" className="scroll-mt-24">
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-amber-800 dark:text-amber-300">
                    <Wallet className="h-5 w-5 text-amber-600" /> Application Fee
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RichTextView html={applicationFee} />
                  <p className="mt-2 text-[11px] text-amber-700/80 dark:text-amber-400/80">Category-wise comparison chart shown in the insights panel above (when parseable).</p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* ── Documents Required: interactive checklist ── */}
          {documentsRequired && (
            <section id="documents" className="scroll-mt-24">
              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ListChecks className="h-5 w-5 text-orange-600" /> Documents Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <JobDocumentsChecklist key={jobId} jobId={jobId} documentsRequired={documentsRequired} />
                </CardContent>
              </Card>
            </section>
          )}

          {/* ── How to Apply: vertical timeline + mid CTA ── */}
          {howToApply && (
            <section id="how-to-apply" className="scroll-mt-24">
              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-orange-600" /> How to Apply
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {containsHtml(howToApply) ? (
                    <RichTextView html={howToApply} />
                  ) : howSteps.length > 1 ? (
                    <div>
                      <ol className="relative space-y-4 border-l-2 border-orange-200 pl-6 dark:border-orange-900">
                        {howSteps.map((step, i) => (
                          <li key={i} className="relative">
                            <span className="absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#FF9933] to-[#138808] text-xs font-bold text-white shadow">
                              {i + 1}
                            </span>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">{step}</p>
                          </li>
                        ))}
                      </ol>
                      {canApply && !isClosed ? (
                        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-gradient-to-r from-orange-50 to-green-50 p-4 dark:from-orange-950/40 dark:to-green-950/40">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Ready with documents? Don&apos;t wait for the last date.</p>
                          <Button className="bg-gradient-to-r from-[#FF9933] to-[#138808] font-semibold text-white hover:opacity-90" asChild>
                            <Link href={`/apply/${slug}/start`}>
                              <ExternalLink className="mr-2 h-4 w-4" /> Apply Online Now
                            </Link>
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{howToApply}</div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* ── Trust / Verify Note ── */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold text-amber-800 dark:text-amber-300">Important Note</p>
              <p className="mt-0.5">
                This is not a government website. Always verify all details (fees, dates, eligibility) from the{" "}
                <a href={officialWebsite || "#"} target="_blank" rel="noopener noreferrer" className="font-medium text-amber-700 underline dark:text-amber-400">
                  official notification
                </a>{" "}
                before applying. We recommend applying only through the official website.
              </p>
            </div>
          </div>

          {/* ── Bottom Actions (3rd Apply CTA) ── */}
          <div className="flex flex-wrap gap-3 pt-2">
            {officialNotification && (
              <Button variant="outline" size="lg" asChild>
                <a href={officialNotification} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-5 w-5" /> Download Official Notification
                </a>
              </Button>
            )}
            {canApply ? (
              <Button size="lg" className="bg-gradient-to-r from-[#FF9933] to-[#138808] font-semibold text-white shadow-sm hover:opacity-90" asChild>
                <Link href={`/apply/${slug}/start`}>
                  <ExternalLink className="mr-2 h-5 w-5" /> Apply Online
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        {/* Sticky conversion rail */}
        <JobApplyRail
          jobId={jobId}
          slug={slug}
          title={title}
          department={department}
          advertisementNo={advertisementNo}
          officialNotification={officialNotification}
          officialWebsite={officialWebsite}
          applyLink={applyLink}
          updatedAt={updatedAt}
          viewsTotal={viewsTotal}
          lastDate={lastDate}
          sections={sections.map((s) => ({ id: s.id, label: s.label }))}
        />
      </div>

      {/* ── Sticky Mobile Apply Bar with window progress (never printed) ── */}
      <div className="sticky bottom-0 z-40 -mx-4 mt-4 border-t bg-white/95 backdrop-blur print:hidden lg:hidden dark:border-gray-700 dark:bg-gray-900/95">
        {progress !== null && !isClosed ? (
          <div className="h-1 w-full bg-gray-100 dark:bg-gray-800" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
            <div className={cn("h-full", progress > 85 ? "bg-red-500" : "bg-gradient-to-r from-[#FF9933] to-[#138808]")} style={{ width: `${progress}%` }} />
          </div>
        ) : null}
        <div className="flex items-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
            <p className={cn(
              "flex items-center gap-1.5 text-sm font-bold",
              isClosed ? "text-red-600 dark:text-red-400" : isUrgent ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400",
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
            <Button className="bg-gradient-to-r from-[#FF9933] to-[#138808] font-semibold text-white shadow-sm hover:opacity-90" asChild>
              <Link href={`/apply/${slug}/start`}>
                <ExternalLink className="mr-1.5 h-4 w-4" /> Apply Now
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
