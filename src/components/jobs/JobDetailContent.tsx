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
import { JobQuickSummary } from "@/components/jobs/JobQuickSummary"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { JobInsightDashboard } from "@/components/jobs/JobInsightDashboard"
import { JobTimeline } from "@/components/jobs/JobTimeline"
import { JobDocumentsChecklist } from "@/components/jobs/JobDocumentsChecklist"
import { JobSelectionStepper } from "@/components/jobs/JobSelectionStepper"
import { JobApplyRail } from "@/components/jobs/JobApplyRail"
import { RichTextView } from "@/components/shared/RichTextView"
import { SmartExternalLink } from "@/components/shared/SmartExternalLink"
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
   {/* ── Header / Masthead + KPI strip ─────── */}
   <header className="border-b-2 border-rule-2 pb-5">
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
     {advertisementNo && (
      <span className="agate text-xs text-muted-foreground">Advt No: {advertisementNo}</span>
     )}
     <span className="agate inline-flex items-center gap-1 text-xs text-muted-foreground">
      <BadgeCheck className="h-3.5 w-3.5" /> Verified
     </span>
     {isUrgent && (
      <span className="agate inline-flex items-center gap-1 text-xs text-brick">
       <AlarmClock className="h-3.5 w-3.5" /> Closing Soon
      </span>
     )}
     {isClosed && (
      <span className="agate inline-flex items-center gap-1 text-xs text-brick">
       <Clock className="h-3.5 w-3.5" /> Closed
      </span>
     )}
     {totalVacancies ? (
      <span className="agate text-xs text-muted-foreground">{totalVacancies.toLocaleString("en-IN")} Vacancies</span>
     ) : null}
    </div>

    <h1 className="font-display text-[2rem] font-bold leading-[1.08] text-foreground sm:text-[2.6rem]">{title}</h1>
    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
     <span className="font-medium text-foreground">{department}</span>
     {location && (
      <span className="agate flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-4 w-4" />{location}</span>
     )}
     {viewsTotal !== null && viewsTotal > 0 ? (
      <span className="agate flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-4 w-4" />{formatCompact(viewsTotal)} views</span>
     ) : null}
    </p>

    <div className="mt-5 flex flex-wrap items-center gap-2 print:hidden">
     {canApply ? (
      <Button size="sm" className="font-medium" asChild>
       <Link href={`/apply/${slug}/start`}>
        <ExternalLink className="mr-1.5 h-4 w-4" /> Apply Now
       </Link>
      </Button>
     ) : null}
     <ApplicationTracker jobId={jobId} variant="full" />
     <BookmarkButton jobId={jobId} size="default" variant="outline" />
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
        Final date: <span className="font-semibold text-foreground">{formatDate(lastDate!)}</span>
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
         className="flex shrink-0 items-center gap-1.5 border border-rule px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick"
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
       <Card className="overflow-hidden border-rule">
        <CardHeader className="border-b border-rule bg-paper-2">
         <CardTitle className="flex items-center gap-2 font-display text-lg">
          <ClipboardList className="h-5 w-5 text-muted-foreground" /> Vacancy Details
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

     {/* ── Important Dates: visual timeline + table ── */}
     {dates.length > 0 && (
      <section id="important-dates" className="scroll-mt-24">
       <Card className="overflow-hidden border-rule">
        <CardHeader className="border-b border-rule bg-paper-2">
         <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Calendar className="h-5 w-5 text-muted-foreground" /> Important Dates
         </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-4 sm:p-6">
         <JobTimeline importantDates={importantDates} startDate={startDate} lastDate={lastDate} />
         <div className="overflow-hidden border border-rule">
          <Table>
           <TableBody>
            {dates.map((d, i) => {
             const isKeyDate = /begin|start|last|clos/i.test(d.label)
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

     {/* ── Eligibility + visual selection stepper ── */}
     {(education || ageLimit || experience || selectionProcess) && (
      <section id="eligibility" className="scroll-mt-24">
       <Card className="border-rule">
        <CardHeader className="border-b border-rule bg-paper-2">
         <CardTitle className="flex items-center gap-2 font-display text-lg">
          <GraduationCap className="h-5 w-5 text-muted-foreground" /> Eligibility Criteria
         </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-4 sm:p-6">
         <div className="flex flex-wrap gap-2">
          {education && !containsHtml(education) && (
           <Badge variant="outline" className="agate border-rule font-normal text-muted-foreground">
            <GraduationCap className="mr-1 h-3 w-3" /> {education}
           </Badge>
          )}
          {ageLimit && (
           <Badge variant="outline" className="agate border-rule font-normal text-muted-foreground">
            <UserRound className="mr-1 h-3 w-3" /> Age: {ageLimit}
           </Badge>
          )}
          {experience && (
           <Badge variant="outline" className="agate border-rule font-normal text-muted-foreground">
            <Briefcase className="mr-1 h-3 w-3" /> {experience}
           </Badge>
          )}
         </div>
         {education && containsHtml(education) && (
          <div>
           <p className="mb-2 text-sm font-semibold text-foreground">
            Education Qualification
           </p>
           <RichTextView html={education} />
          </div>
         )}
         {ageRelaxation && (
          <div>
           <p className="mb-1 text-sm font-semibold text-foreground">Age Relaxation</p>
           <RichTextView html={ageRelaxation} className="text-muted-foreground" />
          </div>
         )}
         {selectionProcess && (
          <div>
           <p className="mb-3 text-sm font-semibold text-foreground">Selection Process</p>
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
       <Card className="border-rule bg-paper-2">
        <CardHeader>
         <CardTitle className="flex items-center gap-2 font-display text-lg text-foreground">
          <Wallet className="h-5 w-5 text-muted-foreground" /> Application Fee
         </CardTitle>
        </CardHeader>
        <CardContent>
         <RichTextView html={applicationFee} />
         <p className="agate mt-2 text-[11px] text-muted-foreground">Category-wise comparison chart shown in the insights panel above (when parseable).</p>
        </CardContent>
       </Card>
      </section>
     )}

     {/* ── Documents Required: interactive checklist ── */}
     {documentsRequired && (
      <section id="documents" className="scroll-mt-24">
       <Card className="border-rule">
        <CardHeader className="border-b border-rule bg-paper-2">
         <CardTitle className="flex items-center gap-2 font-display text-lg">
          <ListChecks className="h-5 w-5 text-muted-foreground" /> Documents Required
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
       <Card className="border-rule">
        <CardHeader className="border-b border-rule bg-paper-2">
         <CardTitle className="flex items-center gap-2 font-display text-lg">
          <FileText className="h-5 w-5 text-muted-foreground" /> How to Apply
         </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
         {containsHtml(howToApply) ? (
          <RichTextView html={howToApply} />
         ) : howSteps.length > 1 ? (
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
             <p className="text-sm font-semibold text-foreground">Ready with documents? Don&apos;t wait for the last date.</p>
             <Button className="font-medium" asChild>
              <Link href={`/apply/${slug}/start`}>
               <ExternalLink className="mr-2 h-4 w-4" /> Apply Online Now
              </Link>
             </Button>
            </div>
           ) : null}
          </div>
         ) : (
          <div className="whitespace-pre-line text-sm text-foreground">{howToApply}</div>
         )}
        </CardContent>
       </Card>
      </section>
     )}

     {/* ── Trust / Verify Note ── */}
     <div className="flex items-start gap-3 border-y border-rule bg-paper-2 p-4">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="text-sm text-muted-foreground">
       <p className="font-semibold text-foreground">Important Note</p>
       <p className="mt-0.5">
        This is not a government website. Always verify all details (fees, dates, eligibility) from the{" "}
        {officialWebsite ? (
         <SmartExternalLink href={officialWebsite} linkTitle={`${title} - official notification`} className="font-medium text-brick underline">
          official notification
         </SmartExternalLink>
        ) : (
         <span className="font-medium text-brick">official notification</span>
        )}{" "}
        before applying. We recommend applying only through the official website.
       </p>
      </div>
     </div>

     {/* ── Bottom Actions (3rd Apply CTA) ── */}
     <div className="flex flex-wrap gap-3 pt-2">
      {officialNotification && (
       <Button variant="outline" size="lg" asChild>
        <SmartExternalLink href={officialNotification} linkTitle={`${title} - official notification`}>
         <FileText className="mr-2 h-5 w-5" /> Download Official Notification
        </SmartExternalLink>
       </Button>
      )}
      {canApply ? (
       <Button size="lg" className="font-medium" asChild>
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
   <div className="sticky bottom-0 z-40 -mx-4 mt-4 border-t border-rule bg-background print:hidden lg:hidden">
    {progress !== null && !isClosed ? (
     <div className="h-1 w-full bg-paper-3" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
      <div className={cn("h-full", progress > 85 ? "bg-brick" : "bg-ink")} style={{ width: `${progress}%` }} />
     </div>
    ) : null}
    <div className="flex items-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
     <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
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
      <Button className="font-medium" asChild>
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
