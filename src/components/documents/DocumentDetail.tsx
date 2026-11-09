"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import {
 BookOpen, Building2, CalendarCheck, CalendarClock, CalendarDays, CalendarPlus, Check, ExternalLink,
 FileCheck2, FileText, GraduationCap, KeyRound, ListChecks, Ticket, Wallet, Info, Tag,
 type LucideIcon,
} from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { EntityViewTracker, type TrackedEntityType } from "@/components/analytics/EntityViewTracker"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { JobFollowBell } from "@/components/jobs/JobFollowBell"
import { DocumentSideRail } from "@/components/documents/DocumentSideRail"
import { DocumentJourney } from "@/components/documents/DocumentJourney"
import { TopicChecklist } from "@/components/documents/TopicChecklist"
import { Button } from "@/components/ui/button"
import { RichTextView } from "@/components/shared/RichTextView"
import { useActiveSection } from "@/components/shared/useActiveSection"
import { shortFact } from "@/lib/job-insights"
import { getDocState, type DocKind, type PrimaryDateMode } from "@/lib/doc-state"
import type { JourneyStage } from "@/lib/doc-journey"

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
 kind: DocKind
 title: string
 department: string
 category?: string | null
 description?: string | null
 rows: DetailRow[]
 linkRows?: LinkRow[]
 list?: { label: string; items: string[] } | null
 downloadUrl?: string | null
 downloadLabel: string
 /** Fullscreen viewer route (e.g. `/result/[slug]/view`). Used only when a download URL exists. */
 viewerHref?: string | null
 countdownDate?: string | null
 countdownLabel?: string
 bookmarkId?: { type: "result" | "admit-card"; id: string } | null
 bookmarkSyllabusId?: string | null
 application?: { type: "admission"; id: string } | null
 followJob?: { jobId: string } | null
 relatedTitle: string
 relatedItems: RelatedItem[]
 primaryDate?: string | null
 primaryDateLabel?: string
 primaryDateMode?: PrimaryDateMode
 windowStart?: string | null
 publishedAt?: string | null
 tracking?: { entityType: TrackedEntityType; entityId: string } | null
 /** Notification -> syllabus -> admit card -> answer key -> result, built from the linked job. */
 journey?: JourneyStage[] | null
}

const KIND_CONFIG: Record<DocKind, { badge: string; icon: LucideIcon; listHref: string; listLabel: string }> = {
 result: { badge: "Result", icon: FileCheck2, listHref: "/results", listLabel: "All results" },
 "admit-card": { badge: "Admit card", icon: Ticket, listHref: "/admit-cards", listLabel: "All admit cards" },
 "answer-key": { badge: "Answer key", icon: KeyRound, listHref: "/answer-keys", listLabel: "All answer keys" },
 syllabus: { badge: "Syllabus", icon: BookOpen, listHref: "/syllabus", listLabel: "All syllabus" },
 admission: { badge: "Admission", icon: GraduationCap, listHref: "/admissions", listLabel: "All admissions" },
}

/** General, kind-level guidance only - never presented as notice-specific facts. */
const GUIDE: Partial<Record<DocKind, { title: string; items: string[] }>> = {
 "admit-card": {
  title: "Exam-day checklist",
  items: [
   "Printed admit card - check name, roll number, centre and reporting time.",
   "Original photo ID of the type named in the notice.",
   "Passport-size photographs, if the notice asks for them.",
   "Reach the centre early; gates usually close before the exam starts.",
  ],
 },
 result: {
  title: "After the result",
  items: [
   "Search your roll number or name inside the official PDF.",
   "Note the cut-off and merit details if they are published.",
   "Watch the official site for document verification or next-stage dates.",
   "Save the PDF - you may need it later.",
  ],
 },
 "answer-key": {
  title: "Using this answer key",
  items: [
   "Match your marked responses against the key.",
   "Work out your score using the marking scheme in the notice.",
   "If objections are allowed, raise them on the official site within the window.",
   "A provisional key can change - watch for the final key.",
  ],
 },
 admission: {
  title: "Before you apply",
  items: [
   "Read eligibility and fee details in the official notification.",
   "Keep scanned documents and a recent photograph ready.",
   "Apply well before the last date - servers get slow near the deadline.",
  ],
 },
}

