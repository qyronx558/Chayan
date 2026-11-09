"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, AlertCircle, Calendar, Clock3, ArrowRight, X, Eye, Flame, LayoutGrid, Rows3, Sparkles, Rss, Briefcase } from "lucide-react"
import { formatCompact, formatDate } from "@/lib/utils"
import { getReadingTimeMinutes } from "@/lib/blog-prose"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BlogCard } from "@/components/blog/BlogCard"
import { UniversalCardSkeleton, UniversalCardEmpty } from "@/components/ui/universal-card"
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
  <div className="pb-16">
   {/* Masthead */}
   <header className="border-b-2 border-ink bg-background">
    <div className="container mx-auto max-w-7xl px-4 pb-8 pt-10 sm:pt-14">
     <div className="flex flex-wrap items-end justify-between gap-8">
      <div className="min-w-0 max-w-3xl">
       <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <span className="h-0.5 w-8 bg-brick" aria-hidden />
        The ChayanJobs Journal
        {total ? <span className="font-medium normal-case tracking-normal">· {total} articles</span> : null}
       </div>
       <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
        Guides that get you <span className="text-brick">hired</span>.
       </h1>
       <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
        Exam strategy, career playbooks, AI and money skills. Practical, fact-checked and updated every week.
       </p>
      </div>
      <div className="w-full max-w-md">
       <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
         placeholder="Search guides, topics, tags…"
         value={input}
         onChange={(e) => setInput(e.target.value)}
         className="h-12 border-ink bg-background pl-11 pr-10 text-base"
         aria-label="Search articles"
        />
        {input && (
         <button type="button" onClick={() => setInput("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brick">
          <X className="h-4 w-4" />
         </button>
        )}
       </div>
       <Link href="/rss/blog" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-brick">
        <Rss className="h-3.5 w-3.5" /> Subscribe via RSS
       </Link>
      </div>
     </div>
    </div>

    {/* Sticky topic tabs */}
    {categories.length > 0 && (
     <nav aria-label="Topics" className="sticky top-16 z-20 border-t border-rule bg-background/95 backdrop-blur">
      <div className="container mx-auto max-w-7xl px-4">
       <div className="-mx-1 flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {topicTabs.map((cat) => {
         const active = cat.slug === activeCategory
         return (
          <button
           key={cat.id}
           type="button"
           aria-pressed={active}
           onClick={() => setActiveCategory(cat.slug && activeCategory === cat.slug ? null : cat.slug)}
           className={`flex shrink-0 items-center gap-2 border px-4 py-2 text-sm font-bold transition-colors ${active ? "border-ink bg-ink text-paper" : "border-transparent text-muted-foreground hover:border-rule hover:text-foreground"}`}
          >
           {cat.slug && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color || "var(--color-brick)" }} aria-hidden />}
           {cat.name}
          </button>
         )
        })}
       </div>
      </div>
     </nav>
    )}
   </header>

   <div className="container mx-auto max-w-7xl px-4 pt-10">
    {/* Featured + top stories */}
    {featured && (
     <section className="mb-12 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" aria-label="Featured article">
      <Link href={`/blog/${featured.slug}`} className="group block">
       <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink">
        {featured.image ? (
         <Image src={featured.image} alt="" fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
        ) : (
         <div className="flex h-full items-end p-8"><span className="h-0.5 w-16 bg-brick" aria-hidden /></div>
        )}
        <span className="absolute left-0 top-0 bg-brick px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brick-ink">Featured</span>
       </div>
       <div className="pt-5">
        {featured.category && <span className="text-xs font-bold uppercase tracking-wide text-brick">{featured.category.name}</span>}
        <h2 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight text-foreground group-hover:text-brick sm:text-4xl">{featured.title}</h2>
        {featured.excerpt && <p className="mt-3 line-clamp-3 text-base leading-7 text-muted-foreground">{featured.excerpt}</p>}
        <p className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
         <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDate(featured.createdAt)}</span>
         <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{getReadingTimeMinutes(featured.content)} min read</span>
         <span className="ml-auto flex items-center gap-1 font-bold text-foreground group-hover:text-brick">Read the story <ArrowRight className="h-4 w-4" /></span>
        </p>
       </div>
      </Link>

      <div className="lg:border-l lg:border-rule lg:pl-8">
       <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <Sparkles className="h-4 w-4 text-brick" /> Top stories
       </h2>
       <ol className="divide-y divide-rule">
        {posts.slice(1, 5).map((post, i) => (
         <li key={post.id}>
          <Link href={`/blog/${post.slug}`} className="group flex gap-4 py-4">
           <span className="font-display text-3xl font-bold leading-none text-rule group-hover:text-brick">{i + 1}</span>
           <span className="min-w-0">
            {post.category && <span className="text-[11px] font-bold uppercase tracking-wide text-brick">{post.category.name}</span>}
            <span className="line-clamp-2 block font-display text-lg font-bold leading-snug text-foreground group-hover:text-brick">{cleanTitle(post.title)}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{formatDate(post.createdAt)} · {getReadingTimeMinutes(post.content)} min read</span>
           </span>
          </Link>
         </li>
        ))}
       </ol>
      </div>
     </section>
    )}

    {/* Toolbar */}
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
     <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
      {activeCategoryName ?? (search ? `Results for "${search}"` : "Latest articles")}
     </h2>
     <div className="flex items-center gap-3">
      <p className="hidden text-sm text-muted-foreground sm:block" role="status">
       {loading ? "Loading…" : <><b className="text-foreground">{posts.length}</b> of <b className="text-foreground">{total}</b></>}
      </p>
      <div className="flex border border-rule text-xs font-bold" role="tablist" aria-label="Sort articles">
       {(["latest", "popular", "quick"] as SortKey[]).map((k) => (
        <button
         key={k}
         type="button"
         role="tab"
         aria-selected={sort === k}
         onClick={() => setSort(k)}
         className={`px-3 py-2 transition-colors ${sort === k ? "bg-ink text-paper" : "text-muted-foreground hover:text-foreground"}`}
        >
         {k === "latest" ? "Latest" : k === "popular" ? "Most read" : "Quick reads"}
        </button>
       ))}
      </div>
      <div className="hidden border border-rule sm:flex" aria-label="Change view">
       <button type="button" onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"} className={`p-2 ${view === "grid" ? "bg-ink text-paper" : "text-muted-foreground"}`}>
        <LayoutGrid className="h-4 w-4" />
       </button>
       <button type="button" onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className={`p-2 ${view === "list" ? "bg-ink text-paper" : "text-muted-foreground"}`}>
        <Rows3 className="h-4 w-4" />
       </button>
      </div>
     </div>
    </div>

    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
     <div className="min-w-0">
      {loading ? (
       <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
         <UniversalCardSkeleton key={i} />
        ))}
       </div>
      ) : error ? (
       <Card><CardContent className="flex flex-col items-center py-16">
        <AlertCircle className="mb-4 h-12 w-12 text-brick" />
        <h3 className="mb-2 text-lg font-semibold">Something went wrong</h3>
        <p className="mb-4 text-sm text-muted-foreground">{error}</p>
        <Button onClick={retryInitial}>Try Again</Button>
       </CardContent></Card>
      ) : gridPosts.length === 0 ? (
       <UniversalCardEmpty
        title="No articles found"
        hint="Try a different search or topic."
        action={<Button variant="outline" onClick={() => { setInput(""); setActiveCategory(null) }}>Clear filters</Button>}
       />
      ) : view === "grid" ? (
       <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {gridPosts.map((post) => (
         <BlogCard key={post.id} post={toCard(post)} />
        ))}
       </div>
      ) : (
       <div>
        {gridPosts.map((post) => (
         <BlogCard key={post.id} post={toCard(post)} variant="wide" />
        ))}
       </div>
      )}
      {!loading && !error && gridPosts.length > 0 && (
       <>
        {loadingMore && (
         <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
           <UniversalCardSkeleton key={i} />
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

     <aside className="space-y-6 lg:sticky lg:top-36 lg:self-start">
      <Link href="/jobs" className="group block border-t-4 border-brick bg-ink p-6 text-paper">
       <p className="flex items-center gap-2 font-display text-xl font-bold"><Briefcase className="h-5 w-5" /> Done reading? Start applying.</p>
       <p className="mt-2 text-sm leading-6 opacity-80">Fresh government and private jobs, updated daily, matched to these guides.</p>
       <span className="mt-4 inline-flex items-center gap-1.5 bg-brick px-4 py-2 text-sm font-bold text-brick-ink transition-transform group-hover:translate-x-0.5">
        Browse jobs <ArrowRight className="h-4 w-4" />
       </span>
      </Link>

      <div className="border border-rule p-5">
       <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><Flame className="h-4 w-4 text-brick" /> Most read</h3>
       <div className="divide-y divide-rule">
        {popular.slice(0, 5).map((p, i) => (
         <Link key={p.id} href={`/blog/${p.slug}`} className="group flex gap-3 py-3 first:pt-0 last:pb-0" title={`${p.views.toLocaleString("en-IN")} views`}>
          <span className="font-display text-2xl font-bold leading-none text-rule group-hover:text-brick">{i + 1}</span>
          <span className="min-w-0">
           <span className="line-clamp-2 block text-sm font-bold leading-snug text-foreground group-hover:text-brick">{cleanTitle(p.title)}</span>
           <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground"><Eye className="h-3 w-3" />{formatCompact(p.views)} views</span>
          </span>
         </Link>
        ))}
        {popular.length === 0 && <p className="text-sm text-muted-foreground">Fresh reads dropping soon.</p>}
       </div>
      </div>

      {tagCloud.length > 0 && (
       <div className="border border-rule p-5">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Explore tags</h3>
        <div className="flex flex-wrap gap-1.5">
         {tagCloud.map(([tag]) => (
          <Link key={tag} href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`} className="border border-rule px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick">
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
