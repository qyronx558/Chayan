"use client"

import { useMemo, useState, useEffect, type ReactNode } from "react"
import Link from "next/link"
import {
 Briefcase, CalendarClock, CalendarDays, ClipboardList, ExternalLink, FileText,
 GraduationCap, IndianRupee, ListChecks, MapPin, Route, UserRound, Users, Wallet, Hash,
 type LucideIcon,
} from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { HandTick, PenLoop, RubberStamp, paperShadow } from "@/components/desk/DeskKit"
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
import { districtPagePath, statePagePath } from "@/lib/locations"
import {
 buildDateRows, feeKpi, formatRupees, getDeadline, parseFeeBars, shortFact, stepify,
} from "@/lib/job-insights"

interface JobDetailContentProps {
 jobId: string
 title: string
 department: string
 departmentId: string
 category: { id: string; name: string }
 jobLevel?: "CENTRAL" | "STATE" | "DISTRICT"
 state: { id: string; name: string; slug?: string } | null
 district?: { id: string; name: string; slug?: string } | null
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
 /** Original overview written for this page (never copied from the notice). */
 summary?: string | null
}

/* ── Small layout primitives: a notice read with a pen ─────────── */

/* Section number for the little "§ 02" in each sheet's corner. Set by the page. */
function Section({ id, n, icon: Icon, title, hint, children }: {
 id: string
 n?: number
 icon: LucideIcon
 title: string
 hint?: string
 children: ReactNode
}) {
 return (
  <section
   id={id}
   className="relative scroll-mt-32 rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)]"
   style={{ boxShadow: paperShadow }}
  >
   <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 pb-3 pt-5 sm:px-7">
    <span className={cn(typeFont.className, "text-[11px] font-bold text-[var(--color-brick)]")}>
     § {String(n ?? 1).padStart(2, "0")}
    </span>
    <h2 className="flex items-center gap-2 font-display text-[1.35rem] font-black leading-tight text-foreground">
     {title}
     <Icon className="h-4 w-4 text-muted-foreground/70" aria-hidden />
    </h2>
    {hint ? <span className={cn(handFont.className, "ml-auto hidden text-[1rem] text-muted-foreground sm:block")}>{hint}</span> : null}
   </header>
   <div className="mx-5 border-t border-dashed border-[var(--hs-border-strong)] sm:mx-7" />
   <div className="px-5 pb-6 pt-5 sm:px-7">{children}</div>
  </section>
 )
}

function Chip({ href, children }: { href: string; children: ReactNode }) {
 return (
  <Link
   href={href}
   className={cn(handFont.className, "text-[1.08rem] leading-none text-[var(--hs-trust)] underline decoration-[var(--hs-border-strong)] decoration-1 underline-offset-[5px] transition-colors hover:text-[var(--color-brick)] hover:decoration-[var(--color-brick)]")}
  >
   {children}
  </Link>
 )
}

const STATUS_STAMP = {
 closed: { label: "CLOSED", tone: "oklch(50% 0.02 60)" },
 urgent: { label: "CLOSING SOON", tone: "oklch(50% 0.19 27)" },
 upcoming: { label: "COMING SOON", tone: "oklch(48% 0.12 250)" },
 open: { label: "OPEN", tone: "oklch(45% 0.1 160)" },
 none: { label: "OPEN", tone: "oklch(45% 0.1 160)" },
} as const

