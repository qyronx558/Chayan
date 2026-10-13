"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight, Eye, Flame } from "lucide-react"
import { cn, formatCompact } from "@/lib/utils"

type ModuleKey =
  | "jobs"
  | "results"
  | "admit-cards"
  | "answer-keys"
  | "syllabus"
  | "admissions"
  | "private-jobs"
  | "blog"

const MODULES: ModuleKey[] = [
  "jobs",
  "results",
  "admit-cards",
  "answer-keys",
  "syllabus",
  "admissions",
  "private-jobs",
  "blog",
]

interface ModuleTheme {
  label: string
  gradient: string
  button: string
}

const THEME: Record<ModuleKey, ModuleTheme> = {
  jobs: { label: "Gov Jobs", gradient: "from-blue-900 to-blue-600", button: "bg-blue-50 text-blue-700" },
  results: { label: "Results", gradient: "from-emerald-900 to-emerald-600", button: "bg-emerald-50 text-emerald-700" },
  "admit-cards": { label: "Admit Cards", gradient: "from-violet-900 to-violet-600", button: "bg-violet-50 text-violet-700" },
  "answer-keys": { label: "Answer Keys", gradient: "from-amber-800 to-amber-500", button: "bg-amber-50 text-amber-700" },
  syllabus: { label: "Syllabus", gradient: "from-teal-900 to-teal-600", button: "bg-teal-50 text-teal-700" },
  admissions: { label: "Admissions", gradient: "from-rose-900 to-rose-600", button: "bg-rose-50 text-rose-700" },
  "private-jobs": { label: "Private Jobs", gradient: "from-slate-900 to-slate-600", button: "bg-slate-100 text-slate-700" },
  blog: { label: "Blog", gradient: "from-fuchsia-900 to-pink-600", button: "bg-pink-50 text-pink-700" },
}

const HREF: Record<ModuleKey, (slug: string) => string> = {
  jobs: (s) => `/apply/${s}`,
  results: (s) => `/result/${s}`,
  "admit-cards": (s) => `/admit-card/${s}`,
  "answer-keys": (s) => `/answer-key/${s}`,
  syllabus: (s) => `/syllabus/${s}`,
  admissions: (s) => `/admission/${s}`,
  "private-jobs": (s) => `/private-jobs/${s}`,
  blog: (s) => `/blog/${s}`,
}

interface TrendItem {
  id: string
  title?: string
  name?: string
  slug: string
  department?: { name: string } | null
  company?: { name: string } | null
  category?: { name: string } | null
}

interface ModuleBucket {
  items: TrendItem[]
  scores?: Record<string, number>
  views?: Record<string, number>
  fallback: boolean
  windowDays: number
}

const orgOf = (item: TrendItem): string =>
  item.department?.name ?? item.company?.name ?? item.category?.name ?? ""

function SkeletonCard() {
  return (
    <div className="w-[300px] max-w-[85vw] shrink-0 snap-start sm:w-[320px]">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)]">
        <div className="h-[150px] animate-pulse bg-slate-200" />
        <div className="space-y-2 px-3 py-4">
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </div>
  )
}

