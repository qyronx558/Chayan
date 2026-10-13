"use client"

import {
  FileText, ExternalLink, Printer,
  CalendarCheck, CalendarDays, CalendarClock, CalendarPlus,
  Building2, Tag, Briefcase, Wallet, MapPin, School,
  GraduationCap, FileCheck2, Ticket, KeyRound, BookOpen,
  AlarmClock, ShieldCheck, ListChecks, Clock, BadgeCheck,
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDate, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { AshokaChakra } from "@/components/layout/AshokaChakra"
import { EntityViewTracker, type TrackedEntityType } from "@/components/analytics/EntityViewTracker"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { JobFollowBell } from "@/components/jobs/JobFollowBell"
import { DocumentInsightStrip, type PrimaryDateMode } from "@/components/documents/DocumentInsightStrip"
import { DocumentSideRail } from "@/components/documents/DocumentSideRail"
import { RichTextView } from "@/components/shared/RichTextView"
import { containsHtml } from "@/lib/blog-prose"
import { feeKpi, windowProgress } from "@/lib/job-insights"

type DocumentKind = "result" | "admit-card" | "answer-key" | "syllabus" | "admission"

interface DetailRow {
  label: string
  value: string | null
}

interface LinkRow {
  label: string
  value: string
  href: string
}

interface RelatedItem {
  href: string
  title: string
  department: string
  meta: string | null
}

interface DocumentDetailProps {
  kind: DocumentKind
  title: string
  department: string
  category?: string | null
  description?: string | null
  rows: DetailRow[]
  linkRows?: LinkRow[]
  list?: { label: string; items: string[] } | null
  downloadUrl?: string | null
  downloadLabel: string
  /** Fullscreen viewer route (e.g. `/result/[slug]/view`). Shown only when a download URL exists. */
  viewerHref?: string | null
  countdownDate?: string | null
  countdownLabel?: string
  bookmarkId?: { type: "result" | "admit-card"; id: string } | null
  bookmarkSyllabusId?: string | null
  application?: { type: "admission"; id: string } | null
  followJob?: { jobId: string } | null
  relatedTitle: string
  relatedItems: RelatedItem[]
  /** ISO date driving the insight + KPI strip (result/exam/last date). Genuine stored data only. */
  primaryDate?: string | null
  primaryDateLabel?: string
  primaryDateMode?: PrimaryDateMode
  /** ISO start of application window (admissions) - enables window progress. */
  windowStart?: string | null
  /** ISO publish timestamp for the verify card. */
  publishedAt?: string | null
  /** Entity attribution for the trending engine (fires enriched page-view). */
  tracking?: { entityType: TrackedEntityType; entityId: string } | null
}

const KIND_CONFIG: Record<DocumentKind, { badge: string; badgeClass: string; icon: typeof FileText; subtitle: string; listHref: string; listLabel: string }> = {
  result: { badge: "Result", badgeClass: "bg-emerald-400 text-emerald-950", icon: FileCheck2, subtitle: "Examination Outcome Notification", listHref: "/results", listLabel: "View all results" },
  "admit-card": { badge: "Admit Card", badgeClass: "bg-sky-400 text-sky-950", icon: Ticket, subtitle: "Examination Entry Pass", listHref: "/admit-cards", listLabel: "View all admit cards" },
  "answer-key": { badge: "Answer Key", badgeClass: "bg-violet-400 text-violet-950", icon: KeyRound, subtitle: "Answer Verification Document", listHref: "/answer-keys", listLabel: "View all answer keys" },
  syllabus: { badge: "Syllabus", badgeClass: "bg-orange-400 text-orange-950", icon: BookOpen, subtitle: "Preparation Blueprint", listHref: "/syllabus", listLabel: "View all syllabus" },
  admission: { badge: "Admission", badgeClass: "bg-rose-400 text-rose-950", icon: GraduationCap, subtitle: "Admission Notice & Application", listHref: "/admissions", listLabel: "View all admissions" },
}

const iconFor = (label: string) => {
  if (/result date/i.test(label)) return CalendarCheck
  if (/exam date/i.test(label)) return CalendarDays
  if (/start date|begin/i.test(label)) return CalendarPlus
  if (/last date|clos/i.test(label)) return CalendarClock
  if (/fee/i.test(label)) return Wallet
  if (/department/i.test(label)) return Building2
  if (/category/i.test(label)) return Tag
  if (/job|exam/i.test(label)) return Briefcase
  if (/location|state|post/i.test(label)) return MapPin
  if (/college|institut/i.test(label)) return School
  if (/course/i.test(label)) return GraduationCap
  return FileText
}

export function DocumentDetail({
  kind,
  title,
  department,
  category,
  description,
  rows,
  linkRows = [],
  list,
  downloadUrl,
  downloadLabel,
  viewerHref = null,
  countdownDate,
  countdownLabel,
  bookmarkId,
  bookmarkSyllabusId,
  application,
  followJob,
  relatedTitle,
  relatedItems,
  primaryDate = null,
  primaryDateLabel = "Key date",
  primaryDateMode = "date",
  windowStart = null,
  publishedAt = null,
  tracking = null,
}: DocumentDetailProps) {
  const config = KIND_CONFIG[kind]
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  const countdownMs = countdownDate ? new Date(countdownDate).getTime() : null
  const diff = countdownMs !== null ? countdownMs - now : null
  const daysLeft = diff !== null ? Math.floor(diff / 86400000) : null
  const hoursLeft = diff !== null ? Math.floor((diff % 86400000) / 3600000) : null
  const minsLeft = diff !== null ? Math.floor((diff % 3600000) / 60000) : null
  const isUrgent = diff !== null && diff > 0 && diff <= 7 * 86400000
  const isCountdownActive = diff !== null && diff > 0
  const barProgress = windowProgress(windowStart, countdownDate ?? null, now)

  const feeRow = rows.find((r) => /fee/i.test(r.label) && r.value)
  const statusRow = rows.find((r) => /status/i.test(r.label) && r.value)
  const feeShort = feeKpi(feeRow?.value)
  const topicsCount = list && list.items.length > 0 ? list.items.length : null

  // Hero KPI strip - at most 3 chips, all derived from stored data
  const heroKpis = [
    primaryDate ? { icon: CalendarClock, label: primaryDateLabel, value: formatDate(primaryDate), urgent: primaryDateMode === "countdown" && isUrgent } : null,
    feeShort ? { icon: Wallet, label: "Fee", value: feeShort } : null,
    topicsCount ? { icon: BookOpen, label: "Topics", value: `${topicsCount}` } : null,
    statusRow ? { icon: FileCheck2, label: "Status", value: statusRow.value as string } : null,
  ].filter((k): k is NonNullable<typeof k> => k !== null).slice(0, 3)

  const filledRows = rows.filter((r) => r.value)

  // When a fullscreen viewer route exists, every download button opens it -
  // no separate viewer button needed. The viewer itself links the official file.
  const viewerActive = Boolean(viewerHref && downloadUrl)

  const sections = [
    { id: "details", label: "Details", icon: ListChecks, show: filledRows.length > 0 || linkRows.length > 0 },
    { id: "subjects", label: list?.label || "Subjects", icon: BookOpen, show: Boolean(list && list.items.length > 0) },
    { id: "description", label: "About", icon: FileText, show: Boolean(description) },
  ].filter((s) => s.show)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const actionNodes = (
    <>
      {application && (
        <ApplicationTracker jobId={application.id} type="admission" variant="full" />
      )}
      {followJob && (
        <JobFollowBell jobId={followJob.jobId} />
      )}
      {bookmarkSyllabusId && (
        <BookmarkButton
          syllabusId={bookmarkSyllabusId}
          size="default"
          variant="outline"
          className="border-orange-300 bg-white/80 text-gray-700 hover:bg-orange-50 hover:text-orange-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        />
      )}
      {bookmarkId && (
        <BookmarkButton
          resultId={bookmarkId.type === "result" ? bookmarkId.id : undefined}
          admitCardId={bookmarkId.type === "admit-card" ? bookmarkId.id : undefined}
          size="default"
          variant="outline"
          className="border-orange-300 bg-white/80 text-gray-700 hover:bg-orange-50 hover:text-orange-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        />
      )}
    </>
  )

  return (
    <div className="space-y-6 [scroll-behavior:smooth]">
      {tracking ? (
        <EntityViewTracker entityType={tracking.entityType} entityId={tracking.entityId} />
      ) : null}
      {/* ── Header / Hero - Tricolour + KPI strip ─────── */}
      <header className="relative overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-r from-orange-50 via-white to-green-50 shadow-lg dark:border-gray-700 dark:from-[#231303] dark:via-gray-950 dark:to-[#071a0e]">
        {/* top tricolour strip with slow flow */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(to_right,#FF9933_0%,#FF9933_33.3%,#F8F8F8_33.3%,#F8F8F8_66.6%,#138808_66.6%,#138808_100%)]"
        >
          <div className="animate-flag-sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        </div>
        {/* light Ashoka Chakra watermark + flowing-air sheen */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 flex h-56 w-56 items-center justify-center">
          <AshokaChakra className="h-48 w-48 text-[#06038D]/10 dark:text-white/10" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-flag-sheen absolute inset-y-[-20%] left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
        </div>
        {/* bottom tricolour strip */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] bg-[linear-gradient(to_right,#FF9933_0%,#FF9933_33.3%,#F8F8F8_33.3%,#F8F8F8_66.6%,#138808_66.6%,#138808_100%)]"
        />

        <div className="relative p-6 pt-8 sm:p-8 sm:pt-9">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge className={cn("font-semibold", config.badgeClass)}>
              <config.icon className="mr-1 h-3 w-3" /> {config.badge}
            </Badge>
            <Badge className="border border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
              <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verified
            </Badge>
            {category && <Badge className="border border-gray-200 bg-white/80 text-gray-700 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">{category}</Badge>}
            {isUrgent && (
              <Badge className="bg-amber-400 font-bold text-amber-950 shadow-md ring-2 ring-amber-500/50">
                <AlarmClock className="mr-1 h-3.5 w-3.5" /> Closing Soon
              </Badge>
            )}
            {countdownMs !== null && !isCountdownActive && diff !== null && (
              <Badge className="bg-red-600 font-bold text-white shadow-md ring-2 ring-red-500/40">
                <Clock className="mr-1 h-3.5 w-3.5" /> Closed / Expired
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-[#1e3a5f] dark:text-gray-100">{department}</span>
            <span className="text-orange-500">•</span>
            <span className="text-gray-600 dark:text-gray-300">{config.subtitle}</span>
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2 print:hidden">
            {downloadUrl ? (
              <Button size="sm" className="bg-gradient-to-r from-[#FF9933] to-[#138808] font-semibold text-white shadow-sm hover:opacity-90" asChild>
                {viewerActive ? (
                  <Link href={viewerHref as string}>
                    <FileText className="mr-1.5 h-4 w-4" /> {downloadLabel}
                  </Link>
                ) : (
                  <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-1.5 h-4 w-4" /> {downloadLabel}
                  </a>
                )}
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="border-gray-300 bg-white/70 font-semibold text-gray-500" disabled>
                <FileText className="mr-1.5 h-4 w-4" /> {downloadLabel}
              </Button>
            )}
            {actionNodes}
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

      {/* ── Data-first insight strip ── */}
      <DocumentInsightStrip
        primaryDate={primaryDate}
        primaryDateLabel={primaryDateLabel}
        primaryDateMode={primaryDateMode}
        windowStart={windowStart}
        feeText={feeRow?.value}
        statusText={statusRow?.value ?? null}
        topicsCount={topicsCount}
        downloadUrl={downloadUrl}
        publishedAt={publishedAt}
      />

      {/* ── 2-column premium layout ── */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* ── Live Countdown ── */}
          {countdownMs !== null && !(diff !== null && diff <= 0) && (
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
                <AlarmClock className="h-6 w-6" /> Time Left - {countdownLabel}
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
                {countdownLabel}: <span className="font-bold">{formatDate(countdownDate!)}</span>
              </p>
            </div>
          )}

          {/* ── Quick Navigation ── */}
          {sections.length > 1 && (
            <nav aria-label="Document sections" className="flex gap-2 overflow-x-auto pb-1">
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

          {/* ── Details Table ── */}
          {(filledRows.length > 0 || linkRows.length > 0) && (
            <section id="details" className="scroll-mt-24">
              <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ListChecks className="h-5 w-5 text-orange-600" /> {config.badge} Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {filledRows.map((item, i) => {
                        const Icon = iconFor(item.label)
                        return (
                          <TableRow key={item.label} className={cn(i % 2 === 1 && "bg-gray-50/70 dark:bg-gray-800/40")}>
                            <TableCell className="w-44 font-medium text-gray-700 sm:w-56 dark:text-gray-300">
                              <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4 shrink-0 text-orange-500" /> {item.label}
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
                        )
                      })}
                      {linkRows.map((item) => (
                        <TableRow key={item.label} className="bg-gray-50/70 dark:bg-gray-800/40">
                          <TableCell className="w-44 font-medium text-gray-700 sm:w-56 dark:text-gray-300">
                            <span className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 shrink-0 text-orange-500" /> {item.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <a
                              href={item.href}
                              className="inline-flex items-center gap-1 font-medium text-green-700 hover:text-orange-600 dark:text-green-400 dark:hover:text-orange-300"
                            >
                              {item.value} <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>
          )}

          {/* ── Subjects / List ── */}
          {list && list.items.length > 0 && (
            <section id="subjects" className="scroll-mt-24">
              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-green-700" /> {list.label}
                    <Badge variant="secondary" className="ml-1 text-xs tabular-nums">{list.items.length} topics</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <ul className="space-y-2">
                    {list.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#FF9933] to-[#138808] text-[11px] font-bold text-white">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}

          {/* ── Description ── */}
          {description && (
            <section id="description" className="scroll-mt-24">
              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-orange-600" /> About this {config.badge}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RichTextView html={description} />
                </CardContent>
              </Card>
            </section>
          )}

          {/* ── Download CTA ── */}
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:border-amber-900 dark:from-amber-950/40 dark:to-orange-950/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-amber-900 dark:text-amber-300">
                  <FileText className="h-5 w-5 text-amber-600" /> {downloadLabel}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Get the official PDF from the latest notification. Click the button to open the file in the fullscreen viewer.
                </p>
              </div>
              {downloadUrl ? (
                <Button size="lg" className="bg-gradient-to-r from-[#FF9933] to-[#138808] font-semibold text-white shadow-sm hover:opacity-90" asChild>
                  {viewerActive ? (
                    <Link href={viewerHref as string}>
                      <FileText className="mr-2 h-5 w-5" /> {downloadLabel}
                    </Link>
                  ) : (
                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-5 w-5" /> {downloadLabel}
                    </a>
                  )}
                </Button>
              ) : (
                <Button size="lg" disabled className="bg-amber-100 font-semibold text-amber-700">
                  <FileText className="mr-2 h-5 w-5" /> Coming Soon
                </Button>
              )}
            </div>
          </div>

          {/* ── Trust / Verify Note ── */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold text-amber-800 dark:text-amber-300">Important Note</p>
              <p className="mt-0.5">
                This is not a government website. Always verify all details (dates, fee, eligibility) from the{" "}
                <span className="font-medium text-amber-700 dark:text-amber-400">official notification</span> on the
                department&apos;s website before taking any action. We only aggregate publicly available information.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky side rail */}
        <DocumentSideRail
          title={title}
          department={department}
          category={category}
          downloadUrl={downloadUrl}
          downloadLabel={downloadLabel}
          viewerHref={viewerActive ? viewerHref : null}
          linkRows={linkRows}
          publishedAt={publishedAt}
          sections={sections.map((s) => ({ id: s.id, label: s.label }))}
          actions={actionNodes}
        />
      </div>

      {/* ── Related ── */}
      {relatedItems.length > 0 && (
        <section className="scroll-mt-24">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">{relatedTitle}</h2>
            <Link href={config.listHref} className="shrink-0 text-sm font-semibold text-orange-700 hover:underline dark:text-orange-300">
              {config.listLabel} →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {relatedItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-orange-700 dark:hover:shadow-none"
              >
                <Badge variant="secondary" className="mb-2 text-xs">{item.department}</Badge>
                <h3 className="text-sm font-semibold leading-snug text-gray-900 group-hover:text-orange-700 dark:text-gray-100 dark:group-hover:text-orange-300">
                  {item.title}
                </h3>
                {item.meta && <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{item.meta}</p>}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Sticky Mobile Bar (never printed) ── */}
      <div className="sticky bottom-0 z-40 -mx-4 mt-4 border-t bg-white/95 backdrop-blur print:hidden lg:hidden dark:border-gray-700 dark:bg-gray-900/95">
        {barProgress !== null && isCountdownActive ? (
          <div className="h-1 w-full bg-gray-100 dark:bg-gray-800" role="progressbar" aria-valuenow={barProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
            <div className={cn("h-full", barProgress > 85 ? "bg-red-500" : "bg-gradient-to-r from-[#FF9933] to-[#138808]")} style={{ width: `${barProgress}%` }} />
          </div>
        ) : null}
        <div className="flex items-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
            <p className={cn(
              "flex items-center gap-1.5 text-sm font-bold",
              isUrgent ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400",
            )}>
              {isUrgent ? <AlarmClock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              {isCountdownActive && daysLeft !== null
                ? isUrgent
                  ? `${daysLeft} days left`
                  : `${daysLeft} days remaining`
                : downloadUrl
                  ? "Available for download"
                  : "Awaiting official release"}
            </p>
          </div>
          {downloadUrl ? (
            <Button className="bg-gradient-to-r from-[#FF9933] to-[#138808] font-semibold text-white shadow-sm hover:opacity-90" asChild>
              {viewerActive ? (
                <Link href={viewerHref as string}>
                  <FileText className="mr-1.5 h-4 w-4" /> {downloadLabel}
                </Link>
              ) : (
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-1.5 h-4 w-4" /> {downloadLabel}
                </a>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
