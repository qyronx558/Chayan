/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  Zap,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  FileText,
  CreditCard,
  BookOpen,
  KeyRound,
  GraduationCap,
  Clock,
  Search,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react"
import { SearchBar } from "@/components/home/SearchBar"
import type { FeaturedSlideItem } from "@/components/featured/FeaturedSlideView"
import { FEATURED_TYPE_BADGES } from "@/lib/featured"
import { formatCompact } from "@/lib/utils"

const WORDS = ["government job", "private job", "result", "admit card"]

const LINKS = [
  { label: "Govt jobs", href: "/jobs", icon: Briefcase },
  { label: "Private jobs", href: "/private-jobs", icon: FileText },
  { label: "Results", href: "/results", icon: GraduationCap },
  { label: "Admit cards", href: "/admit-cards", icon: CreditCard },
  { label: "Answer keys", href: "/answer-keys", icon: KeyRound },
  { label: "Syllabus", href: "/syllabus", icon: BookOpen },
]

const JOURNEY_STEPS = [
  { icon: Search, label: "Search", sub: "Find openings" },
  { icon: ClipboardCheck, label: "Apply", sub: "Submit forms" },
  { icon: CreditCard, label: "Admit card", sub: "Download hall ticket" },
  { icon: BookOpen, label: "Exam", sub: "Appear for test" },
  { icon: CheckCircle2, label: "Result", sub: "Check outcome" },
]

interface CalendarEvent {
  date: string
  type: string
  label: string
  title: string
  department: string
  href: string
}

interface SiteStats {
  activeJobs: number
  totalResults: number
  totalAdmitCards: number
  totalPrivateJobs: number
  totalUsers: number
  recentJobs: { title: string; department: { name: string } }[]
}

function featuredHref(item: FeaturedSlideItem) {
  const href = item.linkUrl || item.ctaUrl || "/jobs"
  return href.startsWith("/") || href.startsWith("http") ? href : `https://${href}`
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

/* ── Floating rings decoration ── */
function FloatingRings() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -right-20 -top-20 h-[340px] w-[340px] rounded-full border border-ink/[0.04] sm:h-[480px] sm:w-[480px]"
        style={{ animation: "float-slow 18s ease-in-out infinite" }}
      />
      <div
        className="absolute -right-10 top-10 h-[240px] w-[240px] rounded-full border border-brick/[0.06] sm:h-[360px] sm:w-[360px]"
        style={{ animation: "float-slow 18s ease-in-out infinite 3s" }}
      />
      <div
        className="absolute -left-16 bottom-0 h-[200px] w-[200px] rounded-full border border-ink/[0.03] sm:h-[280px] sm:w-[280px]"
        style={{ animation: "float-slow 22s ease-in-out infinite 6s" }}
      />
    </div>
  )
}