const tileIcon = (label: string): LucideIcon => {
 if (/result/i.test(label)) return CalendarCheck
 if (/exam/i.test(label)) return CalendarDays
 if (/start|begin|open/i.test(label)) return CalendarPlus
 if (/last|clos/i.test(label)) return CalendarClock
 if (/fee/i.test(label)) return Wallet
 if (/status/i.test(label)) return FileCheck2
 return Tag
}

function Section({ id, icon: Icon, title, hint, children }: { id: string; icon: LucideIcon; title: string; hint?: string; children: ReactNode }) {
 return (
  <section id={id} className="scroll-mt-32 border border-rule bg-card">
   <header className="flex items-center gap-3 border-b border-rule px-4 py-3 sm:px-5">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-ink text-paper"><Icon className="h-4 w-4" /></span>
    <h2 className="font-display text-lg font-bold leading-none text-foreground">{title}</h2>
    {hint ? <span className="agate ml-auto hidden text-[11px] text-muted-foreground sm:block">{hint}</span> : null}
   </header>
   <div className="p-4 sm:p-5">{children}</div>
  </section>
 )
}

export function DocumentDetail({
 kind, title, department, category, description, rows, linkRows = [], list, downloadUrl, downloadLabel,
 viewerHref = null, countdownDate, bookmarkId, bookmarkSyllabusId, application, followJob,
 relatedTitle, relatedItems, primaryDate = null, primaryDateMode = "date", windowStart = null,
 publishedAt = null, tracking = null, journey = null,
}: DocumentDetailProps) {
 const config = KIND_CONFIG[kind]
 const [now, setNow] = useState(() => Date.now())
 useEffect(() => {
  const t = setInterval(() => setNow(Date.now()), 60000)
  return () => clearInterval(t)
 }, [])

 const hasFile = Boolean(downloadUrl)
 /* One comma-separated line is really a list of topics. */
 const topics = (() => {
  const items = list?.items ?? []
  return items.length === 1 && /[,;]/.test(items[0]) ? items[0].split(/[,;]s*/).map((t) => t.trim()).filter(Boolean) : items
 })()
 const dateForState = kind === "admission" ? (countdownDate ?? primaryDate) : primaryDate
 const state = getDocState({ kind, hasFile, hasContent: hasFile || topics.length > 0, primaryDate: dateForState ?? null, primaryDateMode, windowStart, nowMs: now })
 const viewerActive = Boolean(viewerHref && downloadUrl)

 /* Department + category already live in the hero - the rest become tiles (short) or sections (long). */
 /* A status that only says "published/available" repeats the status pill - keep informative ones (Provisional, Final...). */
 const GENERIC_STATUS = /^(published|available|active|out|declared|released|live|open)$/i
 const dataRows = rows.filter((r) => r.value && !/^(department|category)$/i.test(r.label) && !(/status/i.test(r.label) && GENERIC_STATUS.test(r.value.trim())))
 const primaryFormatted = dateForState ? formatDate(dateForState) : null
 const tiles = dataRows
  .map((r) => ({ ...r, short: shortFact(r.value, 44) }))
  .filter((r) => r.short)
  .map((r) => ({
   label: r.label,
   value: r.short as string,
   icon: tileIcon(r.label),
   sub: r.value !== primaryFormatted ? null
    : primaryDateMode === "since" ? (state.sub?.split(" · ")[0] ?? null)
    : primaryDateMode === "countdown" ? state.headline
    : null,
   hot: r.value === primaryFormatted && state.tone === "hot",
  }))
 const longRows = dataRows.filter((r) => !shortFact(r.value, 44))

 /* Post-release guidance only makes sense once the document is out; admit-card/admission prep is useful beforehand. */
 const guideShown = Boolean(GUIDE[kind]) && (kind === "admit-card" || kind === "admission" || state.tone === "ok")
 const guide = guideShown ? GUIDE[kind] : undefined
 const sections = [
  { id: "journey", label: "Journey", show: Boolean(journey) },
  { id: "topics", label: list?.label || "Topics", show: topics.length > 0 },
  ...longRows.map((r, i) => ({ id: `row-${i}`, label: r.label, show: true })),
  { id: "about", label: "About", show: Boolean(description) },
  { id: "guide", label: GUIDE[kind]?.title ?? "", show: Boolean(guideShown) },
 ].filter((s) => s.show)
 const active = useActiveSection(sections.map((s) => s.id))
 const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

 const actionNodes = (
  <>
   {application && <ApplicationTracker jobId={application.id} type="admission" variant="full" />}
   {followJob && <JobFollowBell jobId={followJob.jobId} />}
   {bookmarkSyllabusId && <BookmarkButton syllabusId={bookmarkSyllabusId} size="default" variant="outline" />}
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

 const pillCls =
  state.tone === "hot" ? "border-brick bg-brick text-brick-ink"
  : state.tone === "ok" ? "border-ink text-foreground"
  : "border-rule-2 text-muted-foreground"

 return (
  <div>
  {/* Rail + content only: the sticky rail must never share a grid with anything below it. */}
  <div className="grid items-start gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_340px]">
   {tracking ? <EntityViewTracker entityType={tracking.entityType} entityId={tracking.entityId} /> : null}

   <div className="min-w-0 space-y-6">
    {/* ── Hero ── */}
    <header>
     <div className="flex flex-wrap items-center gap-1.5">
      <span className={cn("agate inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] uppercase tracking-wider", pillCls)}>
       <span className={cn("h-1.5 w-1.5 rounded-full bg-current", state.tone === "hot" && "animate-pulse")} /> {state.pill}
      </span>
      <span className="agate inline-flex items-center gap-1 border border-rule px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
       <config.icon className="h-3 w-3" /> {config.badge}
      </span>
      {category ? (
       <span className="agate border border-rule px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{category}</span>
      ) : null}
     </div>
     <h1 className="mt-3 font-display text-[1.9rem] font-bold leading-[1.1] text-foreground sm:text-[2.5rem]">{title}</h1>
     <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><Building2 className="h-4 w-4 text-muted-foreground" />{department}</span>
      {linkRows.map((l) => (
       <Link key={l.label} href={l.href} className="inline-flex min-w-0 items-center gap-1 underline-offset-4 hover:text-brick hover:underline" title={l.value}>
        <ExternalLink className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{l.label}: {l.value}</span>
       </Link>
      ))}
     </p>
     {/* Mobile/tablet: desktop gets these in the rail */}
     <div className="mt-4 flex flex-wrap items-center gap-2 lg:hidden print:hidden">{actionNodes}</div>
    </header>

    {/* ── Key facts ── */}
    {tiles.length > 0 ? (
     <dl className={cn("grid grid-cols-2 border-b border-r border-rule bg-card", tiles.length === 4 ? "sm:grid-cols-2" : tiles.length === 1 ? "sm:grid-cols-1" : "sm:grid-cols-3")}>
      {tiles.map((t) => (
       <div key={t.label} className="min-w-0 border-l border-t border-rule px-4 py-3.5">
        <dt className="agate flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground"><t.icon className="h-3.5 w-3.5" /> {t.label}</dt>
        <dd className={cn("mt-1.5 font-display text-xl font-bold leading-tight tabular-nums sm:text-2xl", t.hot ? "text-brick" : "text-foreground")}>{t.value}</dd>
        {t.sub ? <p className={cn("agate mt-0.5 text-xs", t.hot ? "font-semibold text-brick" : "text-muted-foreground")}>{t.sub}</p> : null}
       </div>
      ))}
     </dl>
    ) : null}

    {sections.length > 2 ? (
     <nav aria-label="Sections" className="sticky top-[65px] z-30 -mx-4 border-b border-rule bg-background/95 px-4 backdrop-blur print:hidden sm:mx-0 sm:px-0">
      <ul className="flex gap-1 overflow-x-auto">
       {sections.map((s) => (
        <li key={s.id} className="shrink-0">
         <button type="button" onClick={() => goTo(s.id)} className={cn("relative px-3 py-3 text-[13px] font-medium transition-colors", active === s.id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
          {s.label}
          <span className={cn("absolute inset-x-3 -bottom-px h-0.5", active === s.id ? "bg-brick" : "bg-transparent")} />
         </button>
        </li>
       ))}
      </ul>
     </nav>
    ) : null}

    {journey ? <div id="journey" className="scroll-mt-32"><DocumentJourney stages={journey} /></div> : null}

    {topics.length > 0 ? (
     <Section id="topics" icon={BookOpen} title={list?.label || "Topics"} hint="Tick as you study · saved on this device">
      <TopicChecklist storageKey={tracking?.entityId ?? title} items={topics} />
     </Section>
    ) : null}

    {longRows.map((r, i) => (
     <Section key={r.label} id={`row-${i}`} icon={r.label.match(/fee/i) ? Wallet : ListChecks} title={r.label}>
      <RichTextView html={r.value} />
     </Section>
    ))}

    {description ? (
     <Section id="about" icon={FileText} title={`About this ${config.badge.toLowerCase()}`}>
      <RichTextView html={description} />
     </Section>
    ) : null}

    {guide ? (
     <Section id="guide" icon={Info} title={guide.title} hint="General guidance - follow your official notice">
      <ul className="space-y-2.5">
       {guide.items.map((g) => (
        <li key={g} className="flex items-start gap-3 text-sm text-foreground">
         <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-rule text-ink"><Check className="h-3 w-3" /></span>
         {g}
        </li>
       ))}
      </ul>
     </Section>
    ) : null}

    {tiles.length === 0 && sections.length === 0 && !hasFile ? (
     <div className="flex items-start gap-3 border border-rule bg-paper-2 p-5 text-sm text-muted-foreground">
      <Info className="mt-0.5 h-5 w-5 shrink-0" />
      <p>Details for this {config.badge.toLowerCase()} are not published yet. Check back soon or follow the linked job for updates.</p>
     </div>
    ) : null}
   </div>

   <DocumentSideRail
    title={title}
    department={department}
    downloadUrl={downloadUrl}
    downloadLabel={downloadLabel}
    viewerHref={viewerActive ? viewerHref : null}
    publishedAt={publishedAt}
    state={state}
    actions={actionNodes}
   />

  </div>

   {/* ── Related (full width, below) ── */}
   {relatedItems.length > 0 ? (
    <section className="mt-10">
     <div className="mb-4 flex items-end justify-between gap-3 border-b-2 border-rule-2 pb-2">
      <h2 className="font-display text-xl font-bold text-foreground">{relatedTitle}</h2>
      <Link href={config.listHref} className="shrink-0 text-sm font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2">{config.listLabel} →</Link>
     </div>
     <div className="grid border-b border-r border-rule sm:grid-cols-2">
      {relatedItems.map((item) => (
       <Link key={item.href} href={item.href} className="group border-l border-t border-rule bg-card p-4 transition-colors hover:bg-paper-2">
        <span className="agate text-[11px] uppercase tracking-wider text-muted-foreground">{item.department}</span>
        <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground group-hover:text-brick">{item.title}</h3>
        {item.meta ? <p className="agate mt-1.5 line-clamp-2 text-xs text-muted-foreground">{item.meta}</p> : null}
       </Link>
      ))}
     </div>
    </section>
   ) : null}

   {/* ── Mobile bar ── */}
   <div className="sticky bottom-0 z-40 -mx-4 border-t border-rule bg-background/95 backdrop-blur print:hidden lg:hidden">
    {state.progress !== null ? (
     <div className="h-1 w-full bg-paper-3" role="progressbar" aria-valuenow={state.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
      <div className={cn("h-full", state.tone === "hot" ? "bg-brick" : "bg-ink")} style={{ width: `${state.progress}%` }} />
     </div>
    ) : null}
    <div className="flex items-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
     <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      <p className={cn("agate text-xs", state.tone === "hot" ? "text-brick" : "text-muted-foreground")}>{state.headline}</p>
     </div>
     {downloadUrl ? (
      <Button className="h-10 shrink-0 px-5 font-semibold" asChild>
       {viewerActive ? (
        <Link href={viewerHref as string}><FileText className="mr-1.5 h-4 w-4" /> Open</Link>
       ) : (
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer"><FileText className="mr-1.5 h-4 w-4" /> Open</a>
       )}
      </Button>
     ) : null}
    </div>
   </div>
  </div>
 )
}
