/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState, useRef, useCallback, type CSSProperties } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  Zap,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Building2,
  CreditCard,
  GraduationCap,
  Sparkles,
} from "lucide-react"
import { SearchBar } from "@/components/home/SearchBar"
import { useSiteStats, type SiteStats } from "@/components/home/use-site-stats"
import type { FeaturedSlideItem } from "@/components/featured/FeaturedSlideView"
import { FEATURED_TYPE_BADGES } from "@/lib/featured"
import { cn, formatCompact } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"

const WORDS = ["government job", "private job", "result", "admit card"]

const PROMISES = ["100% free", "Official sources only", "Updated every day"]

function featuredHref(item: FeaturedSlideItem) {
  const href = item.linkUrl || item.ctaUrl || "/jobs"
  return href.startsWith("/") || href.startsWith("http") ? href : `https://${href}`
}

function badgeOf(item: FeaturedSlideItem, fallback = "Featured") {
  return item.badge || FEATURED_TYPE_BADGES[item.type] || fallback
}

/* ── Live "now" card with featured carousel ── */
function LiveNowCard({ items }: { items: FeaturedSlideItem[] }) {
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>(null)
  const count = items.length

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (count > 1) timerRef.current = setInterval(() => setActive((i) => (i + 1) % count), 4500)
  }, [count])

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [resetTimer])

  const go = (dir: -1 | 1) => {
    setActive((i) => (i + dir + count) % count)
    resetTimer()
  }

  if (count === 0) return <LiveNowFallback />

  const item = items[active]
  const href = featuredHref(item)
  const external = href.startsWith("http")
  const others = items.map((it, i) => ({ it, i })).filter(({ i }) => i !== active).slice(0, 3)

  return (
    <div className="relative lg:rotate-[1.2deg]">
    {/* two strips of tape holding the cutting up */}
    <span className="absolute -top-3 left-8 z-20 h-6 w-20 -rotate-[8deg]" style={{ background: "color-mix(in oklch, var(--hs-marigold) 50%, transparent)", clipPath: "polygon(3% 0, 97% 4%, 100% 50%, 96% 100%, 2% 96%, 0 45%)" }} aria-hidden />
    <span className="absolute -top-3 right-8 z-20 h-6 w-20 rotate-[6deg]" style={{ background: "color-mix(in oklch, var(--hs-marigold) 50%, transparent)", clipPath: "polygon(3% 0, 97% 4%, 100% 50%, 96% 100%, 2% 96%, 0 45%)" }} aria-hidden />
    <div className="relative overflow-hidden rounded-[4px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] p-3 shadow-[0_1px_2px_rgb(60_40_10/.08),0_26px_50px_-30px_rgb(60_40_10/.55)] sm:p-4">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-[pulse-dot_1.5s_ease-in-out_infinite] rounded-full bg-brick opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brick" />
        </span>
        <span className="text-[13px] font-semibold text-foreground">Live now</span>
        <span className="text-xs text-muted-foreground">pinned &amp; trending</span>
        {count > 1 && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => go(-1)}
              className="hs-pill flex h-7 w-7 items-center justify-center border border-rule/50 text-muted-foreground transition-colors hover:border-[var(--hs-trust)] hover:text-[var(--hs-trust)]"
              aria-label="Previous"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="hs-tabular w-9 text-center text-[11px] text-muted-foreground">
              {active + 1}/{count}
            </span>
            <button
              onClick={() => go(1)}
              className="hs-pill flex h-7 w-7 items-center justify-center border border-rule/50 text-muted-foreground transition-colors hover:border-[var(--hs-trust)] hover:text-[var(--hs-trust)]"
              aria-label="Next"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="group block"
      >
        <div className="hs-r relative aspect-[16/9] overflow-hidden bg-paper-2">
          {item.image ? (
            <img
              key={item.id}
              src={item.image}
              alt={item.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              loading="eager"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--hs-trust-soft), color-mix(in oklch, var(--color-ink) 5%, transparent))",
              }}
            >
              <Zap className="hs-trust h-12 w-12 opacity-30" />
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgb(0 0 0 / .55), transparent 55%)" }}
          />
          <span className="hs-pill hs-bg-trust hs-caps absolute left-3 top-3 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold">
            <TrendingUp className="h-3 w-3" />
            {badgeOf(item)}
          </span>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h2
              key={item.id}
              className="line-clamp-2 text-lg font-bold leading-snug text-white sm:text-xl"
              style={{ animation: "fadeIn .4s ease" }}
            >
              {item.title}
            </h2>
            {item.organization && <p className="mt-1 truncate text-xs text-white/75">{item.organization}</p>}
          </div>
          {count > 1 && (
            <div className="absolute inset-x-4 bottom-1.5 h-[3px] overflow-hidden rounded-full bg-white/20">
              <div key={active} className="h-full animate-[progress-fill_4.5s_linear] rounded-full bg-white/80" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 px-1 pb-1 pt-3">
          <p className="line-clamp-1 min-w-0 text-[13px] text-muted-foreground">{item.info || item.dateText || "Tap to view full details"}</p>
          <span className="hs-trust inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold">
            {item.ctaLabel || "View"}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>

      {others.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-rule/40 pt-2">
          {others.map(({ it, i }) => (
            <li key={it.id}>
              <button
                onClick={() => {
                  setActive(i)
                  resetTimer()
                }}
                className="hs-row flex w-full items-center gap-3 px-2 py-2 text-left"
              >
                <span className="hs-icon-tile h-8 w-8">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-medium hs-trust">{badgeOf(it, "Update")}</span>
                  <span className="block truncate text-[13px] font-medium text-foreground">{it.title}</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
    <p className={cn(handFont.className, "mt-3 text-center text-[1rem] text-foreground/55")} aria-hidden>
      cut out from today&apos;s updates, pinned for you
    </p>
    </div>
  )
}

/* Shown when no featured items exist — still gives first-time visitors a clear map. */
function LiveNowFallback() {
  const rows = [
    { icon: Briefcase, title: "Government jobs", sub: "Central & state notifications", href: "/jobs" },
    { icon: Building2, title: "Private jobs", sub: "Verified companies hiring now", href: "/private-jobs" },
    { icon: GraduationCap, title: "Results", sub: "Declared results & merit lists", href: "/results" },
    { icon: CreditCard, title: "Admit cards", sub: "Download hall tickets", href: "/admit-cards" },
  ]
  return (
    <div className="relative hidden rotate-[1.2deg] lg:block">
      <span className="absolute -top-3 left-8 z-20 h-6 w-20 -rotate-[8deg]" style={{ background: "color-mix(in oklch, var(--hs-marigold) 50%, transparent)", clipPath: "polygon(3% 0, 97% 4%, 100% 50%, 96% 100%, 2% 96%, 0 45%)" }} aria-hidden />
      <span className="absolute -top-3 right-8 z-20 h-6 w-20 rotate-[6deg]" style={{ background: "color-mix(in oklch, var(--hs-marigold) 50%, transparent)", clipPath: "polygon(3% 0, 97% 4%, 100% 50%, 96% 100%, 2% 96%, 0 45%)" }} aria-hidden />
    <div
      className="rounded-[4px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] p-5 shadow-[0_1px_2px_rgb(60_40_10/.08),0_26px_50px_-30px_rgb(60_40_10/.55)]"
      style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, color-mix(in oklch, oklch(62% 0.09 240) 20%, transparent) 31px, color-mix(in oklch, oklch(62% 0.09 240) 20%, transparent) 32px)" }}
    >
      <p className={cn(handFont.className, "mb-2 px-1 text-[1.2rem] text-foreground")}>Not sure where to begin? Most people start here:</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="hs-row group flex items-center gap-3 px-2 py-3">
              <span className="hs-icon-tile h-10 w-10">
                <r.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{r.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{r.sub}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--hs-trust)]" />
            </Link>
          </li>
        ))}
      </ul>
      <p className={cn(handFont.className, "mt-2 px-1 text-right text-[1rem] text-[var(--color-brick)]")}>you&apos;ve got this →</p>
    </div>
    </div>
  )
}