/* ── Aspirant journey stepper ── */
function JourneyStepper() {
  return (
    <div className="flex items-center justify-center gap-0">
      {JOURNEY_STEPS.map((step, i) => {
        const Icon = step.icon
        return (
          <div key={step.label} className="flex items-center">
            <div
              className="group flex flex-col items-center gap-1.5"
              style={{ animation: `fadeIn .5s ease ${i * 0.12}s both` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/8 bg-paper shadow-[0_1px_3px_rgba(0,0,0,.04)] transition-all group-hover:border-brick/20 group-hover:shadow-md sm:h-12 sm:w-12">
                <Icon className="h-4 w-4 text-ink/40 transition-colors group-hover:text-brick sm:h-5 sm:w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 sm:text-[11px]">{step.label}</span>
              <span className="hidden text-[10px] text-ink/25 sm:block">{step.sub}</span>
            </div>
            {i < JOURNEY_STEPS.length - 1 && (
              <div className="mx-1.5 mb-5 flex items-center sm:mx-3 sm:mb-6">
                <div className="h-[1px] w-4 bg-ink/10 sm:w-8" />
                <div className="h-0 w-0 border-y-[3px] border-l-[5px] border-y-transparent border-l-ink/10" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Upcoming deadline mini-cards ── */
function DeadlineStrip({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) return null
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {events.slice(0, 3).map((ev, i) => {
        const days = daysUntil(ev.date)
        const urgency =
          days <= 3 ? "border-red-200 bg-red-50/60" : days <= 7 ? "border-amber-200 bg-amber-50/50" : "border-ink/8 bg-paper"
        const urgencyText = days <= 3 ? "text-red-600" : days <= 7 ? "text-amber-600" : "text-ink/50"
        return (
          <Link
            key={`${ev.href}-${i}`}
            href={ev.href}
            className={`group flex items-start gap-3 rounded-xl border p-3 transition-all hover:shadow-md ${urgency}`}
            style={{ animation: `fadeIn .4s ease ${i * 0.1}s both` }}
          >
            <div className="flex shrink-0 flex-col items-center">
              <span className={`font-display text-2xl font-bold tabular-nums leading-none ${urgencyText}`}>{days}</span>
              <span className={`text-[10px] font-medium uppercase ${urgencyText}`}>days</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${urgencyText}`}>{ev.label}</span>
              <p className="mt-0.5 line-clamp-1 text-xs font-medium text-ink/70 group-hover:text-ink">{ev.title}</p>
              <p className="line-clamp-1 text-[10px] text-ink/35">{ev.department}</p>
            </div>
            <ArrowRight className="mt-1 h-3 w-3 shrink-0 text-ink/20 transition-transform group-hover:translate-x-0.5 group-hover:text-ink/50" />
          </Link>
        )
      })}
    </div>
  )
}

/* ── Social proof bar ── */
function SocialProof({ stats }: { stats: SiteStats | null }) {
  if (!stats) return null
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {[
        { value: stats.activeJobs, label: "live openings", icon: Briefcase },
        { value: stats.totalResults, label: "results declared", icon: GraduationCap },
        { value: stats.totalPrivateJobs, label: "private roles", icon: FileText },
      ].map((s) => {
        const Icon = s.icon
        return s.value > 0 ? (
          <div key={s.label} className="flex items-center gap-1.5">
            <Icon className="h-3 w-3 text-ink/25" />
            <span className="text-xs text-ink/40">
              <span className="font-bold tabular-nums text-ink/60">{formatCompact(s.value)}</span> {s.label}
            </span>
          </div>
        ) : null
      })}
    </div>
  )
}

/* ── Horizontal marquee of featured titles ── */
function LiveTicker({ items }: { items: FeaturedSlideItem[] }) {
  if (items.length === 0) return null
  const doubled = [...items, ...items]
  return (
    <div className="relative overflow-hidden border-y border-ink/6 bg-ink/[0.02]">
      <div className="flex" style={{ animation: `ticker-scroll ${items.length * 4}s linear infinite` }}>
        {doubled.map((item, i) => (
          <Link
            key={`${item.id}-${i}`}
            href={featuredHref(item)}
            className="group flex shrink-0 items-center gap-3 px-6 py-3"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brick/10">
              <TrendingUp className="h-2.5 w-2.5 text-brick" />
            </span>
            <span className="whitespace-nowrap text-sm text-ink/50 transition-colors group-hover:text-ink">{item.title}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-brick/60">
              {item.badge || FEATURED_TYPE_BADGES[item.type] || "New"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ── Featured carousel ── */
function FeaturedCarousel({ items }: { items: FeaturedSlideItem[] }) {
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>(null)
  const count = items.length

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setActive((i) => (i + 1) % count), 2800)
  }, [count])

  useEffect(() => {
    if (count < 2) return
    resetTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [count, resetTimer])

  const go = (dir: -1 | 1) => {
    setActive((i) => (i + dir + count) % count)
    resetTimer()
  }

  if (items.length === 0) return null

  const item = items[active]
  const badge = item.badge || FEATURED_TYPE_BADGES[item.type] || "Featured"
  const href = featuredHref(item)

  return (
    <div className="relative">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-[pulse-dot_1.5s_ease-in-out_infinite] rounded-full bg-brick opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brick" />
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-brick">Live</span>
        </div>
        <span className="text-xs font-medium text-ink/40">Pinned & trending</span>
        <div className="ml-auto flex items-center gap-1.5">
          {count > 1 &&
            items.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setActive(i)
                  resetTimer()
                }}
                className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-brick" : "w-1.5 bg-ink/15 hover:bg-ink/30"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          <span className="ml-2 text-xs tabular-nums text-ink/30">
            {active + 1}/{count}
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-ink/8 bg-paper shadow-[0_1px_3px_rgba(0,0,0,.04),0_8px_32px_rgba(0,0,0,.07)]">
        <Link
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="group grid md:grid-cols-[1.15fr_1fr]"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-ink/5 md:aspect-auto md:min-h-[300px]">
            {item.image ? (
              <img
                key={item.id}
                src={item.image}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                loading="eager"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-brick/5 to-ink/5">
                <Zap className="h-14 w-14 text-ink/8" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
          </div>

          <div className="relative flex flex-col justify-center p-7 sm:p-9">
            <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-brick/8 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brick">
              <TrendingUp className="h-3 w-3" />
              {badge}
              {item.isPinned && <span className="ml-1 text-brick/50">· Pinned</span>}
            </span>
            <h2
              key={item.id}
              className="font-display text-xl font-bold leading-snug text-ink sm:text-2xl lg:text-[1.7rem]"
              style={{ animation: "fadeIn .4s ease" }}
            >
              {item.title}
            </h2>
            {item.organization && <p className="mt-2 text-sm font-medium text-ink/45">{item.organization}</p>}
            {item.info && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/50">{item.info}</p>}
            {item.dateText && <p className="mt-3 text-xs text-ink/35">{item.dateText}</p>}
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-ink transition-colors group-hover:text-brick">
              {item.ctaLabel || "Read more"}{" "}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>

        {count > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault()
                go(-1)
              }}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-paper/90 text-ink/50 shadow-sm backdrop-blur-sm transition-all hover:bg-paper hover:text-ink hover:shadow-md"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                go(1)
              }}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-paper/90 text-ink/50 shadow-sm backdrop-blur-sm transition-all hover:bg-paper hover:text-ink hover:shadow-md"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(count, 4)}, 1fr)` }}>
          {items.slice(0, 4).map((it, i) => (
            <button
              key={it.id}
              onClick={() => {
                setActive(i)
                resetTimer()
              }}
              className={`flex flex-col rounded-xl border px-3 py-3 text-left transition-all ${
                i === active
                  ? "border-brick/25 bg-brick/[0.04] shadow-sm"
                  : "border-ink/6 bg-transparent hover:border-ink/12 hover:bg-ink/[0.02]"
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider ${i === active ? "text-brick" : "text-ink/25"}`}>
                {it.badge || FEATURED_TYPE_BADGES[it.type] || "Update"}
              </span>
              <span className={`mt-0.5 line-clamp-1 text-xs font-medium ${i === active ? "text-ink/80" : "text-ink/40"}`}>
                {it.title}
              </span>
              {i === active && (
                <div className="mt-2.5 h-[2px] w-full overflow-hidden rounded-full bg-brick/10">
                  <div className="h-full animate-[progress-fill_2.8s_linear] rounded-full bg-brick" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function HomeHero() {
  const [featured, setFeatured] = useState<FeaturedSlideItem[]>([])
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [deadlines, setDeadlines] = useState<CalendarEvent[]>([])
  const [wordIdx, setWordIdx] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch("/api/featured")
      .then((r) => r.json())
      .then((d) => !cancelled && setFeatured(d.success ? d.data : []))
      .catch(() => {})
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => !cancelled && d.success && setStats(d.data))
      .catch(() => {})
    fetch("/api/exam-calendar?upcoming=1&limit=3")
      .then((r) => r.json())
      .then((d) => !cancelled && d.success && setDeadlines(d.data))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setWordIdx((i) => (i + 1) % WORDS.length), 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative w-full bg-paper text-ink">
      <FloatingRings />

      {/* ── hero top ── */}
      <div className="relative mx-auto w-full max-w-5xl px-4 pb-10 pt-14 text-center sm:px-8 sm:pt-20">
        <h1 className="font-display text-[2.5rem] font-bold leading-[1.06] tracking-tight sm:text-[3.75rem] lg:text-[4.25rem]">
          Find your next
          <br className="sm:hidden" />
          <span
            className="relative ml-2 inline-block overflow-hidden align-bottom"
            style={{ height: "1.18em", verticalAlign: "baseline" }}
          >
            <span
              key={wordIdx}
              className="inline-block text-brick"
              style={{ animation: "slide-up .35s cubic-bezier(.16,1,.3,1)" }}
            >
              {WORDS[wordIdx]}
            </span>
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink/50 sm:text-lg">
          Verified openings, results and admit cards - all in one place.
        </p>

        {/* social proof counts */}
        <div className="mt-4">
          <SocialProof stats={stats} />
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          <SearchBar embedded tone="light" align="center" />
        </div>

        {/* category pills */}
        <nav aria-label="Browse" className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2">
          {LINKS.map((l) => {
            const Icon = l.icon
            return (
              <Link
                key={l.href}
                href={l.href}
                className="group inline-flex items-center gap-1.5 rounded-full border border-ink/8 px-4 py-2 text-sm text-ink/50 transition-all hover:border-ink/20 hover:bg-ink/[0.03] hover:text-ink"
              >
                <Icon className="h-3.5 w-3.5 text-ink/30 transition-colors group-hover:text-brick" />
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper shadow-[0_2px_12px_rgba(0,0,0,.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,.22)]"
          >
            Browse live jobs
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="#alerts" className="rounded-full px-6 py-3 text-sm font-semibold text-ink/55 transition-colors hover:text-ink">
            Get alerts
          </Link>
        </div>
      </div>

      {/* ── aspirant journey ── */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-8">
        <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-ink/25">Your journey</p>
        <JourneyStepper />
      </div>

      {/* ── upcoming deadlines ── */}
      {deadlines.length > 0 && (
        <div className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-ink/30" />
              <span className="text-xs font-bold uppercase tracking-wider text-ink/40">Upcoming deadlines</span>
            </div>
            <Link href="/exam-calendar" className="text-xs font-medium text-brick hover:underline">
              View calendar <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          </div>
          <DeadlineStrip events={deadlines} />
        </div>
      )}

      {/* ── live ticker strip ── */}
      <LiveTicker items={featured.slice(0, 8)} />

      {/* ── featured carousel ── */}
      {featured.length > 0 && (
        <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
          <FeaturedCarousel items={featured.slice(0, 6)} />
        </div>
      )}
    </section>
  )
}
