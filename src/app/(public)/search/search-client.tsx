"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Search,
  FileText,
  Award,
  CreditCard,
  Building2,
  Newspaper,
  HelpCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { POPULAR_SEARCHES } from "@/lib/search-constants"
import {
  UNIVERSAL_TYPE_META,
  groupUniversalItems,
  mapSearchApiToItems,
  type UniversalSearchItem,
  type UniversalSearchType,
} from "@/lib/universal-search"

const TYPE_ICONS: Record<UniversalSearchType, React.ElementType> = {
  job: FileText,
  private_job: Building2,
  result: Award,
  admit_card: CreditCard,
  answer_key: HelpCircle,
  blog: Newspaper,
}

const FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Govt Jobs", value: "job" },
  { label: "Private Jobs", value: "private_job" },
  { label: "Results", value: "result" },
  { label: "Admit Cards", value: "admit_card" },
  { label: "Answer Keys", value: "answer_key" },
  { label: "Blogs", value: "blog" },
]

export function SearchClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams.get("q") ?? ""
  const [query, setQuery] = React.useState(initialQ)
  const [category, setCategory] = React.useState("")
  // Fixed batch size (numbered pager + Rows selector removed; universal
  // search API caps `limit` at 20 and has no page/skip support).
  const pageSize = 12
  const [items, setItems] = React.useState<UniversalSearchItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  // Keep input in sync when navigating between /search?q=... links
  React.useEffect(() => {
    setQuery(searchParams.get("q") ?? "")
  }, [searchParams])

  React.useEffect(() => {
    const controller = new AbortController()
    const q = (searchParams.get("q") ?? "").trim()
    const run = async () => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams({ limit: String(pageSize) })
        if (q) params.set("q", q)
        if (category) params.set("category", category)
        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error("Search failed")
        const json = await res.json()
        if (controller.signal.aborted) return
        setItems(mapSearchApiToItems(json))
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError("Search failed. Please try again.")
        setItems([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    const t = setTimeout(run, q ? 120 : 0)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [searchParams, category, pageSize])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search")
  }

  const grouped = React.useMemo(() => groupUniversalItems(items), [items])
  const activeQ = (searchParams.get("q") ?? "").trim()
  const total = items.length

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
          <Sparkles className="h-3.5 w-3.5" />
          Universal search & recommendations
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          {activeQ ? `Results for “${activeQ}”` : "What are you looking for?"}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Jobs, results, admit cards, answer keys, private jobs and blogs - in one place.
        </p>
      </div>

      <form onSubmit={submit} className="mx-auto mt-6 flex w-full max-w-2xl items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “SSC CGL”, “UPSC”, “Railway”..."
            aria-label="Search everything"
            className="h-12 rounded-xl pl-11 text-base shadow-sm"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" className="h-12 rounded-xl px-5">
          Search
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            type="button"
            variant={category === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(f.value)}
            className="h-8 rounded-full px-3 text-xs"
          >
            {f.label}
          </Button>
        ))}
      </div>
      {activeQ && (
        <p className="mt-3 text-center text-xs text-gray-400">
          Showing top {total} matches across jobs, results, admit cards and more
        </p>
      )}

      {loading ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="mt-10 text-center text-sm text-red-500">{error}</p>
      ) : total === 0 && activeQ ? (
        <div className="mt-10 rounded-2xl border border-dashed p-8 text-center">
          <p className="font-semibold">No results for “{activeQ}”</p>
          <p className="mt-1 text-sm text-gray-500">Try a different keyword or pick a popular search below.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {POPULAR_SEARCHES.slice(0, 8).map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-full border px-3 py-1 text-xs font-medium hover:border-blue-300 hover:text-blue-700"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <>
          {!activeQ && (
            <div className="mt-8">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <TrendingUp className="h-4 w-4" />
                {total > 0 ? "Recommended for you" : "Popular right now"}
              </div>
              {total === 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {POPULAR_SEARCHES.slice(0, 10).map((term) => (
                    <Link
                      key={term}
                      href={`/search?q=${encodeURIComponent(term)}`}
                      className="rounded-full border bg-white px-3 py-1.5 text-xs font-medium shadow-sm hover:border-blue-300 hover:text-blue-700 dark:bg-gray-950"
                    >
                      {term}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="mt-4 space-y-8">
            {grouped.map(([type, list]) => {
              const meta = UNIVERSAL_TYPE_META[type]
              const Icon = TYPE_ICONS[type]
              return (
                <section key={type}>
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                      <Icon className="h-4 w-4" />
                      {meta.label} ({list.length})
                    </h2>
                    {activeQ && type === "job" && (
                      <Link
                        href={`/jobs?search=${encodeURIComponent(activeQ)}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Jobs-only view <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {list.map((item) => (
                      <Link
                        key={`${item.type}-${item.id}`}
                        href={`${meta.href}/${item.slug}`}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                          "dark:bg-gray-950 dark:border-gray-800"
                        )}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900">
                          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold group-hover:text-blue-700">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className="block truncate text-xs text-gray-500">{item.subtitle}</span>
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
