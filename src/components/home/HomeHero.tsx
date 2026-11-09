/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, FileCheck2, IdCard, KeyRound, Briefcase, Building2, BookOpen, ShieldCheck, Zap, Command } from "lucide-react"
import { SearchBar } from "@/components/home/SearchBar"
import type { FeaturedSlideItem } from "@/components/featured/FeaturedSlideView"
import { FEATURED_TYPE_BADGES } from "@/lib/featured"
import { formatCompact } from "@/lib/utils"

interface Stats {
  activeJobs: number
  totalJobs: number
  totalResults: number
  totalAdmitCards: number
  totalPrivateJobs: number
}

const LEDGER: { key: keyof Stats; label: string }[] = [
  { key: "activeJobs", label: "Live jobs" },
  { key: "totalResults", label: "Results" },
  { key: "totalAdmitCards", label: "Admit cards" },
  { key: "totalPrivateJobs", label: "Private roles" },
]

const heroLinks = [
  { label: "Govt jobs", href: "/jobs", icon: Briefcase },
  { label: "Results", href: "/results", icon: FileCheck2 },
  { label: "Admit cards", href: "/admit-cards", icon: IdCard },
  { label: "Answer keys", href: "/answer-keys", icon: KeyRound },
]

const TILES = [
  { label: "Govt jobs", hint: "Apply online", href: "/jobs", icon: Briefcase },
  { label: "Private jobs", hint: "Freshers & remote", href: "/private-jobs", icon: Building2 },
  { label: "Results", hint: "Merit & cut-offs", href: "/results", icon: FileCheck2 },
  { label: "Admit cards", hint: "Download hall ticket", href: "/admit-cards", icon: IdCard },
  { label: "Answer keys", hint: "Check your score", href: "/answer-keys", icon: KeyRound },
  { label: "Syllabus", hint: "Exam pattern", href: "/syllabus", icon: BookOpen },
]

function featuredHref(item: FeaturedSlideItem) {
  const href = item.linkUrl || item.ctaUrl || "/jobs"
  return href.startsWith("/") || href.startsWith("http") ? href : `https://${href}`
}

