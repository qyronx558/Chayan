"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Eye, Flame } from "lucide-react"
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

const LABEL: Record<ModuleKey, string> = {
 jobs: "Gov jobs",
 results: "Results",
 "admit-cards": "Admit cards",
 "answer-keys": "Answer keys",
 syllabus: "Syllabus",
 admissions: "Admissions",
 "private-jobs": "Private jobs",
 blog: "Blog",
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
   <div className="border-t-2 border-rule-2 pt-3">
    <div className="h-3 w-16 animate-pulse bg-paper-3" />
    <div className="mt-3 h-4 w-3/4 animate-pulse bg-paper-3" />
    <div className="mt-2 h-3 w-1/2 animate-pulse bg-paper-2" />
    <div className="mt-6 h-3 w-24 animate-pulse bg-paper-2" />
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
  <section className={cn("py-16", className)}>
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-6 flex min-w-0 items-end justify-between gap-3 border-b border-rule pb-2">
     <div className="flex min-w-0 items-baseline gap-2.5">
      <Flame className="h-4 w-4 shrink-0 self-center text-muted-foreground" aria-hidden />
      <div className="min-w-0">
       <h2 className="font-display text-[1.6rem] font-bold leading-tight text-foreground sm:text-[1.9rem]">
        Trending now
       </h2>
       <p className="mt-1 text-sm text-muted-foreground">
        What aspirants are viewing most across every section
       </p>
      </div>
     </div>
    </div>

    <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
     {(["all", ...MODULES] as Array<ModuleKey | "all">).map((m) => {
      const active = filter === m
      return (
       <button
        key={m}
        onClick={() => setFilter(m)}
        className={cn(
         "shrink-0 whitespace-nowrap border px-4 py-1.5 text-[13px] transition-colors",
         active
          ? "border-ink bg-ink font-medium text-paper"
          : "border-rule bg-transparent font-medium text-muted-foreground hover:border-brick hover:text-brick"
        )}
       >
        {m === "all" ? "All" : LABEL[m]}
       </button>
      )
     })}
    </div>

    <div className="relative">
     <div
      ref={trackRef}
      onScroll={updateEdges}
      className="no-scrollbar flex min-w-0 snap-x snap-mandatory gap-8 overflow-x-auto scroll-smooth pb-4"
     >
      {loading
       ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
       : flat.map(({ module, item, rank, views, fallback, windowDays }) => {
         return (
          <div
           key={`${module}-${item.id}`}
           className="w-[300px] max-w-[85vw] shrink-0 snap-start sm:w-[320px]"
          >
           <Link href={HREF[module](item.slug)} className="group block border-t-2 border-rule-2 pt-3">
            <div className="flex items-baseline justify-between gap-2">
             <span className="agate text-xs text-brick">{LABEL[module]}</span>
             <span className="agate text-2xl font-bold leading-none text-rule-2">
              {String(rank).padStart(2, "0")}
             </span>
            </div>
            <h3 className="mt-2 line-clamp-2 font-display text-[1.1rem] font-bold leading-snug text-foreground transition-colors group-hover:text-brick">
             {item.title ?? item.name ?? "Untitled"}
            </h3>
            {orgOf(item) && (
             <p className="mt-1 truncate text-sm text-muted-foreground">{orgOf(item)}</p>
            )}
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-rule pt-2.5">
             <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">
               {!fallback && views > 0
                ? `${formatCompact(views)} views, ${windowDays}d`
                : "Recently added"}
              </span>
             </span>
             <span className="shrink-0 text-xs font-medium text-brick underline decoration-1 underline-offset-4 group-hover:decoration-2">
              View
             </span>
            </div>
           </Link>
          </div>
         )
        })}
     </div>

     {canRight && !loading && (
      <button
       onClick={() => nudge(1)}
       aria-label="Scroll trending right"
       className="absolute right-0 top-1/2 z-10 flex h-16 w-8 -translate-y-1/2 items-center justify-center border border-rule bg-background text-foreground transition-colors hover:border-brick hover:text-brick"
      >
       <ChevronRight className="h-5 w-5" />
      </button>
     )}
     {canLeft && !loading && (
      <button
       onClick={() => nudge(-1)}
       aria-label="Scroll trending left"
       className="absolute left-0 top-1/2 z-10 flex h-16 w-8 -translate-y-1/2 items-center justify-center border border-rule bg-background text-foreground transition-colors hover:border-brick hover:text-brick"
      >
       <ChevronLeft className="h-5 w-5" />
      </button>
     )}
    </div>
   </div>
  </section>
 )
}
