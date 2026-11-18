"use client"

import { useState, useEffect, useCallback, useMemo, useRef, type CSSProperties } from "react"
import Link from "next/link"
import { Search, AlertCircle, ArrowRight, X, LayoutGrid, Rows3, Rss } from "lucide-react"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import "@/app/home.css"
import { ClipSkeleton, ContentsPage, CoverStory, LibraryCard, MagazineClip, ReadingDeskArt } from "./reading-desk"
import { getReadingTimeMinutes } from "@/lib/blog-prose"
import { Button } from "@/components/ui/button"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"
import {
 useInfiniteScroll,
 appendUnique,
 PUBLIC_INFINITE_LIMIT as LIMIT,
} from "@/hooks/useInfiniteScroll"
import { InfiniteListFooter } from "@/components/ui/infinite-list-footer"

interface BlogCategory {
 id: string
 name: string
 slug: string
 description: string | null
 icon: string | null
 color: string | null
}

interface BlogPost {
 id: string
 title: string
 slug: string
 excerpt: string | null
 author: string | null
 image: string | null
 tags: string | null
 categoryId: string | null
 category: { id: string; name: string; slug: string; color: string | null } | null
 published: boolean
 views: number
 content?: string | null
 createdAt: string
}

type SortKey = "latest" | "popular" | "quick"

