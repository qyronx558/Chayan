/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { SearchBar } from "@/components/home/SearchBar"
import type { FeaturedSlideItem } from "@/components/featured/FeaturedSlideView"
import { FEATURED_TYPE_BADGES } from "@/lib/featured"
import { formatCompact } from "@/lib/utils"

interface Stats {
  activeJobs: number
  totalResults: number
  totalAdmitCards: number
  totalPrivateJobs: number
}

const WORDS = ["government job", "private job", "result", "admit card"]

const STATS: { key: keyof Stats; label: string }[] = [
  { key: "activeJobs", label: "Live jobs" },
  { key: "totalPrivateJobs", label: "Private roles" },
  { key: "totalResults", label: "Results" },
  { key: "totalAdmitCards", label: "Admit cards" },
]

const LINKS = [
  { label: "Govt jobs", href: "/jobs" },
  { label: "Private jobs", href: "/private-jobs" },
  { label: "Results", href: "/results" },
  { label: "Admit cards", href: "/admit-cards" },
  { label: "Answer keys", href: "/answer-keys" },
  { label: "Syllabus", href: "/syllabus" },
]

function featuredHref(item: FeaturedSlideItem) {
  const href = item.linkUrl || item.ctaUrl || "/jobs"
  return href.startsWith("/") || href.startsWith("http") ? href : `https://${href}`
}

function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const dur = 900
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{formatCompact(n)}</>
}

export function HomeHero() {
  const [featured, setFeatured] = useState<FeaturedSlideItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
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
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setWordIdx((i) => (i + 1) % WORDS.length), 2400)
    return () => clearInterval(id)
  }, [])

  const lead = featured[0]
  const more = featured.slice(1, 5)

  return (
    <section className="w-full bg-paper text-ink">
      <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-16 text-center sm:px-8 sm:pb-24 sm:pt-24">
        <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
          Find your next
          <br />
          <span key={wordIdx} className="inline-block animate-[fadeIn_.5s_ease] text-brick">
            {WORDS[wordIdx]}
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base text-ink/60 sm:text-lg">
          Verified openings, results and admit cards in one place.
        </p>

        <div className="mx-auto mt-9 max-w-2xl">
          <SearchBar embedded tone="light" align="center" />
        </div>

        <nav aria-label="Browse" className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1.5 text-sm text-ink/65 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
          >
            Browse live jobs
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="#alerts"
            className="rounded-lg px-5 py-3 text-sm font-semibold text-ink/70 transition-colors hover:text-ink"
          >
            Get alerts
          </Link>
        </div>

        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-y-8 border-t border-ink/10 pt-10 sm:grid-cols-4">
          {STATS.map((s) => {
            const v = stats ? Number(stats[s.key] ?? 0) : 0
            return (
              <div key={s.key}>
                <dd className="font-display text-3xl font-bold tabular-nums">
                  {stats && v > 0 ? <CountUp value={v} /> : <span className="text-ink/25">–</span>}
                </dd>
                <dt className="mt-1 text-xs text-ink/50">{s.label}</dt>
              </div>
            )
          })}
        </dl>
      </div>
      {lead && (
        <div className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-8 sm:pb-24">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/50">Pinned &amp; trending</p>
          <div className="grid gap-6 md:grid-cols-5">
            <Link
              href={featuredHref(lead)}
              target={featuredHref(lead).startsWith("http") ? "_blank" : undefined}
              rel={featuredHref(lead).startsWith("http") ? "noopener noreferrer" : undefined}
              className="group overflow-hidden rounded-2xl border border-ink/10 transition-shadow hover:shadow-lg md:col-span-3"
            >
              {lead.image && (
                <img src={lead.image} alt={lead.title} className="aspect-[16/8] w-full object-cover" loading="eager" />
              )}
              <div className="p-6">
                <span className="text-xs font-semibold text-brick">
                  {lead.badge || FEATURED_TYPE_BADGES[lead.type] || "Featured"}
                  {lead.isPinned ? " · Pinned" : ""}
                </span>
                <h2 className="mt-2 font-display text-xl font-bold leading-snug sm:text-2xl">{lead.title}</h2>
                {lead.organization && <p className="mt-1 text-sm text-ink/60">{lead.organization}</p>}
                {lead.info && <p className="mt-2 line-clamp-2 text-sm text-ink/60">{lead.info}</p>}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold group-hover:underline">
                  {lead.ctaLabel || "Read more"} <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </div>
            </Link>
            {more.length > 0 && (
              <ul className="divide-y divide-ink/10 rounded-2xl border border-ink/10 px-5 md:col-span-2">
                {more.map((item) => (
                  <li key={item.id}>
                    <Link href={featuredHref(item)} className="group block py-4">
                      <span className="text-xs font-semibold text-brick">
                        {item.badge || FEATURED_TYPE_BADGES[item.type] || "Update"}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm text-ink/80 group-hover:text-ink">{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
