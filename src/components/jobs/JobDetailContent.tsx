"use client"

import { useMemo, useState, useEffect, type ReactNode } from "react"
import Link from "next/link"
import {
 Briefcase, CalendarClock, CalendarDays, Check, ClipboardList, ExternalLink, FileText,
 GraduationCap, IndianRupee, ListChecks, MapPin, Route, UserRound, Users, Wallet, Hash,
 type LucideIcon,
} from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { JobDocumentsChecklist } from "@/components/jobs/JobDocumentsChecklist"
import { JobSelectionStepper } from "@/components/jobs/JobSelectionStepper"
import { DocumentJourney } from "@/components/documents/DocumentJourney"
import type { JourneyStage } from "@/lib/doc-journey"
import { JobApplyRail } from "@/components/jobs/JobApplyRail"
import { RichTextView } from "@/components/shared/RichTextView"
import { useActiveSection } from "@/components/shared/useActiveSection"
import { containsHtml, stripHtmlToText } from "@/lib/blog-prose"
import {
 buildDateRows, feeKpi, formatRupees, getDeadline, parseFeeBars, shortFact, stepify,
} from "@/lib/job-insights"

interface JobDetailContentProps {
 jobId: string
 title: string
 department: string
 departmentId: string
 category: { id: string; name: string }
 state: { id: string; name: string } | null
 status: string
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
 journey?: JourneyStage[] | null
}

/* ── Small layout primitives ─────────────────────────────── */

function Section({ id, icon: Icon, title, hint, children }: {
 id: string
 icon: LucideIcon
 title: string
 hint?: string
 children: ReactNode
}) {
 return (
  <section id={id} className="scroll-mt-32 border border-rule bg-card">
   <header className="flex items-center gap-3 border-b border-rule px-4 py-3 sm:px-5">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-ink text-paper">
     <Icon className="h-4 w-4" />
    </span>
    <h2 className="font-display text-lg font-bold leading-none text-foreground">{title}</h2>
    {hint ? <span className="agate ml-auto hidden text-[11px] text-muted-foreground sm:block">{hint}</span> : null}
   </header>
   <div className="p-4 sm:p-5">{children}</div>
  </section>
 )
}

function Chip({ href, children }: { href: string; children: ReactNode }) {
 return (
  <Link
   href={href}
   className="agate border border-rule px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-brick hover:text-brick"
  >
   {children}
  </Link>
 )
}