export function BlogClient() {
 const [posts, setPosts] = useState<BlogPost[]>([])
 const [popular, setPopular] = useState<BlogPost[]>([])
 const [categories, setCategories] = useState<BlogCategory[]>([])
 const [total, setTotal] = useState(0)
 const [hasMore, setHasMore] = useState(false)
 const [loading, setLoading] = useState(true)
 const [loadingMore, setLoadingMore] = useState(false)
 const [error, setError] = useState("")
 const [loadMoreError, setLoadMoreError] = useState("")
 const [input, setInput] = useState("")
 const [search, setSearch] = useState("")
 const [activeCategory, setActiveCategory] = useState<string | null>(null)
 const [sort, setSort] = useState<SortKey>("latest")
 const [view, setView] = useState<"grid" | "list">("grid")
 const pageRef = useRef(1)
 const abortRef = useRef<AbortController | null>(null)

 useEffect(() => {
  const t = setTimeout(() => { setSearch(input.trim()) }, 350)
  return () => clearTimeout(t)
 }, [input])

 useEffect(() => {
  fetch("/api/blog-categories")
   .then((res) => res.json())
   .then((json) => { if (json.success) setCategories(json.data) })
   .catch(() => {})
 }, [])

 const fetchPage = useCallback(async (pageNum: number, replace: boolean, signal: AbortSignal) => {
  if (replace) {
   setLoading(true)
   setError("")
  } else {
   setLoadingMore(true)
   setLoadMoreError("")
  }
  try {
   const params = new URLSearchParams()
   if (search) params.set("search", search)
   if (activeCategory) params.set("category", activeCategory)
   if (sort === "popular") params.set("sort", "popular")
   params.set("published", "true")
   params.set("page", String(pageNum))
   params.set("limit", String(LIMIT))
   const res = await fetch(`/api/blog?${params}`, { signal })
   const json = await res.json()
   if (signal.aborted) return
   if (json.success) {
    let data: BlogPost[] = json.data
    if (sort === "quick") {
     data = [...data].sort((a, b) => getReadingTimeMinutes(a.content) - getReadingTimeMinutes(b.content))
    }
    setPosts((prev) => (replace ? data : appendUnique(prev, data)))
    setTotal(json.pagination.total ?? 0)
    setHasMore(pageNum < (json.pagination.totalPages ?? 1))
    pageRef.current = pageNum
   } else if (replace) {
    setError(json.error || "Failed to fetch posts")
   } else {
    setLoadMoreError(json.error || "Failed to load more. Please retry.")
   }
  } catch {
   if (signal.aborted) return
   if (replace) setError("Failed to load blog posts.")
   else setLoadMoreError("Failed to load more. Please retry.")
  } finally {
   if (!signal.aborted) {
    if (replace) setLoading(false)
    else setLoadingMore(false)
   }
  }
 }, [search, activeCategory, sort])

 useEffect(() => {
  abortRef.current?.abort()
  const controller = new AbortController()
  abortRef.current = controller
  pageRef.current = 1
  setHasMore(false)
  fetchPage(1, true, controller.signal)
  return () => controller.abort()
 }, [fetchPage])

 const loadMore = useCallback(() => {
  if (loading || loadingMore || !hasMore) return
  const controller = new AbortController()
  abortRef.current = controller
  fetchPage(pageRef.current + 1, false, controller.signal)
 }, [loading, loadingMore, hasMore, fetchPage])

 const retryInitial = useCallback(() => {
  abortRef.current?.abort()
  const controller = new AbortController()
  abortRef.current = controller
  fetchPage(1, true, controller.signal)
 }, [fetchPage])

 const sentinelRef = useInfiniteScroll({
  hasMore,
  isLoading: loading || loadingMore,
  onLoadMore: loadMore,
 })

 useEffect(() => {
  fetch("/api/blog?sort=popular&published=true&limit=5")
   .then((res) => res.json())
   .then((json) => { if (json.success) setPopular(json.data) })
   .catch(() => {})
 }, [])

 const isFiltered = Boolean(search || activeCategory)
 const featured = useMemo(
  () => (isFiltered || sort !== "latest" || posts.length === 0 ? undefined : posts[0]),
  [posts, isFiltered, sort]
 )
 const gridPosts = useMemo(
  () => filterValidItems(featured ? posts.slice(1) : posts),
  [posts, featured]
 )

 const tagCloud = useMemo(() => {
  const map = new Map<string, number>()
  posts.forEach((p) => p.tags?.split(",").forEach((t) => {
   const k = t.trim()
   if (k) map.set(k, (map.get(k) || 0) + 1)
  }))
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
 }, [posts])

 const toCard = (p: BlogPost) => ({
  id: p.id,
  title: cleanTitle(p.title),
  slug: p.slug,
  excerpt: p.excerpt,
  image: p.image,
  views: p.views,
  createdAt: p.createdAt,
  readingTime: getReadingTimeMinutes(p.content),
  category: p.category,
 })

 const topicTabs = [{ id: "all", name: "All topics", slug: null as string | null, color: null as string | null }, ...categories]
 const activeCategoryName = categories.find((c) => c.slug === activeCategory)?.name

 return (
  <div className="home-saas pb-16 text-foreground">
   {/* Masthead: the reading desk */}
   <header>
    <div className="container mx-auto max-w-7xl px-4 pb-10 pt-10 sm:pt-12">
     <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
      <div className="min-w-0">
       <p className={cn(handFont.className, "text-[1.25rem] text-[var(--color-brick)]")}>
        the ChayanJobs journal{total ? <span className="text-foreground/50"> · {total} articles</span> : null}
       </p>
       <h1 className="mt-1 font-display text-[2.5rem] font-black leading-[1.04] text-foreground sm:text-[3.6rem]">
        Guides worth{" "}
        <span className="relative inline-block">
         underlining.
         <svg viewBox="0 0 300 16" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-2 left-0 h-3 w-full" aria-hidden>
          <path className="hs-draw" style={{ ["--len" as string]: 320 } as CSSProperties} d="M3 10 C 60 4, 140 14, 200 7 S 280 6, 297 9" fill="none" stroke="var(--color-brick)" strokeWidth="3" strokeLinecap="round" />
         </svg>
        </span>
       </h1>
       <p className="mt-5 max-w-xl text-[16px] leading-7 text-muted-foreground sm:text-[17px]">
        Exam strategy, career playbooks, AI and money skills. Practical, fact-checked and updated every week. Read
        slowly, keep a pencil close.
       </p>
       <div className="mt-6 max-w-md">
        <div className="group relative flex h-12 items-center rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] pl-4 pr-1.5 transition-[border-color,box-shadow] focus-within:border-[var(--hs-trust)] focus-within:shadow-[0_0_0_4px_var(--hs-trust-soft)]">
         <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
         <input
          placeholder="Search guides, topics, tags…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          aria-label="Search articles"
         />
         {input && (
          <button type="button" onClick={() => setInput("")} aria-label="Clear search" className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-paper-2 hover:text-brick">
           <X className="h-4 w-4" />
          </button>
         )}
        </div>
        <Link href="/rss/blog" className={cn(handFont.className, "mt-3 inline-flex items-center gap-1.5 text-[1.02rem] text-muted-foreground hover:text-[var(--color-brick)]")}>
         <Rss className="h-3.5 w-3.5" /> get new pieces by RSS
        </Link>
       </div>
      </div>
      <ReadingDeskArt />
     </div>
    </div>

    {/* Topic ribbons, hanging from the top edge like bookmarks */}
    {categories.length > 0 && (
     <nav aria-label="Topics" className="sticky top-16 z-20 border-y border-[var(--hs-border-strong)] bg-[var(--hs-surface)]/95 backdrop-blur">
      <div className="container mx-auto max-w-7xl px-4">
       <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {topicTabs.map((cat) => {
         const active = cat.slug === activeCategory
         const color = cat.color || (cat.slug ? "var(--color-brick)" : "var(--color-ink)")
         return (
          <button
           key={cat.id}
           type="button"
           aria-pressed={active}
           onClick={() => setActiveCategory(cat.slug && activeCategory === cat.slug ? null : cat.slug)}
           className="group relative shrink-0 px-1 pt-0"
          >
           <span
            className={cn("block px-3.5 pb-3 text-[13px] font-bold transition-all", active ? cn("pt-3", cat.slug ? "text-[oklch(98%_0.01_90)]" : "text-background") : "pt-1.5 text-foreground/80 group-hover:pt-2.5")}
            style={{
             background: active ? color : `color-mix(in oklch, ${color} 14%, transparent)`,
             clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 7px), 0 100%)",
            }}
           >
            {cat.name}
           </span>
          </button>
         )
        })}
       </div>
      </div>
     </nav>
    )}
   </header>

   <div className="container mx-auto max-w-7xl px-4 pt-12">
    {/* Cover story + contents */}
    {featured && (
     <section className="mb-14 grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" aria-label="Featured article">
      <CoverStory post={{ ...toCard(featured), title: featured.title }} excerpt={featured.excerpt} />
      <div>
       <p className={cn(handFont.className, "mb-3 text-[1.15rem] text-foreground/70")}>also in this issue</p>
       <ContentsPage posts={posts.slice(1, 5).map(toCard)} />
      </div>
     </section>
    )}

    {/* Toolbar */}
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-dashed border-[var(--hs-border-strong)] pb-4">
     <div>
      <p className={cn(handFont.className, "text-[1.1rem] text-[var(--color-brick)]")}>{search ? "you looked for" : activeCategoryName ? "filed under" : "on the desk"}</p>
      <h2 className="font-display text-[1.8rem] font-black leading-tight text-foreground">
       {activeCategoryName ?? (search ? `"${search}"` : "Latest articles")}
      </h2>
     </div>
     <div className="flex flex-wrap items-center gap-3">
      <p className={cn(typeFont.className, "hidden text-[11.5px] text-muted-foreground sm:block")} role="status">
       {loading ? "loading…" : <>{posts.length} of {total}</>}
      </p>
      <div className="flex items-center gap-1" role="tablist" aria-label="Sort articles">
       {(["latest", "popular", "quick"] as SortKey[]).map((k, i) => (
        <button
         key={k}
         type="button"
         role="tab"
         aria-selected={sort === k}
         onClick={() => setSort(k)}
         className={cn("relative px-3 py-1.5 text-[13.5px] transition-colors", sort === k ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
         {sort === k && (
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
           <path className="hs-draw" d={i % 2 ? "M55 3 C 84 2, 98 10, 97 20 C 96 31, 74 37, 50 37 C 24 37, 3 31, 3 20 C 3 9, 22 3, 46 3 C 58 3, 68 4, 76 7" : "M45 3 C 16 3, 2 10, 3 20 C 4 31, 26 37, 50 37 C 76 37, 97 30, 97 19 C 97 9, 78 3, 54 3 C 42 3, 32 4, 24 7"} fill="none" stroke="var(--color-brick)" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ ["--len" as string]: 280, animationDuration: ".5s" } as CSSProperties} />
          </svg>
         )}
         {k === "latest" ? "Latest" : k === "popular" ? "Most read" : "Quick reads"}
        </button>
       ))}
      </div>
      <div className="hidden items-center gap-1 sm:flex" aria-label="Change view">
       <button type="button" onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"} className={cn("flex h-9 w-9 items-center justify-center rounded-full border", view === "grid" ? "border-foreground bg-foreground text-background" : "border-[var(--hs-border-strong)] text-muted-foreground hover:text-foreground")}>
        <LayoutGrid className="h-4 w-4" />
       </button>
       <button type="button" onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className={cn("flex h-9 w-9 items-center justify-center rounded-full border", view === "list" ? "border-foreground bg-foreground text-background" : "border-[var(--hs-border-strong)] text-muted-foreground hover:text-foreground")}>
        <Rows3 className="h-4 w-4" />
       </button>
      </div>
     </div>
    </div>

    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
     <div className="min-w-0">
      {loading ? (
       <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
         <ClipSkeleton key={i} />
        ))}
       </div>
      ) : error ? (
       <div className="flex flex-col items-center rounded-[3px] border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] px-6 py-14 text-center">
        <AlertCircle className="mb-3 h-9 w-9 text-brick" />
        <p className={cn(handFont.className, "text-[1.5rem] text-foreground")}>The pages got shuffled for a second.</p>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">{error}</p>
        <Button onClick={retryInitial}>Try again</Button>
       </div>
      ) : gridPosts.length === 0 ? (
       <div className="flex flex-col items-center rounded-[3px] border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] px-6 py-14 text-center">
        <p className={cn(handFont.className, "text-[1.5rem] text-foreground")}>Nothing on the desk for that.</p>
        <p className="mb-5 mt-1 max-w-sm text-sm text-muted-foreground">Try a different word, or another topic ribbon.</p>
        <Button variant="outline" onClick={() => { setInput(""); setActiveCategory(null) }}>Clear filters</Button>
       </div>
      ) : view === "grid" ? (
       <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
        {gridPosts.map((post, i) => (
         <div key={post.id} className="hs-fade-up" style={{ animationDelay: `${(i % 6) * 60}ms` }}>
          <MagazineClip post={toCard(post)} index={i} />
         </div>
        ))}
       </div>
      ) : (
       <div>
        {gridPosts.map((post, i) => (
         <MagazineClip key={post.id} post={toCard(post)} index={i} wide />
        ))}
       </div>
      )}
      {!loading && !error && gridPosts.length > 0 && (
       <>
        {loadingMore && (
         <div className="mt-7 grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
           <ClipSkeleton key={i} />
          ))}
         </div>
        )}
        <InfiniteListFooter
         sentinelRef={sentinelRef}
         hasMore={hasMore}
         loadingMore={loadingMore}
         loadMoreError={loadMoreError}
         onLoadMore={loadMore}
         onRetry={loadMore}
         loadedCount={posts.length}
         total={total}
         label="articles"
        />
       </>
      )}
     </div>

     <aside className="space-y-9 lg:sticky lg:top-36 lg:self-start">
      {/* a bookmark slipped out of the book */}
      <Link href="/jobs" className="group relative block -rotate-[1deg] overflow-hidden rounded-[2px] bg-[var(--color-ink)] px-6 pb-7 pt-6 text-[var(--color-paper)] transition-transform hover:rotate-0" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 14px), 0 100%)" }}>
       <span className="absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-[var(--color-paper)]/60" aria-hidden />
       <p className={cn(handFont.className, "mt-3 text-[1.1rem] text-[var(--hs-marigold)]")}>done reading?</p>
       <p className="font-display text-[1.35rem] font-bold leading-tight">Close the book. Start applying.</p>
       <p className="mt-2 text-sm leading-6 opacity-80">Fresh government and private jobs, updated daily, matched to these guides.</p>
       <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brick)] px-4 py-2 text-sm font-bold text-brick-ink transition-transform group-hover:translate-x-0.5">
        Browse jobs <ArrowRight className="h-4 w-4" />
       </span>
      </Link>

      <LibraryCard posts={popular.slice(0, 5).map((p) => ({ id: p.id, slug: p.slug, title: cleanTitle(p.title), views: p.views }))} />

      {tagCloud.length > 0 && (
       <div>
        <p className={cn(handFont.className, "mb-2 text-[1.2rem] text-foreground/75")}>written in the margins:</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
         {tagCloud.map(([tag], i) => (
          <Link key={tag} href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`} className={cn(handFont.className, "text-[1.05rem] text-[var(--hs-trust)] hover:text-[var(--color-brick)] hover:underline", i % 2 ? "rotate-[2deg]" : "-rotate-[2deg]")}>
           #{tag}
          </Link>
         ))}
        </div>
       </div>
      )}
     </aside>
    </div>
   </div>
  </div>
 )
}