/* ── Horizontal marquee of featured titles ── */
function LiveTicker({ items }: { items: FeaturedSlideItem[] }) {
  if (items.length === 0) return null
  const doubled = [...items, ...items]
  return (
    <div className="relative overflow-hidden border-y border-rule/40 bg-[var(--hs-surface)]">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16"
        style={{ background: "linear-gradient(to right, var(--hs-surface), transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16"
        style={{ background: "linear-gradient(to left, var(--hs-surface), transparent)" }}
      />
      <div className="flex w-max hover:[animation-play-state:paused]" style={{ animation: `ticker-scroll ${items.length * 5}s linear infinite` }}>
        {doubled.map((item, i) => (
          <Link key={`${item.id}-${i}`} href={featuredHref(item)} className="group flex shrink-0 items-center gap-2.5 px-5 py-3">
            <span className="hs-trust text-[11px] font-semibold">{badgeOf(item, "New")}</span>
            <span className="whitespace-nowrap text-[13px] text-muted-foreground transition-colors group-hover:text-foreground">
              {item.title}
            </span>
            <span className="text-rule" aria-hidden>
              •
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ── Quiet numbers strip ── */
function StatsStrip({ stats }: { stats: SiteStats | null }) {
  const tiles = [
    { label: "government jobs open", value: stats?.activeJobs, href: "/jobs" },
    { label: "private openings", value: stats?.totalPrivateJobs, href: "/private-jobs" },
    { label: "results declared", value: stats?.totalResults, href: "/results" },
    { label: "admit cards out", value: stats?.totalAdmitCards, href: "/admit-cards" },
  ]
  return (
    <div
      className="relative grid grid-cols-2 overflow-hidden bg-[var(--hs-paper-slip)] lg:grid-cols-4"
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 5px), 97% 100%, 93% calc(100% - 4px), 88% 100%, 82% calc(100% - 5px), 76% 100%, 70% calc(100% - 3px), 63% 100%, 57% calc(100% - 5px), 50% 100%, 44% calc(100% - 4px), 37% 100%, 31% calc(100% - 5px), 24% 100%, 18% calc(100% - 3px), 11% 100%, 5% calc(100% - 5px), 0 100%)",
        filter: "drop-shadow(0 6px 8px rgb(60 40 10 / .12))",
        backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 27px, color-mix(in oklch, oklch(62% 0.09 240) 22%, transparent) 27px, color-mix(in oklch, oklch(62% 0.09 240) 22%, transparent) 28px)",
      }}
    >
      {tiles.map((t, i) => (
        <Link
          key={t.label}
          href={t.href}
          className={cn(
            "group flex flex-col px-5 py-4 transition-colors hover:bg-[var(--hs-surface-2)] sm:px-6 sm:py-5",
            i % 2 === 1 && "border-l border-[var(--hs-border)]",
            i >= 2 && "border-t border-[var(--hs-border)] lg:border-t-0",
            i === 2 && "lg:border-l"
          )}
        >
          {stats ? (
            <span className={cn(handFont.className, "text-[2.3rem] leading-none text-foreground")}>
              {formatCompact(t.value ?? 0)}
            </span>
          ) : (
            <span className="hs-skel block h-7 w-12" />
          )}
          <span className="mt-1.5 text-[13px] text-muted-foreground transition-colors group-hover:text-[var(--hs-trust)]">
            {t.label}
          </span>
        </Link>
      ))}
    </div>
  )
}

export function HomeHero() {
  const [featured, setFeatured] = useState<FeaturedSlideItem[]>([])
  const stats = useSiteStats()
  const [wordIdx, setWordIdx] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch("/api/featured")
      .then((r) => r.json())
      .then((d) => !cancelled && setFeatured(d.success ? d.data : []))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setWordIdx((i) => (i + 1) % WORDS.length), 2400)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative w-full text-foreground">
      <div className="hs-container relative z-20 grid items-start gap-10 pb-10 pt-10 sm:pt-14 lg:grid-cols-12 lg:gap-14 lg:pb-12 lg:pt-16">
        {/* ── left: pitch + search ── */}
        <div className="relative z-30 min-w-0 lg:col-span-7">
          <span
            className={cn(handFont.className, "absolute -top-6 left-[15.5rem] hidden rotate-[-4deg] text-[1.05rem] text-[var(--color-brick)] lg:block")}
            aria-hidden
          >
            the one you&apos;ve been waiting for
            <svg width="30" height="34" viewBox="0 0 30 34" fill="none" className="ml-1 inline-block align-top">
              <path d="M26 3 C 24 16, 16 24, 5 29" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M5 21 L4 30 L13 31" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="text-[2.6rem] font-bold leading-[1.05] text-foreground sm:text-[3.6rem] lg:text-[4.1rem]">
            Find your next
            <span className="block overflow-hidden pb-1" style={{ height: "1.18em" }}>
              <span
                key={wordIdx}
                className="hs-highlight"
                style={{ animation: "slide-up .45s cubic-bezier(.16,1,.3,1)" }}
              >
                {WORDS[wordIdx]}
              </span>
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            Government and private jobs, results, admit cards and answer keys, checked against official sources and
            kept in one calm place, so you can spend less time searching and{" "}
            <span className="relative inline-block text-foreground">
              more time preparing.
              <svg viewBox="0 0 200 10" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 h-2.5 w-full" aria-hidden>
                <path
                  className="hs-draw"
                  d="M2 6 C 40 2, 90 9, 130 5 S 185 3, 198 6"
                  fill="none"
                  stroke="var(--hs-marigold)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ ["--len" as string]: 220, animationDelay: "1.2s" } as CSSProperties}
                />
              </svg>
            </span>
          </p>

          {/* z-index keeps the live search suggestions above everything that follows */}
          <div className="relative z-40 mt-7 max-w-2xl">
            <SearchBar embedded tone="light" align="left" />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/jobs" className="hs-btn hs-btn-dark">
              Browse government jobs
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/private-jobs" className="hs-btn hs-btn-ghost">
              Explore private jobs
            </Link>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {PROMISES.map((p) => (
              <li key={p} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <svg viewBox="0 0 28 24" className="h-4 w-5 text-[var(--hs-trust)]" fill="none" aria-hidden>
                  <path d="M3 13.5 C 5.5 15, 8 18, 10 21 C 13 13, 18 7, 25 2.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* ── right: live card ── */}
        <div className="relative z-10 min-w-0 lg:col-span-5 lg:pt-2">
          <LiveNowCard items={featured.slice(0, 6)} />
        </div>
      </div>

      <div className="hs-container relative z-0 pb-10">
        <StatsStrip stats={stats} />
      </div>

      <LiveTicker items={featured.slice(0, 8)} />
    </section>
  )
}
