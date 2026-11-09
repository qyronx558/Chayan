/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, FileCheck2, IdCard, KeyRound, Briefcase } from "lucide-react"
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
    <section className="w-full bg-ink text-paper">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 border-b border-paper/20 py-3">
          <p className="agate text-[11px] text-paper/60">
            ChayanJobs · Government & private careers desk
          </p>
          <p className="agate hidden text-[11px] text-paper/50 sm:block">
            <span ref={todayRef} suppressHydrationWarning>
              Updated hourly
            </span>
          </p>
        </div>

        <div className="grid min-w-0 gap-10 py-10 lg:grid-cols-12 lg:gap-12 lg:py-14">
          <div className="min-w-0 lg:col-span-7">
            <p className="agate text-[11px] text-brick">The trusted job index</p>
            <h1 className="mt-3 break-words font-display text-[2.4rem] font-bold leading-[1.02] text-paper sm:text-[3rem] lg:text-[3.4rem]">
              Find the right job, <span className="text-brick">government or private</span>.
              Apply with confidence.
            </h1>
            <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-paper/70">
              Verified government and private-sector openings, plus results and admit cards
              from trusted recruiters. One clear desk, no noise.
            </p>

            <div className="mt-7 max-w-xl">
              <SearchBar embedded tone="dark" align="left" />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 bg-paper px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-paper-2"
              >
                Browse live jobs
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="#alerts"
                className="inline-flex items-center gap-2 border border-paper/35 px-5 py-3 text-sm font-semibold text-paper transition-colors hover:border-paper/70 hover:bg-paper/5"
              >
                Get job alerts
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-paper/15 pt-4">
              {heroLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="agate inline-flex items-center gap-1.5 text-[11px] text-paper/55 transition-colors hover:text-paper"
                >
                  <item.icon className="h-3.5 w-3.5" aria-hidden />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <aside className="min-w-0 lg:col-span-5" aria-label="Featured update">
            {lead ? (
              <article className="border border-paper/20">
                {lead.image && (
                  <img
                    src={lead.image}
                    alt={lead.title}
                    className="aspect-[16/9] w-full border-b border-paper/20 object-cover"
                    loading="eager"
                  />
                )}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="agate text-[10px] text-brick">{leadBadge}</span>
                    {lead.isPinned && (
                      <span className="agate text-[10px] text-paper/45">Pinned</span>
                    )}
                  </div>
                  <h2 className="mt-2 font-display text-xl font-bold leading-snug text-paper">
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
              <div className="flex h-full min-h-[15rem] flex-col justify-between border border-paper/20 p-5">
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
              <ul className="mt-4 border-t border-paper/20">
                {secondary.map((item) => (
                  <li key={item.id} className="border-b border-paper/15 last:border-b-0">
                    <Link
                      href={featuredHref(item)}
                      className="group flex items-baseline gap-3 py-2.5"
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

        <dl className="grid min-w-0 grid-cols-2 gap-y-0 border-t border-paper/20 md:grid-cols-4">
          {LEDGER.map((item, i) => {
            const value = stats ? Number(stats[item.key] ?? 0) : null
            return (
              <div
                key={item.key}
                className={
                  "flex flex-col gap-1 py-4 md:py-5" +
                  (i > 0 ? " md:border-l md:border-paper/20 md:pl-5" : "")
                }
              >
                <dt className="agate text-[10px] text-paper/50">{item.label}</dt>
                <dd className="font-display text-2xl font-bold leading-none text-paper">
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
