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
import { handFont } from "@/components/home/fonts"
import { HomeSectionHeader } from "@/components/home/ui/HomeSectionHeader"
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
  <section className={cn("pb-4 pt-2", className)} aria-label="Recently viewed">
   <div className="hs-container">
    <div className="relative">
    <HomeSectionHeader
     eyebrow="welcome back"
     icon={History}
     className="mb-5"
     title="Pick up where you left off"
     mark="left off"
     subtitle={
      paused
       ? "History is paused. Resume whenever you want us to keep your place again."
       : `You were in the middle of ${items.length === 1 ? "this" : "these"}. We folded the corner${items.length === 1 ? "" : "s"} so you wouldn't lose your place.`
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
         data-active={active}
         className="hs-chip py-1.5 text-xs"
        >
         {f.label}
         <span
          className={cn(
           "hs-pill px-1.5 py-0.5 text-[10px] leading-none",
           active ? "bg-paper/20 text-paper" : "bg-paper-2 text-muted-foreground"
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
       className="hs-chip py-1.5 text-xs"
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
        className="hs-chip py-1.5 text-xs"
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
         className="hs-pill flex h-8 w-8 items-center justify-center border border-rule/60 text-muted-foreground transition-colors hover:border-[var(--hs-trust)] hover:text-[var(--hs-trust)]"
        >
         <ChevronLeft className="h-4 w-4" />
        </button>
        <button
         onClick={() => scrollBy(1)}
         aria-label="Scroll right"
         className="hs-pill flex h-8 w-8 items-center justify-center border border-rule/60 text-muted-foreground transition-colors hover:border-[var(--hs-trust)] hover:text-[var(--hs-trust)]"
        >
         <ChevronRight className="h-4 w-4" />
        </button>
       </span>
      )}
     </div>
    </div>

    {visible.length === 0 ? (
     <div className="hs-r flex flex-col items-start gap-2 bg-paper-2 px-6 py-8">
      <RotateCcw className="h-5 w-5 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">No visits in this category yet</p>
      <button
       onClick={() => setFilter("all")}
       className="text-xs font-medium text-[var(--hs-trust)] underline decoration-1 underline-offset-4 hover:decoration-2"
      >
       Show all activity
      </button>
     </div>
    ) : (
     <div
      ref={scrollerRef}
      className="hs-scroll mx-0 flex min-w-0 snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-3 pt-2"
     >
      {visible.map((item, idx) => {
       const meta = TYPE_META[item.type] ?? TYPE_META.page
       const Icon = meta.icon
       const showProgress = item.progress > 5 && item.progress < 100
       return (
        <article
         key={item.href}
         className={cn(
          "group relative flex w-[78vw] max-w-[270px] flex-none snap-start flex-col bg-[var(--hs-paper-slip)] px-4 pb-4 pt-5 sm:w-[270px] sm:max-w-none",
          idx % 2 ? "rotate-[0.6deg]" : "-rotate-[0.5deg]"
         )}
         style={{
          clipPath: "polygon(0 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 0 100%)",
          filter: "drop-shadow(0 1px 1px rgb(60 40 10 / .1)) drop-shadow(0 8px 10px rgb(60 40 10 / .12))",
         }}
        >
         {/* the folded (dog-eared) corner */}
         <span
          className="absolute right-0 top-0 h-[26px] w-[26px]"
          style={{
           background: "linear-gradient(225deg, transparent 50%, color-mix(in oklch, var(--hs-paper-slip) 80%, var(--color-ink)) 50%)",
           boxShadow: "-2px 2px 3px rgb(0 0 0 / .08)",
          }}
          aria-hidden
         />
         {/* ribbon bookmark on pages you're half-way through */}
         {showProgress && (
          <span className="absolute left-4 top-0 block" aria-hidden>
           <svg width="14" height="40" viewBox="0 0 14 40">
            <path d="M0 0 H14 V40 L7 33 L0 40 Z" fill="var(--color-brick)" opacity=".85" />
           </svg>
          </span>
         )}

         <div className={cn("mb-2 flex items-center justify-between gap-2", showProgress && "pl-6")}>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--hs-trust)]">
           <Icon className="h-3.5 w-3.5" />
           {meta.label}
          </span>
          <button
           onClick={() => removeViewedItem(item.href)}
           aria-label={`Remove ${item.title} from history`}
           title="Remove"
           className="mr-5 flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-[var(--color-brick)]"
          >
           <X className="h-3.5 w-3.5" />
          </button>
         </div>

         <Link href={item.href} title={item.title}>
          <h3 className="line-clamp-2 min-h-[2.6em] text-[15px] font-bold leading-snug text-foreground decoration-[var(--hs-trust)] decoration-2 underline-offset-[3px] group-hover:underline">
           {item.title}
          </h3>
         </Link>

         <p className="mt-1.5 text-[11.5px] text-muted-foreground">
          {timeAgo(item.visitedAt)}
          {item.visits > 1 && <span> · opened {item.visits} times</span>}
         </p>

         {/* where you stopped, marked in pencil */}
         <div className="mt-3">
          <div className="relative h-[3px] rounded-full bg-[color-mix(in_oklch,var(--color-ink)_8%,transparent)]">
           <div
            className="h-full rounded-full"
            style={{
             width: `${Math.max(item.progress, 4)}%`,
             background: "color-mix(in oklch, var(--color-ink) 45%, transparent)",
            }}
           />
           {showProgress && (
            <span className="absolute -top-1.5 h-[15px] w-[2px] rotate-[8deg] bg-[var(--color-brick)]" style={{ left: `${item.progress}%` }} aria-hidden />
           )}
          </div>
          <p className={cn(handFont.className, "mt-1 text-[0.95rem] text-foreground/60")}>
           {item.progress >= 100 ? "read it all" : showProgress ? `stopped about ${item.progress}% in` : "just had a glance"}
          </p>
         </div>

         <Link
          href={item.href}
          className={cn(handFont.className, "mt-2 inline-flex items-center self-start text-[1.05rem] text-[var(--hs-trust)] hover:underline")}
         >
          {showProgress ? "continue reading →" : "open again →"}
         </Link>
        </article>
       )
      })}
     </div>
    )}
    </div>
   </div>
  </section>
 )
}
