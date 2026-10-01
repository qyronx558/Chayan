"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  History,
  Briefcase,
  Award,
  IdCard,
  KeyRound,
  GraduationCap,
  Building2,
  Newspaper,
  BookOpen,
  Globe,
  X,
  Trash2,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
  Compass,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionHeader } from "@/components/ui/section-header"
import {
  clearViewedItems,
  getViewedItems,
  isHistoryPaused,
  onViewedUpdate,
  removeViewedItem,
  setHistoryPaused,
  timeAgo,
  type ViewedItem,
  type ViewedItemType,
} from "@/lib/recently-viewed"

const TYPE_META: Record<ViewedItemType, { label: string; gradient: string; icon: typeof Briefcase }> = {
  job: { label: "Job", gradient: "from-blue-600 to-indigo-800", icon: Briefcase },
  result: { label: "Result", gradient: "from-emerald-600 to-teal-800", icon: Award },
  admit_card: { label: "Admit Card", gradient: "from-amber-500 to-orange-700", icon: IdCard },
  answer_key: { label: "Answer Key", gradient: "from-indigo-600 to-violet-800", icon: KeyRound },
  admission: { label: "Admission", gradient: "from-cyan-600 to-sky-800", icon: GraduationCap },
  private_job: { label: "Private Job", gradient: "from-violet-600 to-purple-800", icon: Building2 },
  blog: { label: "Article", gradient: "from-teal-600 to-emerald-800", icon: Newspaper },
  syllabus: { label: "Syllabus", gradient: "from-rose-500 to-pink-700", icon: BookOpen },
  page: { label: "Page", gradient: "from-slate-600 to-gray-800", icon: Globe },
}

const FILTERS: { value: ViewedItemType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "job", label: "Jobs" },
  { value: "result", label: "Results" },
  { value: "admit_card", label: "Admit Cards" },
  { value: "blog", label: "Articles" },
]

export function RecentlyViewed({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<ViewedItem[]>([])
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState<ViewedItemType | "all">("all")
  const scrollerRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(() => {
    setItems(getViewedItems())
    setPaused(isHistoryPaused())
  }, [])

  useEffect(() => {
    setMounted(true)
    refresh()
    return onViewedUpdate(refresh)
  }, [refresh])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const i of items) map.set(i.type, (map.get(i.type) ?? 0) + 1)
    return map
  }, [items])

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.type === filter)),
    [items, filter]
  )

  const scrollBy = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" })
  }

  if (!mounted) return null

  return (
    <section className={cn("py-16 pt-0", className)} aria-label="Recently viewed">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          icon={History}
          title="Continue Exploring"
          subtitle={
            paused
              ? "History is paused - resume to keep tracking what you view"
              : items.length > 0
                ? `Pick up where you left off · ${items.length} recent ${items.length === 1 ? "visit" : "visits"}`
                : "Pages you open will appear here automatically"
          }
        />

        {/* Controls row: filters + history actions */}
        <div className="mb-5 flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter history by type">
            {FILTERS.map((f) => {
              const count = f.value === "all" ? items.length : (counts.get(f.value) ?? 0)
              const active = filter === f.value
              return (
                <button
                  key={f.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                    active
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700"
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                      active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setHistoryPaused(!paused)}
              title={paused ? "Resume history" : "Pause history"}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-700"
            >
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{paused ? "Resume" : "Pause"}</span>
            </button>
            {items.length > 0 && (
              <button
                onClick={() => {
                  clearViewedItems()
                  setFilter("all")
                }}
                title="Clear all history"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:border-red-300 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear all</span>
              </button>
            )}
            {visible.length > 1 && (
              <span className="hidden items-center gap-1 md:flex">
                <button
                  onClick={() => scrollBy(-1)}
                  aria-label="Scroll left"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:border-blue-300 hover:text-blue-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => scrollBy(1)}
                  aria-label="Scroll right"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:border-blue-300 hover:text-blue-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </span>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-blue-700 text-white shadow-sm">
              <Compass className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900">Nothing here yet</p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-500">
                Like YouTube watch history - every job, result, admit card or article you open
                will show up here so you can jump back in one tap.
              </p>
            </div>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              <Link
                href="/jobs"
                className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Browse Jobs
              </Link>
              <Link
                href="/results"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700"
              >
                Check Results
              </Link>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center">
            <RotateCcw className="h-5 w-5 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">No visits in this category yet</p>
            <button
              onClick={() => setFilter("all")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Show all activity
            </button>
          </div>
        ) : (
          <div
            ref={scrollerRef}
            className="mx-0 flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 pt-1 [scrollbar-width:thin]"
          >
            {visible.map((item) => {
              const meta = TYPE_META[item.type] ?? TYPE_META.page
              const Icon = meta.icon
              const showProgress = item.progress > 5 && item.progress < 100
              return (
                <article
                  key={item.href}
                  className="group relative flex w-[78vw] max-w-[300px] flex-none snap-start flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10 sm:w-[300px] sm:max-w-none"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                        meta.gradient
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                        {meta.label}
                      </span>
                      <button
                        onClick={() => removeViewedItem(item.href)}
                        aria-label={`Remove ${item.title} from history`}
                        title="Remove"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <Link href={item.href} title={item.title}>
                    <h3 className="line-clamp-2 min-h-[2.6em] text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-blue-700">
                      {item.title}
                    </h3>
                  </Link>

                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {timeAgo(item.visitedAt)}
                    </span>
                    {item.visits > 1 && (
                      <span className="rounded-full bg-blue-50 px-1.5 py-0.5 font-semibold text-blue-700">
                        ×{item.visits} visited
                      </span>
                    )}
                  </p>

                  {/* Resume progress like Netflix / YouTube */}
                  <div className="mt-3">
                    {showProgress ? (
                      <>
                        <div className="h-1 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] font-medium text-gray-400">
                          {item.progress}% explored - continue reading
                        </p>
                      </>
                    ) : item.progress >= 100 ? (
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                        Fully explored
                      </p>
                    ) : (
                      <div className="h-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full w-[6%] rounded-full bg-gray-300" />
                      </div>
                    )}
                  </div>

                  <Link
                    href={item.href}
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 opacity-80 transition-all group-hover:gap-1.5 group-hover:opacity-100"
                  >
                    {showProgress ? "Resume" : "Revisit"}
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
