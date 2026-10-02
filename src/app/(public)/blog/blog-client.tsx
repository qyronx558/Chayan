"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, AlertCircle, Calendar, Clock3, ArrowRight, X, Eye, Flame, LayoutGrid, Rows3, Sparkles, Rss, Briefcase } from "lucide-react"
import { formatCompact, formatDate } from "@/lib/utils"
import { getReadingTimeMinutes } from "@/lib/blog-prose"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { BlogCard } from "@/components/blog/BlogCard"

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
  const [pagination, setPagination] = useState<{ page: number; total: number; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>("latest")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => { setSearch(input.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [input])

  useEffect(() => {
    fetch("/api/blog-categories")
      .then((res) => res.json())
      .then((json) => { if (json.success) setCategories(json.data) })
      .catch(() => {})
  }, [])

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (activeCategory) params.set("category", activeCategory)
      if (sort === "popular") params.set("sort", "popular")
      params.set("published", "true")
      params.set("page", String(page))
      params.set("limit", "12")
      const res = await fetch(`/api/blog?${params}`)
      const json = await res.json()
      if (json.success) {
        let data: BlogPost[] = json.data
        if (sort === "quick") {
          data = [...data].sort((a, b) => getReadingTimeMinutes(a.content) - getReadingTimeMinutes(b.content))
        }
        setPosts(data)
        setPagination(json.pagination)
      } else {
        setError(json.error || "Failed to fetch posts")
      }
    } catch {
      setError("Failed to load blog posts.")
    } finally {
      setLoading(false)
    }
  }, [search, activeCategory, sort, page])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  useEffect(() => {
    fetch("/api/blog?sort=popular&published=true&limit=5")
      .then((res) => res.json())
      .then((json) => { if (json.success) setPopular(json.data) })
      .catch(() => {})
  }, [])

  const isFiltered = Boolean(search || activeCategory)
  const [featured, ...secondary] = useMemo(() => (isFiltered || sort !== "latest" ? [] : posts), [posts, isFiltered, sort])
  const gridPosts = useMemo(() => (featured && !isFiltered && sort === "latest" && page === 1 ? posts.slice(1) : posts), [posts, featured, isFiltered, sort, page])

  const tagCloud = useMemo(() => {
    const map = new Map<string, number>()
    posts.forEach((p) => p.tags?.split(",").forEach((t) => {
      const k = t.trim()
      if (k) map.set(k, (map.get(k) || 0) + 1)
    }))
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  }, [posts])

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* - Editorial masthead: solid ink, brass rule, no neon gradients - */}
      <header className="relative mb-6 overflow-hidden rounded-2xl border-t-2 border-[#B08D57] bg-[#101E33] p-6 text-white shadow-lg sm:p-8">
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-[#B08D57] font-bold text-[#1A1408]"><Sparkles className="mr-1 h-3 w-3" /> Blog</Badge>
              {pagination?.total ? <Badge className="bg-white/10 text-slate-200">{pagination.total} articles</Badge> : null}
              <Link href="/rss/blog" className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/20">
                <Rss className="h-3 w-3" /> RSS
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#F7F3E8] sm:text-4xl">ChayanJobs Blog</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
              Career guides, exam prep, AI and money skills - practical, fact-checked, updated weekly.
            </p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search articles, topics, tags…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="border-white/15 bg-white/10 pl-10 pr-10 text-white placeholder:text-slate-400 focus-visible:ring-[#B08D57]"
              aria-label="Search articles"
            />
            {input && (
              <button type="button" onClick={() => setInput("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="relative mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={() => { setActiveCategory(null); setPage(1) }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${!activeCategory ? "bg-[#F2EDE0] text-[#101E33]" : "bg-white/5 text-slate-300 hover:bg-white/15"}`}
            >
              All Topics
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setActiveCategory(activeCategory === cat.slug ? null : cat.slug); setPage(1) }}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${activeCategory === cat.slug ? "bg-[#F2EDE0] text-[#101E33]" : "bg-white/5 text-slate-300 hover:bg-white/15"}`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color || "#B08D57" }} />
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* - Trending strip: restrained serif numerals, brass on hover - */}
      {popular.length > 0 && !isFiltered && (
        <section className="mb-8" aria-label="Trending articles">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            <Flame className="h-4 w-4 text-[#9A3412]" /> Trending now
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {popular.map((post, i) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group flex gap-3 rounded-xl border border-gray-200 bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-[#B08D57]/60 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                <span className="font-serif text-2xl font-black text-stone-300 transition-colors group-hover:text-[#B08D57] dark:text-gray-700">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="line-clamp-3 text-[13px] font-semibold leading-snug text-gray-900 group-hover:text-[#1B3A5C] dark:text-gray-100">{post.title}</span>
                  <span className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400" title={`${post.views.toLocaleString("en-IN")} views`}><Eye className="h-3 w-3" /> {formatCompact(post.views)} views</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* - Featured: photographic scrim only (no color gradient wash) - */}
      {featured && page === 1 && (
        <section className="mb-8 grid gap-5 lg:grid-cols-2" aria-label="Featured article">
          <Link href={`/blog/${featured.slug}`} className="group relative min-h-[280px] overflow-hidden rounded-2xl shadow-md sm:min-h-[340px]">
            {featured.image ? (
              <Image src={featured.image} alt={featured.title} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="absolute inset-0 bg-[#101E33]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <div className="mb-2 flex items-center gap-2">
                <Badge className="bg-[#B08D57] font-bold text-[#1A1408]">Featured</Badge>
                {featured.category && <Badge className="bg-white/15 text-white backdrop-blur">{featured.category.name}</Badge>}
              </div>
              <h2 className="line-clamp-3 text-2xl font-extrabold leading-tight text-white sm:text-[1.7rem]">{featured.title}</h2>
              {featured.excerpt && <p className="mt-2 line-clamp-2 text-sm text-gray-200">{featured.excerpt}</p>}
              <p className="mt-3 flex items-center gap-3 text-xs text-gray-300">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(featured.createdAt)}</span>
                <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{getReadingTimeMinutes(featured.content)} min</span>
                <span className="flex items-center gap-1 font-bold text-[#E8C87A]">Read story <ArrowRight className="h-3.5 w-3.5" /></span>
              </p>
            </div>
          </Link>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {secondary.slice(0, 4).map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group flex gap-3 rounded-2xl border border-gray-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-[#B08D57]/60 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
                {post.image ? (
                  <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    <Image src={post.image} alt="" fill sizes="120px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </span>
                ) : (
                  <span className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-[#101E33] text-lg font-black text-[#E8C87A]">{post.title.charAt(0)}</span>
                )}
                <span className="min-w-0">
                  {post.category && <span className="text-[11px] font-bold uppercase tracking-wide text-[#1B3A5C] dark:text-blue-400">{post.category.name}</span>}
                  <span className="line-clamp-2 block text-sm font-bold leading-snug text-gray-900 group-hover:text-[#1B3A5C] dark:text-gray-100">{post.title}</span>
                  <span className="mt-1 block text-[11px] text-gray-400">{formatDate(post.createdAt)} · {getReadingTimeMinutes(post.content)} min · {formatCompact(post.views)} views</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Toolbar ── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500" role="status">
          {loading ? "Loading articles…" : <>Showing <b className="text-gray-900 dark:text-gray-100">{gridPosts.length}</b> of <b className="text-gray-900 dark:text-gray-100">{pagination?.total ?? 0}</b> articles</>}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-gray-200 bg-white p-1 text-xs font-bold dark:border-gray-700 dark:bg-gray-900" role="tablist" aria-label="Sort articles">
            {(["latest", "popular", "quick"] as SortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={sort === k}
                onClick={() => { setSort(k); setPage(1) }}
                className={`rounded-full px-3 py-1.5 transition-colors ${sort === k ? "bg-[#101E33] text-[#F2EDE0] shadow" : "text-gray-500 hover:text-gray-900 dark:text-gray-400"}`}
              >
                {k === "latest" ? "Latest" : k === "popular" ? "Most read" : "Quick reads"}
              </button>
            ))}
          </div>
          <div className="flex rounded-full border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900" aria-label="Change view">
            <button type="button" onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"} className={`rounded-full p-1.5 ${view === "grid" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-400"}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className={`rounded-full p-1.5 ${view === "list" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-400"}`}>
              <Rows3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main + sidebar ── */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="mb-3 aspect-video w-full rounded-xl" /><Skeleton className="mb-2 h-5 w-full" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
              ))}
            </div>
          ) : error ? (
            <Card><CardContent className="flex flex-col items-center py-16">
              <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
              <h3 className="mb-2 text-lg font-semibold">Something went wrong</h3>
              <p className="mb-4 text-sm text-gray-500">{error}</p>
              <Button onClick={fetchPosts}>Try Again</Button>
            </CardContent></Card>
          ) : gridPosts.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center py-16">
              <Search className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="mb-2 text-lg font-semibold">No articles found</h3>
              <p className="mb-4 text-sm text-gray-500">Try a different search or category.</p>
              <Button variant="outline" onClick={() => { setInput(""); setActiveCategory(null); setPage(1) }}>Clear filters</Button>
            </CardContent></Card>
          ) : view === "grid" ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {gridPosts.map((post) => (
                <BlogCard key={post.id} post={{ ...post, readingTime: getReadingTimeMinutes(post.content) }} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {gridPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-[#B08D57]/60 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                  {post.image ? (
                    <span className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-28 sm:w-44">
                      <Image src={post.image} alt="" fill sizes="200px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    {post.category && <span className="text-[11px] font-bold uppercase tracking-wide text-[#1B3A5C]">{post.category.name}</span>}
                    <span className="line-clamp-2 block font-bold leading-snug text-gray-900 group-hover:text-[#1B3A5C] dark:text-gray-100">{post.title}</span>
                    {post.excerpt && <span className="mt-1 line-clamp-2 block text-sm text-gray-500">{post.excerpt}</span>}
                    <span className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(post.createdAt)}</span>
                      <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{getReadingTimeMinutes(post.content)} min</span>
                      <span className="flex items-center gap-1" title={`${post.views.toLocaleString("en-IN")} views`}><Eye className="h-3.5 w-3.5" />{formatCompact(post.views)}</span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8"><Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }) }} /></div>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-gray-500"><Flame className="h-4 w-4 text-[#9A3412]" /> Most read</h3>
            <div className="space-y-3">
              {popular.slice(0, 4).map((p, i) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group flex gap-3" title={`${p.views.toLocaleString("en-IN")} views`}>
                  <span className="font-serif text-xl font-black text-stone-300 group-hover:text-[#B08D57]">{i + 1}</span>
                  <span>
                    <span className="line-clamp-2 block text-sm font-semibold leading-snug text-gray-800 group-hover:text-[#1B3A5C] dark:text-gray-200">{p.title}</span>
                    <span className="mt-0.5 block text-[11px] text-gray-400">{formatCompact(p.views)} views</span>
                  </span>
                </Link>
              ))}
              {popular.length === 0 && <p className="text-sm text-gray-400">Fresh reads dropping soon.</p>}
            </div>
          </div>

          {tagCloud.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-gray-500">Explore tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {tagCloud.map(([tag]) => (
                  <Link key={tag} href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`}>
                    <Badge variant="secondary" className="transition-colors hover:bg-[#101E33] hover:text-[#F2EDE0]">#{tag}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link href="/jobs" className="group block overflow-hidden rounded-2xl border-t-2 border-[#B08D57] bg-[#101E33] p-5 text-white shadow-md transition-transform hover:-translate-y-0.5">
            <p className="flex items-center gap-2 text-sm font-bold text-[#F7F3E8]"><Briefcase className="h-4 w-4 text-[#E8C87A]" /> Reading? Start applying.</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">Fresh government jobs matched to these guides.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-[#E8C87A]">Browse jobs <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        </aside>
      </div>
    </div>
  )
}