export function TrendingNow({ className }: { className?: string }) {
  const [data, setData] = useState<Record<ModuleKey, ModuleBucket> | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ModuleKey | "all">("all")
  const trackRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/trending/overview?limitPerModule=6")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) setData(json.data)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const flat = useMemo(() => {
    if (!data) return []
    const keys = filter === "all" ? MODULES : [filter]
    const out: Array<{
      module: ModuleKey
      item: TrendItem
      rank: number
      views: number
      fallback: boolean
      windowDays: number
    }> = []
    for (const key of keys) {
      const bucket = data[key]
      if (!bucket) continue
      bucket.items.forEach((item, i) =>
        out.push({
          module: key,
          item,
          rank: i + 1,
          views: bucket.views?.[item.id] ?? 0,
          fallback: bucket.fallback,
          windowDays: bucket.windowDays,
        })
      )
    }
    return out.slice(0, filter === "all" ? 12 : 6)
  }, [data, filter])

  const updateEdges = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    updateEdges()
    window.addEventListener("resize", updateEdges)
    return () => window.removeEventListener("resize", updateEdges)
  }, [updateEdges, flat.length, loading])

  const nudge = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" })
  }

  if (!loading && (!data || flat.length === 0)) return null

  return (
    <section className={cn("bg-[#F8FAFC] py-16", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F97316] to-[#EF4444] text-white shadow-lg shadow-orange-500/25">
            <Flame className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[30px] font-extrabold leading-tight tracking-tight text-[#0F172A]">
              Trending Now
            </h2>
            <p className="mt-0.5 text-sm text-[#64748B]">
              What aspirants are viewing most across every section
            </p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
          {(["all", ...MODULES] as Array<ModuleKey | "all">).map((m) => {
            const active = filter === m
            return (
              <button
                key={m}
                onClick={() => setFilter(m)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] transition-all",
                  active
                    ? "border-transparent bg-gradient-to-r from-[#F97316] to-[#EF4444] font-bold text-white shadow-md shadow-orange-500/25"
                    : "border-slate-200 bg-white font-semibold text-slate-700 hover:border-orange-300"
                )}
              >
                {m === "all" ? "All" : THEME[m].label}
              </button>
            )
          })}
        </div>

        {/* Carousel */}
        <div className="relative">
          <div
            ref={trackRef}
            onScroll={updateEdges}
            className="no-scrollbar flex min-w-0 snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-4"
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : flat.map(({ module, item, rank, views, fallback, windowDays }) => {
                  const theme = THEME[module]
                  return (
                    <div
                      key={`${module}-${item.id}`}
                      className="w-[300px] max-w-[85vw] shrink-0 snap-start sm:w-[320px]"
                    >
                      <Link href={HREF[module](item.slug)} className="group block">
                        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_-12px_rgba(15,23,42,0.3)]">
                          <div
                            className={cn(
                              "flex h-[150px] flex-col bg-gradient-to-br p-4 text-white",
                              theme.gradient
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="inline-flex max-w-[75%] items-center gap-1 truncate rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white">
                                <Flame className="h-3 w-3 shrink-0" />
                                <span className="truncate">{theme.label}</span>
                              </span>
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25 text-sm font-extrabold text-white">
                                {rank}
                              </span>
                            </div>
                            <h3 className="mt-auto line-clamp-2 text-[18px] font-bold leading-snug">
                              {item.title ?? item.name ?? "Untitled"}
                            </h3>
                            {orgOf(item) && (
                              <p className="mt-0.5 truncate text-sm text-white/80">{orgOf(item)}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 bg-white px-3 py-4">
                            <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-slate-500">
                              <Eye className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                {!fallback && views > 0
                                  ? `${formatCompact(views)} views · ${windowDays}d`
                                  : "Recently added"}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold",
                                theme.button
                              )}
                            >
                              View
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
                })}
          </div>

          {/* Right fade + edge button */}
          {canRight && !loading && (
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#F8FAFC] to-transparent" />
          )}
          {canRight && !loading && (
            <button
              onClick={() => nudge(1)}
              aria-label="Scroll trending right"
              className="absolute right-0 top-1/2 z-10 flex h-20 w-9 -translate-y-1/2 items-center justify-center rounded-l-full bg-white text-slate-600 shadow-lg transition-colors hover:bg-[#F97316] hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          {canLeft && !loading && (
            <button
              onClick={() => nudge(-1)}
              aria-label="Scroll trending left"
              className="absolute left-0 top-1/2 z-10 flex h-20 w-9 -translate-y-1/2 items-center justify-center rounded-r-full bg-white text-slate-600 shadow-lg transition-colors hover:bg-[#F97316] hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
