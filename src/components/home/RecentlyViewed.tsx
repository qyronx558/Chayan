"use client"

import { useMemo, useRef, useState, useSyncExternalStore } from "react"
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
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionHeader } from "@/components/ui/section-header"
import {
 clearViewedItems,
 getViewedItemsSnapshot,
 isHistoryPaused,
 onViewedUpdate,
 removeViewedItem,
 setHistoryPaused,
 timeAgo,
 type ViewedItem,
 type ViewedItemType,
} from "@/lib/recently-viewed"

const TYPE_META: Record<ViewedItemType, { label: string; icon: typeof Briefcase }> = {
 job: { label: "Job", icon: Briefcase },
 result: { label: "Result", icon: Award },
 admit_card: { label: "Admit card", icon: IdCard },
 answer_key: { label: "Answer key", icon: KeyRound },
 admission: { label: "Admission", icon: GraduationCap },
 private_job: { label: "Private job", icon: Building2 },
 blog: { label: "Article", icon: Newspaper },
 syllabus: { label: "Syllabus", icon: BookOpen },
 page: { label: "Page", icon: Globe },
}

const FILTERS: { value: ViewedItemType | "all"; label: string }[] = [
 { value: "all", label: "All" },
 { value: "job", label: "Jobs" },
 { value: "result", label: "Results" },
 { value: "admit_card", label: "Admit Cards" },
 { value: "blog", label: "Articles" },
]

const emptySubscribe = () => () => {}
const EMPTY_ITEMS: ViewedItem[] = []

export function RecentlyViewed({ className }: { className?: string }) {
 const mounted = useSyncExternalStore(
  emptySubscribe,
  () => true,
  () => false
 )
 const items = useSyncExternalStore(onViewedUpdate, getViewedItemsSnapshot, () => EMPTY_ITEMS)
 const paused = useSyncExternalStore(onViewedUpdate, isHistoryPaused, () => false)
 const [filter, setFilter] = useState<ViewedItemType | "all">("all")
 const scrollerRef = useRef<HTMLDivElement>(null)

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

  if (!mounted || items.length === 0) return null

  return (
  <section className={cn("py-12 sm:py-16", className)} aria-label="Recently viewed">
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeader
     icon={History}
     title="Continue Exploring"
     subtitle={
      paused
       ? "History is paused - resume to keep tracking what you view"
       : items.length > 0
        ? `Pick up where you left off, ${items.length} recent ${items.length === 1 ? "visit" : "visits"}`
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
          "inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-colors",
          active
           ? "border-ink bg-ink text-paper"
           : "border-rule bg-transparent text-muted-foreground hover:border-brick hover:text-brick"
         )}
        >
         {f.label}
         <span
          className={cn(
           "px-1.5 py-0.5 text-[10px] leading-none",
           active ? "border border-paper/30 text-paper" : "border border-rule text-muted-foreground"
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
       className="inline-flex items-center gap-1.5 border border-rule bg-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick"
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
        className="inline-flex items-center gap-1.5 border border-rule bg-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick"
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
         className="flex h-8 w-8 items-center justify-center border border-rule text-muted-foreground transition-colors hover:border-brick hover:text-brick"
        >
         <ChevronLeft className="h-4 w-4" />
        </button>
        <button
         onClick={() => scrollBy(1)}
         aria-label="Scroll right"
         className="flex h-8 w-8 items-center justify-center border border-rule text-muted-foreground transition-colors hover:border-brick hover:text-brick"
        >
         <ChevronRight className="h-4 w-4" />
        </button>
       </span>
      )}
     </div>
    </div>

    {visible.length === 0 ? (
     <div className="flex flex-col items-start gap-2 border-y border-rule bg-paper-2 px-6 py-10">
      <RotateCcw className="h-5 w-5 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">No visits in this category yet</p>
      <button
       onClick={() => setFilter("all")}
       className="text-xs font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2"
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
         className="group flex w-[78vw] max-w-[300px] flex-none snap-start flex-col border-t-2 border-rule-2 bg-transparent pt-3 sm:w-[300px] sm:max-w-none"
        >
         <div className="mb-3 flex items-start justify-between gap-2">
          <span className="flex h-9 w-9 items-center justify-center border border-rule text-foreground">
           <Icon className="h-4 w-4" />
          </span>
          <div className="flex items-center gap-1.5">
           <span className="agate text-[10px] text-muted-foreground">
            {meta.label}
           </span>
           <button
            onClick={() => removeViewedItem(item.href)}
            aria-label={`Remove ${item.title} from history`}
            title="Remove"
            className="flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-brick"
           >
            <X className="h-3.5 w-3.5" />
           </button>
          </div>
         </div>

         <Link href={item.href} title={item.title}>
          <h3 className="line-clamp-2 min-h-[2.6em] font-display text-[1rem] font-bold leading-snug text-foreground transition-colors group-hover:text-brick">
           {item.title}
          </h3>
         </Link>

         <p className="agate mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{timeAgo(item.visitedAt)}</span>
          {item.visits > 1 && (
           <span className="font-medium text-foreground">
            {item.visits} visits
           </span>
          )}
         </p>

         <div className="mt-3">
          {showProgress ? (
           <>
            <div className="h-1 overflow-hidden bg-paper-3">
             <div
              className="h-full bg-brick"
              style={{ width: `${item.progress}%` }}
             />
            </div>
            <p className="agate mt-1 text-[10px] text-muted-foreground">
             {item.progress}% explored
            </p>
           </>
          ) : item.progress >= 100 ? (
           <p className="agate text-[10px] text-muted-foreground">
            Fully explored
           </p>
          ) : (
           <div className="h-1 overflow-hidden bg-paper-3">
            <div className="h-full w-[6%] bg-rule-2" />
           </div>
          )}
         </div>

         <Link
          href={item.href}
          className="mt-3 inline-flex items-center text-[11px] font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2"
         >
          {showProgress ? "Resume" : "Revisit"}
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