export function JobDetailContent({
 jobId, title, department, departmentId, category, jobLevel, state, district = null, status,
 advertisementNo, totalVacancies, salary, location, ageLimit, ageRelaxation, education,
 selectionProcess, applicationFee, importantDates, documentsRequired, howToApply,
 officialNotification, officialWebsite, applyLink, experience, startDate, lastDate,
 slug, updatedAt = null, viewsTotal = null, journey = null, summary = null,
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

 const stamp = STATUS_STAMP[deadline.state as keyof typeof STATUS_STAMP] ?? STATUS_STAMP.open
 const num = (id: string) => sections.findIndex((s) => s.id === id) + 1
 const advt = advertisementNo ? (/^\s*(advt|advertisement)/i.test(advertisementNo) ? advertisementNo : `Advt. ${advertisementNo}`) : null

 return (
  <div className="home-saas grid items-start gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_340px]">
   {/* ═════════ MAIN COLUMN ═════════ */}
   <div className="min-w-0 space-y-8">
    {/* ── Hero: the head of the notice ── */}
    <header className="relative">
     <div className={cn(typeFont.className, "flex flex-wrap items-center gap-x-4 gap-y-1 border-y-2 border-double border-[var(--hs-border-strong)] py-1.5 text-[11px] font-bold uppercase text-foreground/70")}>
      <span>Recruitment notice</span>
      {advt ? <span className="inline-flex items-center gap-1 normal-case"><Hash className="h-3 w-3" />{advt}</span> : null}
      <span className="ml-auto">{jobLevel === "CENTRAL" ? "All India" : state ? state.name : "Govt. job"}</span>
     </div>

     <div className="mt-5 flex items-start gap-6">
      <div className="min-w-0 flex-1">
       <Link href={`/jobs?departmentId=${departmentId}`} className={cn(typeFont.className, "text-[12.5px] font-bold uppercase text-muted-foreground underline-offset-4 hover:text-[var(--color-brick)] hover:underline")}>
        {department}
       </Link>
       <h1 className="mt-2 font-display text-[2rem] font-black leading-[1.08] text-foreground sm:text-[2.7rem]">{title}</h1>
      </div>
      <RubberStamp label={stamp.label} tone={stamp.tone} className={cn("mt-2 hidden shrink-0 px-3 py-1 text-[15px] sm:inline-block", urgent && "animate-[pulse_3s_ease-in-out_infinite]")} />
     </div>

     <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <RubberStamp label={stamp.label} tone={stamp.tone} className="-rotate-[4deg] sm:hidden" />
      <span className={cn(handFont.className, "text-[1.02rem] text-muted-foreground")}>filed under</span>
      <Chip href={`/jobs?categoryId=${category.id}`}>{category.name}</Chip>
      {jobLevel === "CENTRAL" ? (
       <Chip href="/jobs?level=central">All India</Chip>
      ) : state ? (
       <Chip href={state.slug ? statePagePath(state.slug) : `/jobs?stateId=${state.id}`}>{state.name}</Chip>
      ) : null}
      {jobLevel === "DISTRICT" && district && state?.slug && district.slug ? (
       <Chip href={districtPagePath(state.slug, district.slug)}>{district.name} district</Chip>
      ) : null}
      {location ? (
       <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{location}</span>
      ) : null}
     </div>

     {/* Mobile/tablet only: desktop gets these in the sticky rail */}
     <div className="mt-5 flex items-center gap-2 lg:hidden print:hidden">
      <ApplicationTracker jobId={jobId} variant="full" />
      <BookmarkButton jobId={jobId} size="default" variant="outline" />
     </div>
    </header>

    {/* ── Overview: a short original write-up, plain text (React escapes it). ── */}
    {summary ? (
     <section aria-label="Overview" className="relative pl-6">
      <span className="absolute bottom-1 left-0 top-1 w-[5px] rounded-full bg-[color-mix(in_oklch,var(--hs-marigold)_70%,transparent)]" aria-hidden />
      <p className={cn(handFont.className, "text-[1.1rem] leading-none text-[var(--color-brick)]")}>in short</p>
      <p className="mt-2 text-[15.5px] leading-[1.75] text-foreground/90">{summary}</p>
     </section>
    ) : null}

    {/* ── Key facts: the 10-second scan, laid out like a ticket. Each value appears here once. ── */}
    {facts.length > 0 ? (
     <div className="relative rounded-[4px] border border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)]" style={{ boxShadow: paperShadow }}>
      <p className={cn(typeFont.className, "border-b border-dashed border-[var(--hs-border-strong)] px-5 py-2 text-[10.5px] font-bold tracking-[0.25em] text-muted-foreground")}>AT A GLANCE</p>
      <dl className={cn("grid", facts.length === 1 ? "grid-cols-1" : "grid-cols-2", facts.length === 2 ? "sm:grid-cols-2" : facts.length === 4 ? "sm:grid-cols-4" : facts.length >= 3 ? "sm:grid-cols-3" : "")}>
       {facts.map((f, i) => {
        const hot = "hot" in f && f.hot
        return (
         <div key={f.label} className={cn("min-w-0 border-dashed border-[var(--hs-border-strong)] px-5 py-4", i > 0 && "border-l", facts.length !== 4 && i >= 3 && "sm:border-t", facts.length !== 4 && i === 3 && "sm:border-l-0", i >= 2 && "max-sm:border-t", i % 2 === 0 && "max-sm:border-l-0")}>
          <dt className={cn(typeFont.className, "flex items-center gap-1.5 text-[10.5px] font-bold uppercase text-muted-foreground")}>
           <f.icon className="h-3.5 w-3.5" /> {f.label}
          </dt>
          <dd className={cn("mt-2 font-display text-[1.3rem] font-black leading-tight tabular-nums sm:text-[1.5rem]", hot ? "text-[var(--color-brick)]" : "text-foreground")}>
           {f.label === "Vacancies" ? (
            <span className="relative inline-block px-2">
             {f.value}
             <PenLoop className="-inset-x-1 -inset-y-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.5rem)]" color="var(--color-brick)" />
            </span>
           ) : f.label === "Last date" ? (
            <span className="relative inline-block">
             {f.value}
             <svg viewBox="0 0 120 8" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 h-2 w-full" aria-hidden>
              <path d="M2 5 C 30 2, 60 7, 118 3" stroke="var(--color-brick)" strokeWidth="2" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
             </svg>
            </span>
           ) : (
            f.value
           )}
          </dd>
          {"sub" in f && f.sub ? (
           <p className={cn(handFont.className, "mt-1.5 text-[1rem] leading-tight", hot ? "text-[var(--color-brick)]" : "text-muted-foreground")}>{f.sub}</p>
          ) : null}
         </div>
        )
       })}
      </dl>
     </div>
    ) : null}

    {/* ── Sticky section nav: index tabs on the edge of the file ── */}
    {sections.length > 2 ? (
     <nav
      aria-label="Job sections"
      className="sticky top-[65px] z-30 -mx-4 border-b border-[var(--hs-border-strong)] bg-background/95 px-4 pt-2 backdrop-blur print:hidden sm:mx-0 sm:px-0"
     >
      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
       {sections.map((s, i) => (
        <li key={s.id} className="shrink-0">
         <button
          type="button"
          onClick={() => goTo(s.id)}
          className={cn(
           "relative -mb-px rounded-t-[8px] border border-b-0 px-3.5 pb-2 pt-1.5 text-[13px] transition-colors",
           active === s.id
            ? "border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] font-semibold text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground",
          )}
         >
          <span className={cn(typeFont.className, "mr-1.5 text-[10px]", active === s.id ? "text-[var(--color-brick)]" : "text-muted-foreground/70")}>{String(i + 1).padStart(2, "0")}</span>
          {s.label}
         </button>
        </li>
       ))}
      </ul>
     </nav>
    ) : null}

    {journey ? <div id="journey" className="scroll-mt-32"><DocumentJourney stages={journey} /></div> : null}

    {/* ── Dates ── */}
    {showDates ? (
     <Section id="dates" n={num("dates")} icon={CalendarDays} title="Important dates" hint="the red one is the one that matters">
      <ol className="grid gap-x-10 sm:grid-cols-2">
       {dateRows.map((r) => {
        const done = r.ms !== null && r.ms < now
        return (
         <li key={r.label} className="flex items-center gap-3 py-2.5">
          <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
           {done ? (
            <HandTick className="h-5 w-5 text-[oklch(50%_0.1_160)]" draw={false} />
           ) : r.key ? (
            <>
             <span className="h-2 w-2 rounded-full bg-[var(--color-brick)]" />
             <PenLoop className="inset-0 h-full w-full" color="var(--color-brick)" />
            </>
           ) : (
            <span className="h-2 w-2 rounded-full border-[1.5px] border-muted-foreground" />
           )}
          </span>
          <span className={cn("min-w-0 text-[14px]", done ? "text-muted-foreground line-through decoration-[var(--hs-border-strong)]" : "text-foreground")}>{r.label}</span>
          <span className="mx-1 h-px min-w-4 flex-1 border-b border-dotted border-[var(--hs-border-strong)]" aria-hidden />
          <span className={cn(typeFont.className, "shrink-0 text-[13px] tabular-nums", r.key && !done ? "font-bold text-[var(--color-brick)]" : "font-bold text-foreground")}>{r.value}</span>
         </li>
        )
       })}
      </ol>
     </Section>
    ) : null}

    {/* ── Eligibility ── */}
    {eligibility.length > 0 ? (
     <Section id="eligibility" n={num("eligibility")} icon={GraduationCap} title="Eligibility" hint="read each line twice">
      <dl>
       {eligibility.map((e) => (
        <div key={e.label} className="grid gap-1.5 border-b border-dashed border-[var(--hs-border)] py-4 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-6">
         <dt className={cn(typeFont.className, "flex items-start gap-2 text-[11.5px] font-bold uppercase text-foreground/80 sm:border-r sm:border-[color-mix(in_oklch,var(--color-brick)_35%,transparent)] sm:pr-4")}>
          <e.icon className="mt-px h-3.5 w-3.5 shrink-0 text-[var(--color-brick)]" /> {e.label}
         </dt>
         <dd className="min-w-0 text-sm"><RichTextView html={e.html} /></dd>
        </div>
       ))}
      </dl>
     </Section>
    ) : null}

    {/* ── Selection ── */}
    {selectionProcess ? (
     <Section id="selection" n={num("selection")} icon={Route} title="Selection process" hint="one stage at a time">
      <JobSelectionStepper selectionProcess={selectionProcess} />
     </Section>
    ) : null}

    {/* ── Fee (only when it adds more than the tile) ── */}
    {feeNeedsSection ? (
     <Section id="fee" n={num("fee")} icon={Wallet} title="Application fee" hint="keep the payment receipt">
      {feeBars.length >= 2 ? (
       <>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
         {feeBars.map((b, i) => (
          <li key={b.label} className={cn("relative rounded-[3px] border border-dashed border-[var(--hs-border-strong)] px-4 pb-3 pt-3", i % 2 ? "rotate-[0.4deg]" : "-rotate-[0.3deg]")}>
           <p className={cn(typeFont.className, "text-[10.5px] font-bold uppercase text-muted-foreground")}>{b.label}</p>
           {b.amount === 0 ? (
            <p className={cn(handFont.className, "mt-1 text-[1.6rem] leading-tight text-[oklch(50%_0.1_160)]")}>free</p>
           ) : (
            <p className="mt-1 font-display text-[1.5rem] font-black tabular-nums text-foreground">{formatRupees(b.amount)}</p>
           )}
          </li>
         ))}
        </ul>
        {stripHtmlToText(applicationFee).length > 160 ? (
         <div className="mt-5 text-sm"><RichTextView html={applicationFee} /></div>
        ) : null}
       </>
      ) : (
       <RichTextView html={applicationFee} />
      )}
     </Section>
    ) : null}

    {/* ── Documents ── */}
    {documentsRequired ? (
     <Section id="documents" n={num("documents")} icon={ListChecks} title="Documents required" hint="tick as you collect · saved on this device">
      <JobDocumentsChecklist key={jobId} jobId={jobId} documentsRequired={documentsRequired} />
     </Section>
    ) : null}

    {/* ── How to apply ── */}
    {howToApply ? (
     <Section id="how-to-apply" n={num("how-to-apply")} icon={FileText} title="How to apply" hint="go slowly. save as you go.">
      {containsHtml(howToApply) ? (
       <RichTextView html={howToApply} />
      ) : howSteps.length > 1 ? (
       <ol className="space-y-5">
        {howSteps.map((step, i) => (
         <li key={i} className="flex gap-4">
          <span className={cn(handFont.className, "relative flex h-8 w-8 shrink-0 items-center justify-center text-[1.15rem] text-[var(--color-brick)]")}>
           {i + 1}
           <PenLoop className="inset-0 h-full w-full" color="var(--color-brick)" />
          </span>
          <p className="whitespace-pre-line pt-1 text-[14.5px] leading-relaxed text-foreground">{step}</p>
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
     <div className="flex items-start gap-3 rounded-[3px] border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] p-5 text-sm text-muted-foreground">
      <ClipboardList className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
       <p className={cn(handFont.className, "text-[1.2rem] text-foreground")}>The full notice isn&apos;t typed up yet.</p>
       <p className="mt-1">Detailed information for this vacancy has not been published yet. Please read the official notification for full details.</p>
      </div>
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
   <div className="sticky bottom-0 z-40 -mx-4 border-t border-[var(--hs-border-strong)] bg-background/95 backdrop-blur print:hidden lg:hidden lg:col-span-2">
    {deadline.progress !== null && !closed && deadline.state !== "upcoming" ? (
     <div className="h-1 w-full bg-[var(--hs-surface-2)]" role="progressbar" aria-valuenow={deadline.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
      <div className={cn("h-full", urgent ? "bg-[var(--color-brick)]" : "bg-foreground")} style={{ width: `${deadline.progress}%` }} />
     </div>
    ) : null}
    <div className="flex items-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
     <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      <p className={cn(handFont.className, "text-[1rem] leading-tight", closed || urgent ? "text-[var(--color-brick)]" : "text-muted-foreground")}>{deadline.label}</p>
     </div>
     {canApply && !closed ? (
      <Button className="h-11 shrink-0 rounded-full px-6 font-semibold" asChild>
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
