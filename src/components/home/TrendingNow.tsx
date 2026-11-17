"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Flame } from "lucide-react"
import { cn, formatCompact } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"

/*
 * "What others are reading" as a library card catalogue: each trending page
 * is a typed catalogue card (red header rule, punched rod hole), the filter
 * chips are drawer labels, and popularity is the date-stamp column that
 * fills up as more people "borrow" it.
 */
const RULE = "color-mix(in oklch, oklch(62% 0.09 240) 26%, transparent)"
const RED = "color-mix(in oklch, var(--color-brick) 60%, transparent)"
import { HomeSectionHeader } from "@/components/home/ui/HomeSectionHeader"

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
  <div className="w-[270px] max-w-[80vw] shrink-0 snap-start rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] p-4">
   <span className="hs-skel block h-3 w-16" />
   <span className="hs-skel mt-4 block h-4 w-11/12" />
   <span className="hs-skel mt-2 block h-4 w-2/3" />
   <span className="hs-skel mt-6 block h-3 w-24" />
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

 const arrows = (
  <div className="hidden items-center gap-1.5 sm:flex">
   {([-1, 1] as const).map((dir) => {
    const enabled = dir === 1 ? canRight : canLeft
    const Icon = dir === 1 ? ChevronRight : ChevronLeft
    return (
     <button
      key={dir}
      onClick={() => nudge(dir)}
      disabled={!enabled || loading}
      aria-label={dir === 1 ? "Scroll trending right" : "Scroll trending left"}
      className="hs-pill flex h-9 w-9 items-center justify-center border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] text-foreground transition-colors hover:border-[var(--hs-trust)] hover:text-[var(--hs-trust)] disabled:opacity-35"
     >
      <Icon className="h-4 w-4" />
     </button>
    )
   })}
  </div>
 )

 return (
  <div className={cn("min-w-0", className)}>
   <HomeSectionHeader
    eyebrow="what everyone’s opening"
    icon={Flame}
    title="What others are reading"
    mark="others"
    markStyle="highlight"
    subtitle="Like the library's most-borrowed shelf: the pages other aspirants keep coming back to this week."
    action={arrows}
   />

   {/* drawer labels of the catalogue cabinet */}
   <div className="hs-scroll mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by section">
    {(["all", ...MODULES] as Array<ModuleKey | "all">).map((m) => {
     const on = filter === m
     return (
      <button
       key={m}
       role="tab"
       aria-selected={on}
       onClick={() => setFilter(m)}
       className={cn(
        typeFont.className,
        "relative shrink-0 whitespace-nowrap rounded-[3px] border px-3 pb-2 pt-1.5 text-[12.5px] transition-colors",
        on
         ? "border-[oklch(55%_0.06_75)] bg-[color-mix(in_oklch,var(--hs-marigold)_30%,var(--hs-paper-slip))] font-bold text-foreground"
         : "border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] text-foreground/70 hover:text-foreground"
       )}
      >
       {m === "all" ? "ALL" : LABEL[m].toUpperCase()}
       {/* brass drawer pull */}
       <span
        className="absolute bottom-[3px] left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full"
        style={{ background: on ? "oklch(62% 0.1 80)" : "var(--hs-border-strong)" }}
        aria-hidden
       />
      </button>
     )
    })}
   </div>

   <div
    ref={trackRef}
    onScroll={updateEdges}
    className="hs-scroll -mx-1 flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-4 pt-4"
   >
    {loading
     ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
     : flat.map(({ module, item, rank, views, fallback, windowDays }, idx) => {
        const stamps = !fallback && views > 0 ? Math.max(1, Math.min(5, 6 - Math.ceil(rank / 1.3))) : 0
        return (
         <Link
          key={`${module}-${item.id}`}
          href={HREF[module](item.slug)}
          className={cn(
           typeFont.className,
           "group relative flex w-[270px] max-w-[80vw] shrink-0 snap-start flex-col rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] px-4 pb-8 pt-3 transition-transform duration-200 hover:-translate-y-1",
           idx % 2 ? "rotate-[0.5deg]" : "-rotate-[0.4deg]"
          )}
          style={{
           boxShadow: "0 1px 2px rgb(60 40 10 / .08), 0 12px 20px -16px rgb(60 40 10 / .5)",
           backgroundImage: `linear-gradient(to bottom, transparent 0, transparent 34px, ${RED} 34px, ${RED} 35px, transparent 35px), repeating-linear-gradient(to bottom, transparent 0, transparent 21px, ${RULE} 21px, ${RULE} 22px)`,
           backgroundPosition: "0 0, 0 35px",
          }}
         >
          {/* call number row */}
          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
           <span>{LABEL[module].toUpperCase()}</span>
           <span className="font-bold text-foreground/70">No. {String(rank).padStart(3, "0")}</span>
          </div>

          <h3 className="mt-4 line-clamp-3 font-[family-name:inherit] text-[14.5px] font-bold leading-[22px] text-foreground decoration-[var(--hs-trust)] decoration-2 underline-offset-2 group-hover:underline">
           {item.title ?? item.name ?? "Untitled"}
          </h3>
          {orgOf(item) && <p className="truncate text-[12px] leading-[22px] text-muted-foreground">{orgOf(item)}</p>}

          {/* borrowed: stamped marks */}
          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
           <span className="min-w-0">
            <span className="block text-[10px] text-muted-foreground">READ BY</span>
            <span className="block truncate text-[12.5px] font-bold text-foreground">
             {stamps ? `${formatCompact(views)} in ${windowDays} days` : "just added"}
            </span>
           </span>
           {stamps > 0 && (
            <span className="flex shrink-0 gap-0.5" aria-hidden>
             {Array.from({ length: stamps }).map((_, k) => (
              <span
               key={k}
               className="h-3.5 w-2.5 rounded-[1px] border"
               style={{
                borderColor: "color-mix(in oklch, var(--hs-stamp) 70%, transparent)",
                background: "color-mix(in oklch, var(--hs-stamp) 18%, transparent)",
                transform: `rotate(${((k % 3) - 1) * 4}deg)`,
               }}
              />
             ))}
            </span>
           )}
          </div>

          {idx === 0 && stamps > 0 && (
           <span className={cn(handFont.className, "absolute -top-3 right-3 rotate-[5deg] bg-[color-mix(in_oklch,var(--hs-marigold)_55%,white)] px-2 text-[0.9rem] text-[var(--hs-chit-ink)] shadow-[1px_2px_4px_rgb(0_0_0/.15)]")}>
            everyone&apos;s on this one
           </span>
          )}

          {/* rod hole at the bottom of every catalogue card */}
          <span
           className="absolute bottom-2.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full"
           style={{ background: "var(--color-paper)", boxShadow: "inset 0 1px 2px rgb(40 30 20 / .35)" }}
           aria-hidden
          />
         </Link>
        )
       })}
   </div>
  </div>
 )
}
