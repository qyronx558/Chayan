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
import { EntityViewTracker, type TrackedEntityType } from "@/components/analytics/EntityViewTracker"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { JobFollowBell } from "@/components/jobs/JobFollowBell"
import { DocumentInsightStrip, type PrimaryDateMode } from "@/components/documents/DocumentInsightStrip"
import { DocumentSideRail } from "@/components/documents/DocumentSideRail"
import { RichTextView } from "@/components/shared/RichTextView"
import { SmartExternalLink } from "@/components/shared/SmartExternalLink"
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
 result: { badge: "Result", badgeClass: "border border-rule bg-transparent text-muted-foreground", icon: FileCheck2, subtitle: "Examination Outcome Notification", listHref: "/results", listLabel: "View all results" },
 "admit-card": { badge: "Admit Card", badgeClass: "border border-rule bg-transparent text-muted-foreground", icon: Ticket, subtitle: "Examination Entry Pass", listHref: "/admit-cards", listLabel: "View all admit cards" },
 "answer-key": { badge: "Answer Key", badgeClass: "border border-rule bg-transparent text-muted-foreground", icon: KeyRound, subtitle: "Answer Verification Document", listHref: "/answer-keys", listLabel: "View all answer keys" },
 syllabus: { badge: "Syllabus", badgeClass: "border border-rule bg-transparent text-muted-foreground", icon: BookOpen, subtitle: "Preparation Blueprint", listHref: "/syllabus", listLabel: "View all syllabus" },
 admission: { badge: "Admission", badgeClass: "border border-rule bg-transparent text-muted-foreground", icon: GraduationCap, subtitle: "Admission Notice & Application", listHref: "/admissions", listLabel: "View all admissions" },
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
    />
   )}
   {bookmarkId && (
    <BookmarkButton
     resultId={bookmarkId.type === "result" ? bookmarkId.id : undefined}
     admitCardId={bookmarkId.type === "admit-card" ? bookmarkId.id : undefined}
     size="default"
     variant="outline"
    />
   )}
  </>
 )

 return (
  <div className="space-y-6 [scroll-behavior:smooth]">
   {tracking ? (
    <EntityViewTracker entityType={tracking.entityType} entityId={tracking.entityId} />
   ) : null}
   {/* ── Header / Masthead + KPI strip ─────── */}
   <header className="border-b-2 border-rule-2 pb-5">
    <div>
     <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <Badge className={cn("agate font-normal", config.badgeClass)}>
       <config.icon className="mr-1 h-3 w-3" /> {config.badge}
      </Badge>
      <span className="agate inline-flex items-center gap-1 text-xs text-muted-foreground">
       <BadgeCheck className="h-3.5 w-3.5" /> Verified
      </span>
      {category && <span className="agate text-xs text-muted-foreground">{category}</span>}
      {isUrgent && (
       <span className="agate inline-flex items-center gap-1 text-xs text-brick">
        <AlarmClock className="h-3.5 w-3.5" /> Closing Soon
       </span>
      )}
      {countdownMs !== null && !isCountdownActive && diff !== null && (
       <span className="agate inline-flex items-center gap-1 text-xs text-brick">
        <Clock className="h-3.5 w-3.5" /> Closed / Expired
       </span>
      )}
     </div>

     <h1 className="font-display text-[2rem] font-bold leading-[1.08] text-foreground sm:text-[2.6rem]">{title}</h1>
     <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <span className="font-medium text-foreground">{department}</span>
      <span className="agate text-xs text-muted-foreground">{config.subtitle}</span>
     </p>

     <div className="mt-5 flex flex-wrap items-center gap-2 print:hidden">
      {downloadUrl ? (
       <Button size="sm" className="font-medium" asChild>
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
       <Button size="sm" variant="outline" className="font-medium text-muted-foreground" disabled>
        <FileText className="mr-1.5 h-4 w-4" /> {downloadLabel}
       </Button>
      )}
      {actionNodes}
      <Button variant="outline" size="icon" onClick={() => window.print()} title="Print">
       <Printer className="h-4 w-4" />
      </Button>
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
        "flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-rule p-4",
        isUrgent && "border-brick bg-paper-2",
       )}
      >
       <span className={cn(
        "flex items-center gap-2 text-base font-semibold",
        isUrgent ? "text-brick" : "text-foreground",
       )}>
        <AlarmClock className="h-6 w-6" /> Time Left - {countdownLabel}
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
        {countdownLabel}: <span className="font-semibold text-foreground">{formatDate(countdownDate!)}</span>
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
         className="flex shrink-0 items-center gap-1.5 border border-rule px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick"
        >
         <s.icon className="h-3.5 w-3.5" /> {s.label}
        </button>
       ))}
      </nav>
     )}

     {/* ── Details Table ── */}
     {(filledRows.length > 0 || linkRows.length > 0) && (
      <section id="details" className="scroll-mt-24">
       <Card className="overflow-hidden border-rule">
        <CardHeader className="border-b border-rule bg-paper-2">
         <CardTitle className="flex items-center gap-2 font-display text-lg">
          <ListChecks className="h-5 w-5 text-muted-foreground" /> {config.badge} Details
         </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
         <Table>
          <TableBody>
           {filledRows.map((item) => {
            const Icon = iconFor(item.label)
            return (
             <TableRow key={item.label} className="border-rule">
              <TableCell className="w-44 font-medium text-muted-foreground sm:w-56">
               <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /> {item.label}
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
            <TableRow key={item.label} className="border-rule bg-paper-2">
             <TableCell className="w-44 font-medium text-muted-foreground sm:w-56">
              <span className="flex items-center gap-2">
               <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" /> {item.label}
              </span>
             </TableCell>
             <TableCell>
              <SmartExternalLink
               href={item.href}
               linkTitle={item.value}
               className="inline-flex items-center gap-1 font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2"
              >
               {item.value} <ExternalLink className="h-3.5 w-3.5" />
              </SmartExternalLink>
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
       <Card className="border-rule">
        <CardHeader className="border-b border-rule bg-paper-2">
         <CardTitle className="flex items-center gap-2 font-display text-lg">
          <BookOpen className="h-5 w-5 text-muted-foreground" /> {list.label}
          <Badge variant="outline" className="agate ml-1 border-rule font-normal text-muted-foreground">{list.items.length} topics</Badge>
         </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
         <ul className="space-y-2">
          {list.items.map((item, i) => (
           <li key={i} className="flex items-start gap-3 text-sm text-foreground">
            <span className="agate mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-ink text-[11px] text-paper">
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
       <Card className="border-rule">
        <CardHeader className="border-b border-rule bg-paper-2">
         <CardTitle className="flex items-center gap-2 font-display text-lg">
          <FileText className="h-5 w-5 text-muted-foreground" /> About this {config.badge}
         </CardTitle>
        </CardHeader>
        <CardContent>
         <RichTextView html={description} />
        </CardContent>
       </Card>
      </section>
     )}

     {/* ── Download CTA ── */}
     <div className="border-y border-rule bg-paper-2 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
       <div>
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
         <FileText className="h-5 w-5 text-muted-foreground" /> {downloadLabel}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
         Get the official PDF from the latest notification. Click the button to open the file in the fullscreen viewer.
        </p>
       </div>
       {downloadUrl ? (
        <Button size="lg" className="font-medium" asChild>
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
        <Button size="lg" disabled className="font-medium">
         <FileText className="mr-2 h-5 w-5" /> Coming Soon
        </Button>
       )}
      </div>
     </div>

     {/* ── Trust / Verify Note ── */}
     <div className="flex items-start gap-3 border-y border-rule bg-paper-2 p-4">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="text-sm text-muted-foreground">
       <p className="font-semibold text-foreground">Important Note</p>
       <p className="mt-0.5">
        This is not a government website. Always verify all details (dates, fee, eligibility) from the{" "}
        <span className="font-medium text-brick">official notification</span> on the
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
      <h2 className="flex items-center gap-2 font-display text-xl font-bold text-foreground">{relatedTitle}</h2>
      <Link href={config.listHref} className="shrink-0 text-sm font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2">
       {config.listLabel}
      </Link>
     </div>
     <div className="grid gap-4 sm:grid-cols-2">
      {relatedItems.map((item) => (
       <a
        key={item.href}
        href={item.href}
        className="group border-t border-rule p-5 transition-colors first:border-t-0"
       >
        <Badge variant="outline" className="agate mb-2 border-rule font-normal text-muted-foreground">{item.department}</Badge>
        <h3 className="text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-brick">
         {item.title}
        </h3>
        {item.meta && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.meta}</p>}
       </a>
      ))}
     </div>
    </section>
   )}

   {/* ── Sticky Mobile Bar (never printed) ── */}
   <div className="sticky bottom-0 z-40 -mx-4 mt-4 border-t border-rule bg-background print:hidden lg:hidden">
    {barProgress !== null && isCountdownActive ? (
     <div className="h-1 w-full bg-paper-3" role="progressbar" aria-valuenow={barProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
      <div className={cn("h-full", barProgress > 85 ? "bg-brick" : "bg-ink")} style={{ width: `${barProgress}%` }} />
     </div>
    ) : null}
    <div className="flex items-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
     <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      <p className={cn(
       "agate flex items-center gap-1.5 text-xs",
       isUrgent ? "text-brick" : "text-muted-foreground",
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
      <Button className="font-medium" asChild>
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
