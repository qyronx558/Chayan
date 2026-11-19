"use client"

import { useState, useMemo, useCallback, type CSSProperties } from "react"
import Link from "next/link"
import { Search, Eye, TrendingUp, FileText } from "lucide-react"
import { formatDate, truncate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import "@/app/home.css"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { InfiniteListFooter } from "@/components/ui/infinite-list-footer"
import { SmartExternalLink } from "@/components/shared/SmartExternalLink"
import { useDataVersion, withDataVersion } from "@/components/providers/DataVersion"

function recordView(id: string) {
 fetch(`/api/notifications/${id}/view`, { method: "POST" }).catch(() => {})
}

interface Notification {
 id: string
 title: string
 slug: string
 content: string | null
 type: string | null
 officialUrl: string | null
 href: string | null
 isTrending: boolean
 views: number
 createdAt: string
 category: { id: string; name: string; slug: string }
}

interface Category {
 id: string
 name: string
 slug: string
}

interface NotificationsClientProps {
 notifications: Notification[]
 categories: Category[]
}

type FilterType = "all" | "trending" | "category"

export function NotificationsClient({ notifications: initialNotifications, categories }: NotificationsClientProps) {
 const dataVersion = useDataVersion()
 const [notifications, setNotifications] = useState(initialNotifications)
 const [search, setSearch] = useState("")
 const [filter, setFilter] = useState<FilterType>("all")
 const [selectedCategory, setSelectedCategory] = useState("")
 const [page, setPage] = useState(1)
 const [isLoadingMore, setIsLoadingMore] = useState(false)
 const [hasMore, setHasMore] = useState(initialNotifications.length >= 20)
 const [loadMoreError, setLoadMoreError] = useState("")
 const perPage = 10

 const filteredNotifications = useMemo(() => {
  let result = [...notifications]

  if (filter === "trending") {
   result = result.filter((n) => n.isTrending)
  }

  if (filter === "category" && selectedCategory) {
   result = result.filter((n) => n.category.id === selectedCategory)
  }

  if (search) {
   const q = search.toLowerCase()
   result = result.filter(
    (n) =>
     n.title.toLowerCase().includes(q) ||
     n.category.name.toLowerCase().includes(q) ||
     (n.content && n.content.toLowerCase().includes(q))
   )
  }

  return result
 }, [notifications, filter, selectedCategory, search])

 const paginatedNotifications = filteredNotifications.slice(0, page * perPage)
 const hasMoreFiltered = filteredNotifications.length > paginatedNotifications.length

 const loadMore = useCallback(async () => {
  if (isLoadingMore) return
  // More locally-filtered items to reveal - no network needed.
  if (hasMoreFiltered) {
   setPage((p) => p + 1)
   return
  }
  if (!hasMore) return
  setIsLoadingMore(true)
  setLoadMoreError("")
  try {
   const serverPage = Math.floor(notifications.length / 10) + 1
   const res = await fetch(withDataVersion(`/api/notifications?page=${serverPage}&limit=10`, dataVersion))
   if (res.ok) {
    const json = await res.json()
    if (json.success && json.data.length > 0) {
     setNotifications((prev) => {
      const existing = new Set(prev.map((n) => n.id))
      const newItems = json.data.filter((n: Notification) => !existing.has(n.id))
      return [...prev, ...newItems]
     })
     setPage((p) => p + 1)
     setHasMore(json.data.length >= 10)
    } else {
     setHasMore(false)
    }
   } else {
    setLoadMoreError("Failed to load more. Please retry.")
   }
  } catch {
   setLoadMoreError("Failed to load more. Please retry.")
  } finally {
   setIsLoadingMore(false)
  }
 }, [isLoadingMore, hasMoreFiltered, hasMore, notifications.length, dataVersion])

 // Amazon-style: auto-reveal next batch on scroll, button stays as fallback.
 const sentinelRef = useInfiniteScroll({
  hasMore: hasMore || hasMoreFiltered,
  isLoading: isLoadingMore,
  onLoadMore: loadMore,
 })

 return (
  <div className="home-saas text-foreground">
  <div className="container mx-auto max-w-4xl px-4 pb-16 pt-10">
   {/* ---- Hero: the wire comes in ---- */}
   <header className="text-center">
    <MorseLine />
    <p className={cn(handFont.className, "mt-3 text-[1.25rem] text-[var(--color-brick)]")}>notifications</p>
    <h1 className="mt-1 font-display text-[2.4rem] font-black leading-[1.05] text-foreground sm:text-[3.3rem]">
     Telegrams from the exam desk.
    </h1>
    <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
     Short, urgent and to the point, the way news used to arrive at the door. Every government job notice and
     announcement, the moment it is out.
    </p>
   </header>

   {/* ---- Search + filters ---- */}
   <div className="mt-10 flex flex-col items-center gap-5">
    <div className="group relative flex h-12 w-full max-w-lg items-center rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] pl-4 pr-2 transition-[border-color,box-shadow] focus-within:border-[var(--hs-trust)] focus-within:shadow-[0_0_0_4px_var(--hs-trust-soft)]">
     <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
     <input
      placeholder="Search notifications..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      aria-label="Search notifications"
      className="min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
     />
     <span className={cn(typeFont.className, "hidden shrink-0 pr-2 text-[10.5px] text-muted-foreground sm:inline")}>STOP</span>
    </div>

    <div className="flex flex-wrap justify-center gap-x-1 gap-y-2" role="group" aria-label="Filter notifications">
     {[
      { key: "all", label: "All", active: filter === "all", on: () => { setFilter("all"); setSelectedCategory("") } },
      { key: "trending", label: "Urgent", active: filter === "trending", on: () => { setFilter("trending"); setSelectedCategory("") } },
      ...categories.map((cat) => ({
       key: cat.id,
       label: cat.name,
       active: filter === "category" && selectedCategory === cat.id,
       on: () => { setFilter("category"); setSelectedCategory(cat.id) },
      })),
     ].map((f, i) => (
      <button
       key={f.key}
       type="button"
       aria-pressed={f.active}
       onClick={f.on}
       className={cn("relative px-3.5 py-1.5 text-[13.5px] transition-colors", f.active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground")}
      >
       {f.active && (
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
         <path className="hs-draw" d={i % 2 ? "M55 3 C 84 2, 98 10, 97 20 C 96 31, 74 37, 50 37 C 24 37, 3 31, 3 20 C 3 9, 22 3, 46 3 C 58 3, 68 4, 76 7" : "M45 3 C 16 3, 2 10, 3 20 C 4 31, 26 37, 50 37 C 76 37, 97 30, 97 19 C 97 9, 78 3, 54 3 C 42 3, 32 4, 24 7"} fill="none" stroke="var(--color-brick)" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ ["--len" as string]: 280, animationDuration: ".5s" } as CSSProperties} />
        </svg>
       )}
       {f.key === "trending" && <TrendingUp className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-[var(--color-brick)]" />}
       {f.label}
      </button>
     ))}
    </div>

    <p className={cn(handFont.className, "text-[1.05rem] text-muted-foreground")}>
     {paginatedNotifications.length} of {filteredNotifications.length}{hasMore ? "+" : ""} telegrams on the table
    </p>
   </div>

   {/* ---- The telegrams ---- */}
   {paginatedNotifications.length === 0 ? (
    <div className="mt-10 rounded-[3px] border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] px-6 py-14 text-center">
     <p className={cn(typeFont.className, "text-[13px] font-bold text-foreground/80")}>NO TELEGRAM FOUND STOP</p>
     <p className={cn(handFont.className, "mt-2 text-[1.3rem] text-foreground")}>Nothing came in for that.</p>
     <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filter criteria.</p>
    </div>
   ) : (
    <div className="mt-10 space-y-8">
     {paginatedNotifications.map((notification, index) => (
      <div key={notification.id} className="hs-fade-up" style={{ animationDelay: `${Math.min((index % 10) * 40, 300)}ms` }}>
       <Telegram notification={notification} index={index} onOpen={() => recordView(notification.id)} />
      </div>
     ))}
    </div>
   )}

   {(hasMore || hasMoreFiltered) && (
    <InfiniteListFooter
     sentinelRef={sentinelRef}
     hasMore={hasMore || hasMoreFiltered}
     loadingMore={isLoadingMore}
     loadMoreError={loadMoreError}
     onLoadMore={loadMore}
     onRetry={loadMore}
     loadedCount={paginatedNotifications.length}
     total={filteredNotifications.length}
     label="notifications"
    />
   )}
   <div className={cn(!(hasMore || hasMoreFiltered) && "hidden")} aria-hidden="true" />
  </div>
  </div>
 )
}

/* ───────── look only: the wire and the telegram form ───────── */

function MorseLine() {
 // "N E W S" in morse, tapped out across the top of the page
 const code = "-. . .-- ..."
 return (
  <div className="mx-auto flex max-w-xs items-center justify-center gap-[5px]" aria-hidden>
   <span className="h-px flex-1 bg-[var(--hs-border-strong)]" />
   {code.split("").map((c, i) =>
    c === " " ? (
     <span key={i} className="w-2" />
    ) : (
     <span
      key={i}
      className="hs-fade-up block h-[5px] rounded-full bg-[var(--color-brick)]"
      style={{ width: c === "-" ? 16 : 5, animationDelay: `${i * 90}ms` }}
     />
    )
   )}
   <span className="h-px flex-1 bg-[var(--hs-border-strong)]" />
  </div>
 )
}

/** Telegram text: upper case, sentences end in STOP, the way the clerk typed it. */
function wire(text: string) {
 return truncate(text, 200)
  .replace(/\s+/g, " ")
  .toUpperCase()
  .replace(/\.(\s|$)/g, " STOP$1")
}

/* the form paper stays light in both themes: it is a printed form */
const FORM = "oklch(96% 0.035 80)"
const FORM_INK = "oklch(28% 0.03 60)"
const STRIP = "oklch(99% 0.006 90)"

function Telegram({ notification, index, onOpen }: { notification: Notification; index: number; onOpen: () => void }) {
 const d = new Date(notification.createdAt)
 const no = notification.id.replace(/[^0-9a-z]/gi, "").slice(-6).toUpperCase()
 return (
  <div
   role="article"
   onClick={onOpen}
   className={cn("relative cursor-pointer rounded-[2px] px-4 pb-4 pt-3 transition-transform duration-300 hover:-translate-y-0.5 sm:px-6", index % 3 === 1 ? "rotate-[0.4deg]" : index % 3 === 2 ? "-rotate-[0.35deg]" : "")}
   style={{ background: FORM, color: FORM_INK, boxShadow: "0 1px 2px rgb(60 40 10 / .1), 0 18px 30px -22px rgb(60 40 10 / .6)" }}
  >
   {/* perforated top edge */}
   <span className="pointer-events-none absolute inset-x-0 -top-[5px] h-[10px]" style={{ background: `radial-gradient(circle at 5px 0, transparent 4px, ${FORM} 4.5px) 0 5px / 14px 10px repeat-x` }} aria-hidden />

   <div className={cn(typeFont.className, "flex items-center justify-between gap-3 border-b-2 border-double pb-2 text-[10px] font-bold")} style={{ borderColor: "oklch(50% 0.06 50 / .5)" }}>
    <span className="tracking-[0.25em]">TELEGRAM</span>
    <span className="hidden sm:inline">NO. {no}</span>
    <span>{formatDate(notification.createdAt, "d MMM yyyy").toUpperCase()} · {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })} HRS</span>
   </div>

   <div className={cn(typeFont.className, "mt-3 grid grid-cols-[3.4rem_1fr] gap-x-3 gap-y-1.5 text-[11px]")}>
    <span className="font-bold opacity-60">FROM</span>
    <span className="font-bold uppercase">{notification.category.name}</span>
    <span className="font-bold opacity-60">TO</span>
    <span className="font-bold">EVERY ASPIRANT</span>
   </div>

   {/* the message: typed strips pasted onto the form */}
   <h3 className="mt-3">
    <span className={cn(typeFont.className, "box-decoration-clone px-2 py-[3px] text-[14.5px] font-bold uppercase leading-[2.05] sm:text-[15.5px]")} style={{ background: STRIP, boxShadow: "0 1px 1px rgb(60 40 10 / .12)" }}>
     {notification.title.toUpperCase()} STOP
    </span>
   </h3>
   {notification.content && (
    <p className="mt-2">
     <span className={cn(typeFont.className, "box-decoration-clone px-2 py-[2px] text-[12px] leading-[2.1]")} style={{ background: STRIP, boxShadow: "0 1px 1px rgb(60 40 10 / .1)" }}>
      {wire(notification.content)}
     </span>
    </p>
   )}

   {notification.isTrending && (
    <span className={cn(typeFont.className, "pointer-events-none absolute right-4 top-12 rotate-[8deg] rounded-[3px] border-[3px] border-double px-2 py-0.5 text-[13px] font-bold tracking-[0.2em] opacity-80 sm:right-8 sm:text-[15px]")} style={{ color: "oklch(48% 0.19 27)", borderColor: "oklch(48% 0.19 27)" }}>
     URGENT
    </span>
   )}

   <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-dashed pt-3" style={{ borderColor: "oklch(50% 0.06 50 / .45)" }}>
    {notification.href && (
     <Link href={notification.href} className={cn(handFont.className, "text-[1.15rem] underline decoration-wavy decoration-1 underline-offset-4")} style={{ color: "oklch(42% 0.1 230)" }}>
      read the full notice →
     </Link>
    )}
    {notification.officialUrl && (
     <SmartExternalLink href={notification.officialUrl} linkTitle={notification.title} className={cn(typeFont.className, "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold hover:bg-[oklch(28%_0.03_60/0.06)]")}>
      <FileText className="h-3.5 w-3.5" /> OFFICIAL LINK
     </SmartExternalLink>
    )}
    <span className={cn(typeFont.className, "ml-auto inline-flex items-center gap-1 text-[10.5px] opacity-70")}>
     <Eye className="h-3 w-3" /> READ BY {notification.views}
    </span>
   </div>
  </div>
 )
}