export function HomeHero() {
  const [featured, setFeatured] = useState<FeaturedSlideItem[] | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const todayRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/featured")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setFeatured(d.success ? d.data : [])
      })
      .catch(() => {
        if (!cancelled) setFeatured([])
      })
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) setStats(d.data)
      })
      .catch(() => {
        if (!cancelled) setStats(null)
      })
    if (todayRef.current) {
      const date = new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date())
      todayRef.current.textContent = `${date} · Updated hourly`
    }
    return () => {
      cancelled = true
    }
  }, [])

  const lead = featured?.[0] ?? null
  const secondary = featured?.slice(1, 4) ?? []
  const leadBadge = lead ? lead.badge || FEATURED_TYPE_BADGES[lead.type] || "Featured" : ""
  const leadHref = lead ? featuredHref(lead) : ""

  return (
    <section className="relative w-full overflow-hidden bg-ink text-paper">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brick/25 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-paper/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>
      <div className="relative mx-auto w-full max-w-[1400px] min-w-0 px-4 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-3 border-b border-paper/20 py-4">
          <p className="agate text-[11px] text-paper/60">
            ChayanJobs · Government & private careers desk
          </p>
          <p className="agate hidden text-[11px] text-paper/50 sm:block">
            <span ref={todayRef} suppressHydrationWarning>
              Updated hourly
            </span>
          </p>
        </div>

        <div className="grid min-w-0 gap-14 py-14 lg:grid-cols-12 lg:gap-16 lg:py-24">
          <div className="min-w-0 lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-paper/20 bg-paper/5 px-3 py-1 text-xs font-semibold text-paper/80 backdrop-blur">
              <Zap className="h-3.5 w-3.5 text-brick" aria-hidden /> The trusted job index · updated hourly
            </p>
            <h1 className="mt-6 break-words font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight text-paper sm:text-[3.6rem] lg:text-[4.4rem]">
              Find the right job, <span className="text-brick">government or private</span>.
              Apply with confidence.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/70">
              Verified government and private-sector openings, plus results and admit cards
              from trusted recruiters. One clear desk, no noise.
            </p>

            <div className="mt-10 max-w-2xl">
              <SearchBar embedded tone="dark" align="left" />
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-paper/50">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Forms &amp; PDFs open inside ChayanJobs</span>
                <span className="inline-flex items-center gap-1.5"><Command className="h-3.5 w-3.5" aria-hidden /> Paste any official link to open it here</span>
              </p>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-xl bg-paper px-6 py-3.5 text-sm font-semibold text-ink shadow-lg transition-all hover:-translate-y-0.5 hover:bg-paper-2"
              >
                Browse live jobs
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="#alerts"
                className="inline-flex items-center gap-2 rounded-xl border border-paper/35 px-6 py-3.5 text-sm font-semibold text-paper transition-colors hover:border-paper/70 hover:bg-paper/5"
              >
                Get job alerts
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {TILES.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="group flex items-center gap-3 rounded-2xl border border-paper/15 bg-paper/5 p-4 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-paper/40 hover:bg-paper/10"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper/10 text-paper group-hover:bg-brick">
                    <t.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-paper">{t.label}</span>
                    <span className="block truncate text-xs text-paper/50">{t.hint}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <aside className="min-w-0 lg:col-span-5" aria-label="Featured update">
            {lead ? (
              <article className="overflow-hidden rounded-3xl border border-paper/20 bg-paper/5 shadow-2xl backdrop-blur">
                {lead.image && (
                  <img
                    src={lead.image}
                    alt={lead.title}
                    className="aspect-[16/9] w-full border-b border-paper/20 object-cover"
                    loading="eager"
                  />
                )}
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-2">
                    <span className="agate text-[10px] text-brick">{leadBadge}</span>
                    {lead.isPinned && (
                      <span className="agate text-[10px] text-paper/45">Pinned</span>
                    )}
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold leading-snug text-paper">
                    {lead.title}
                  </h2>
                  {lead.organization && (
                    <p className="mt-1.5 truncate text-sm text-paper/65">{lead.organization}</p>
                  )}
                  {lead.info && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-paper/65">
                      {lead.info}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-paper/15 pt-3">
                    <Link
                      href={leadHref}
                      target={leadHref.startsWith("http") ? "_blank" : undefined}
                      rel={leadHref.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-paper underline decoration-1 underline-offset-4 hover:decoration-2"
                    >
                      {lead.ctaLabel || "Read the notice"}
                    </Link>
                    {lead.dateText && (
                      <span className="agate ml-auto text-[10px] text-paper/45">
                        {lead.dateText}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ) : (
              <div className="flex h-full min-h-[18rem] flex-col justify-between rounded-3xl border border-paper/20 bg-paper/5 p-8 backdrop-blur">
                <div>
                  <p className="agate text-[10px] text-brick">Start here</p>
                  <p className="mt-2 font-display text-xl font-bold leading-snug text-paper">
                    A clear path from notification to application.
                  </p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-px border-t border-paper/15 pt-3">
                  {heroLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="agate flex items-center gap-1.5 py-1 text-[11px] text-paper/60 transition-colors hover:text-paper"
                    >
                      <item.icon className="h-3.5 w-3.5" aria-hidden />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {secondary.length > 0 && (
              <ul className="mt-5 overflow-hidden rounded-2xl border border-paper/15 bg-paper/5 px-5">
                {secondary.map((item) => (
                  <li key={item.id} className="border-b border-paper/15 last:border-b-0">
                    <Link
                      href={featuredHref(item)}
                      className="group flex items-baseline gap-3 py-3.5"
                    >
                      <span className="agate shrink-0 text-[10px] text-brick">
                        {item.badge || FEATURED_TYPE_BADGES[item.type] || "Update"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-paper/80 transition-colors group-hover:text-paper">
                        {item.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        <dl className="grid min-w-0 grid-cols-2 gap-3 pb-14 md:grid-cols-4 md:gap-5">
          {LEDGER.map((item, i) => {
            const value = stats ? Number(stats[item.key] ?? 0) : null
            return (
              <div
                key={item.key}
                data-i={i}
                className="flex flex-col gap-2 rounded-2xl border border-paper/15 bg-paper/5 p-5 backdrop-blur md:p-6"
              >
                <dt className="agate text-[10px] text-paper/50">{item.label}</dt>
                <dd className="font-display text-4xl font-bold leading-none text-paper">
                  {value === null ? (
                    <span className="inline-block h-6 w-16 animate-pulse bg-paper/10" aria-hidden />
                  ) : value > 0 ? (
                    formatCompact(value)
                  ) : (
                    <span className="text-paper/35" aria-label="No data yet">
                      -
                    </span>
                  )}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}