export function JobDetailContent({
 jobId, title, department, departmentId, category, state, status,
 advertisementNo, totalVacancies, salary, location, ageLimit, ageRelaxation, education,
 selectionProcess, applicationFee, importantDates, documentsRequired, howToApply,
 officialNotification, officialWebsite, applyLink, experience, startDate, lastDate,
 slug, updatedAt = null, viewsTotal = null, journey = null,
}: JobDetailContentProps) {
 const [now, setNow] = useState(() => Date.now())
 useEffect(() => {
  const t = setInterval(() => setNow(Date.now()), 60000)
  return () => clearInterval(t)
 }, [])

 const deadline = getDeadline(startDate, lastDate, status, now)
 const closed = deadline.state === "closed"
 const urgent = deadline.state === "urgent"
 const canApply = Boolean(applyLink || officialWebsite)

 /* ── Where does each field live? Short -> fact tile. Long -> its section. Never both. ── */
 const salaryTile = shortFact(salary, 30)
 const ageTile = shortFact(ageLimit, 26)
 const eduTile = shortFact(education, 36)
 const feeBars = useMemo(() => parseFeeBars(applicationFee), [applicationFee])
 const feeFlat = shortFact(applicationFee, 30)
 const feeTile = feeBars.length >= 2 ? feeKpi(applicationFee) : feeFlat
 const feeNeedsSection = Boolean(applicationFee) && !feeFlat

 const facts = [
  totalVacancies
   ? { icon: Users, label: "Vacancies", value: totalVacancies.toLocaleString("en-IN") }
   : null,
  lastDate
   ? { icon: CalendarClock, label: "Last date", value: formatDate(lastDate), sub: deadline.label, hot: urgent }
   : null,
  salaryTile ? { icon: IndianRupee, label: "Salary", value: salaryTile } : null,
  eduTile ? { icon: GraduationCap, label: "Qualification", value: eduTile } : null,
  ageTile ? { icon: UserRound, label: "Age limit", value: ageTile } : null,
  feeTile ? { icon: Wallet, label: "Fee", value: feeTile } : null,
 ].filter((f): f is NonNullable<typeof f> => f !== null)

 /* Eligibility: only what is NOT already a tile */
 const eligibility: { label: string; icon: LucideIcon; html: string }[] = [
  !eduTile && education ? { label: "Qualification", icon: GraduationCap, html: education } : null,
  !ageTile && ageLimit ? { label: "Age limit", icon: UserRound, html: ageLimit } : null,
  ageRelaxation ? { label: "Age relaxation", icon: UserRound, html: ageRelaxation } : null,
  experience ? { label: "Experience", icon: Briefcase, html: experience } : null,
  !salaryTile && salary ? { label: "Salary / pay scale", icon: IndianRupee, html: salary } : null,
 ].filter((x): x is NonNullable<typeof x> => x !== null)

 const dateRows = buildDateRows(importantDates, startDate, lastDate)
 const showDates = dateRows.length >= 2
 const howSteps = stepify(howToApply)

 const sections = [
  { id: "journey", label: "Journey", show: Boolean(journey) },
  { id: "dates", label: "Dates", show: showDates },
  { id: "eligibility", label: "Eligibility", show: eligibility.length > 0 },
  { id: "selection", label: "Selection", show: Boolean(selectionProcess) },
  { id: "fee", label: "Fee", show: feeNeedsSection },
  { id: "documents", label: "Documents", show: Boolean(documentsRequired) },
  { id: "how-to-apply", label: "How to apply", show: Boolean(howToApply) },
 ].filter((s) => s.show)

 const active = useActiveSection(sections.map((s) => s.id))
 const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

 const pill =
  closed ? { text: "Closed", cls: "border-rule-2 text-muted-foreground" }
  : urgent ? { text: "Closing soon", cls: "border-brick bg-brick text-brick-ink" }
  : deadline.state === "upcoming" ? { text: "Upcoming", cls: "border-ink text-foreground" }
  : { text: "Open", cls: "border-ink text-foreground" }

 return (
  <div className="grid items-start gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_340px]">
   {/* ═════════ MAIN COLUMN ═════════ */}
   <div className="min-w-0 space-y-6">
    {/* ── Hero ── */}
    <header>
     <div className="flex flex-wrap items-center gap-1.5">
      <span className={cn("agate inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] uppercase tracking-wider", pill.cls)}>
       <span className={cn("h-1.5 w-1.5 rounded-full bg-current", urgent && "animate-pulse")} /> {pill.text}
      </span>
      <Chip href={`/jobs?categoryId=${category.id}`}>{category.name}</Chip>
      {state ? <Chip href={`/jobs?stateId=${state.id}`}>{state.name}</Chip> : null}
     </div>

     <h1 className="mt-3 font-display text-[1.9rem] font-bold leading-[1.1] text-foreground sm:text-[2.5rem]">{title}</h1>

     <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
      <Link href={`/jobs?departmentId=${departmentId}`} className="font-semibold text-foreground underline-offset-4 hover:text-brick hover:underline">
       {department}
      </Link>
      {location ? (
       <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{location}</span>
      ) : null}
      {advertisementNo ? (
       <span className="agate inline-flex items-center gap-1.5 text-xs"><Hash className="h-3.5 w-3.5" />{/^\s*(advt|advertisement)/i.test(advertisementNo) ? advertisementNo : `Advt ${advertisementNo}`}</span>
      ) : null}
     </p>

     {/* Mobile/tablet only: desktop gets these in the sticky rail */}
     <div className="mt-4 flex items-center gap-2 lg:hidden print:hidden">
      <ApplicationTracker jobId={jobId} variant="full" />
      <BookmarkButton jobId={jobId} size="default" variant="outline" />
     </div>
    </header>

    {/* ── Key facts: the 10-second scan. Each value appears here once. ── */}
    {facts.length > 0 ? (
     <dl className={cn("grid grid-cols-2 border-b border-r border-rule bg-card", facts.length === 4 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
      {facts.map((f) => (
       <div key={f.label} className="min-w-0 border-l border-t border-rule px-4 py-3.5">
        <dt className="agate flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
         <f.icon className="h-3.5 w-3.5" /> {f.label}
        </dt>
        <dd className={cn("mt-1.5 font-display text-xl font-bold leading-tight tabular-nums sm:text-2xl", "hot" in f && f.hot ? "text-brick" : "text-foreground")}>
         {f.value}
        </dd>
        {"sub" in f && f.sub ? (
         <p className={cn("agate mt-0.5 text-xs", "hot" in f && f.hot ? "font-semibold text-brick" : "text-muted-foreground")}>{f.sub}</p>
        ) : null}
       </div>
      ))}
     </dl>
    ) : null}

    {/* ── Sticky section nav ── */}
    {sections.length > 2 ? (
     <nav
      aria-label="Job sections"
      className="sticky top-[65px] z-30 -mx-4 border-b border-rule bg-background/95 px-4 backdrop-blur print:hidden sm:mx-0 sm:px-0"
     >
      <ul className="flex gap-1 overflow-x-auto">
       {sections.map((s) => (
        <li key={s.id} className="shrink-0">
         <button
          type="button"
          onClick={() => goTo(s.id)}
          className={cn(
           "relative px-3 py-3 text-[13px] font-medium transition-colors",
           active === s.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
         >
          {s.label}
          <span className={cn("absolute inset-x-3 -bottom-px h-0.5", active === s.id ? "bg-brick" : "bg-transparent")} />
         </button>
        </li>
       ))}
      </ul>
     </nav>
    ) : null}

    {journey ? <div id="journey" className="scroll-mt-32"><DocumentJourney stages={journey} /></div> : null}

    {/* ── Dates ── */}
    {showDates ? (
     <Section id="dates" icon={CalendarDays} title="Important dates">
      <ol className="grid gap-x-8 sm:grid-cols-2">
       {dateRows.map((r) => {
        const done = r.ms !== null && r.ms < now
        return (
         <li key={r.label} className="flex items-center gap-3 border-b border-rule py-2.5 last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
          <span
           className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center border text-paper",
            done ? "border-ink bg-ink" : r.key ? "border-brick bg-brick" : "border-rule bg-transparent",
           )}
          >
           {done ? <Check className="h-3 w-3" /> : null}
          </span>
          <span className={cn("min-w-0 flex-1 text-sm", done ? "text-muted-foreground" : "text-foreground")}>{r.label}</span>
          <span className={cn("agate shrink-0 text-sm tabular-nums", r.key && !done ? "font-bold text-brick" : "font-semibold text-foreground")}>{r.value}</span>
         </li>
        )
       })}
      </ol>
     </Section>
    ) : null}

    {/* ── Eligibility ── */}
    {eligibility.length > 0 ? (
     <Section id="eligibility" icon={GraduationCap} title="Eligibility">
      <dl className="divide-y divide-rule">
       {eligibility.map((e) => (
        <div key={e.label} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
         <dt className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <e.icon className="h-4 w-4 shrink-0 text-muted-foreground" /> {e.label}
         </dt>
         <dd className="min-w-0 text-sm"><RichTextView html={e.html} /></dd>
        </div>
       ))}
      </dl>
     </Section>
    ) : null}

    {/* ── Selection ── */}
    {selectionProcess ? (
     <Section id="selection" icon={Route} title="Selection process">
      <JobSelectionStepper selectionProcess={selectionProcess} />
     </Section>
    ) : null}

    {/* ── Fee (only when it adds more than the tile) ── */}
    {feeNeedsSection ? (
     <Section id="fee" icon={Wallet} title="Application fee">
      {feeBars.length >= 2 ? (
       <>
        <ul className="grid grid-cols-2 border-b border-r border-rule sm:grid-cols-3">
         {feeBars.map((b) => (
          <li key={b.label} className="border-l border-t border-rule px-4 py-3">
           <p className="agate text-[11px] uppercase tracking-wider text-muted-foreground">{b.label}</p>
           <p className={cn("mt-1 font-display text-xl font-bold tabular-nums", b.amount === 0 ? "text-muted-foreground" : "text-foreground")}>
            {formatRupees(b.amount)}
           </p>
          </li>
         ))}
        </ul>
        {stripHtmlToText(applicationFee).length > 160 ? (
         <div className="mt-4 text-sm"><RichTextView html={applicationFee} /></div>
        ) : null}
       </>
      ) : (
       <RichTextView html={applicationFee} />
      )}
     </Section>
    ) : null}

    {/* ── Documents ── */}
    {documentsRequired ? (
     <Section id="documents" icon={ListChecks} title="Documents required" hint="Tick as you collect · saved on this device">
      <JobDocumentsChecklist key={jobId} jobId={jobId} documentsRequired={documentsRequired} />
     </Section>
    ) : null}

    {/* ── How to apply ── */}
    {howToApply ? (
     <Section id="how-to-apply" icon={FileText} title="How to apply">
      {containsHtml(howToApply) ? (
       <RichTextView html={howToApply} />
      ) : howSteps.length > 1 ? (
       <ol className="space-y-4">
        {howSteps.map((step, i) => (
         <li key={i} className="flex gap-3.5">
          <span className="agate flex h-7 w-7 shrink-0 items-center justify-center bg-ink text-xs text-paper">{i + 1}</span>
          <p className="whitespace-pre-line pt-0.5 text-sm leading-relaxed text-foreground">{step}</p>
         </li>
        ))}
       </ol>
      ) : (
       <div className="whitespace-pre-line text-sm leading-relaxed text-foreground">{howToApply}</div>
      )}
     </Section>
    ) : null}

    {/* Nothing structured was filled in - don't leave the reader with an empty page */}
    {facts.length === 0 && sections.length === 0 ? (
     <div className="flex items-start gap-3 border border-rule bg-paper-2 p-5 text-sm text-muted-foreground">
      <ClipboardList className="mt-0.5 h-5 w-5 shrink-0" />
      <p>Detailed information for this vacancy has not been published yet. Please read the official notification for full details.</p>
     </div>
    ) : null}
   </div>

   {/* ═════════ STICKY RAIL (desktop) / stacked (mobile) ═════════ */}
   <JobApplyRail
    jobId={jobId}
    slug={slug}
    title={title}
    department={department}
    officialNotification={officialNotification}
    officialWebsite={officialWebsite}
    canApply={canApply}
    deadline={deadline}
    lastDate={lastDate}
    updatedAt={updatedAt}
    viewsTotal={viewsTotal}
   />

   {/* ── Mobile apply bar (never printed) ── */}
   <div className="sticky bottom-0 z-40 -mx-4 border-t border-rule bg-background/95 backdrop-blur print:hidden lg:hidden lg:col-span-2">
    {deadline.progress !== null && !closed && deadline.state !== "upcoming" ? (
     <div className="h-1 w-full bg-paper-3" role="progressbar" aria-valuenow={deadline.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
      <div className={cn("h-full", urgent ? "bg-brick" : "bg-ink")} style={{ width: `${deadline.progress}%` }} />
     </div>
    ) : null}
    <div className="flex items-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
     <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      <p className={cn("agate text-xs", closed || urgent ? "text-brick" : "text-muted-foreground")}>{deadline.label}</p>
     </div>
     {canApply && !closed ? (
      <Button className="h-10 shrink-0 px-5 font-semibold" asChild>
       <Link href={`/apply/${slug}/start`} target="_blank" rel="noopener noreferrer">
        Apply now <ExternalLink className="ml-1.5 h-4 w-4" />
       </Link>
      </Button>
     ) : null}
    </div>
   </div>
  </div>
 )
}
