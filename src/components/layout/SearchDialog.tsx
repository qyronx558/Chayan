"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Search,
  FileText,
  Award,
  CreditCard,
  AlertCircle,
  Clock,
  History,
  TrendingUp,
  X,
  Building2,
  Newspaper,
  HelpCircle,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { POPULAR_SEARCHES, OPEN_SEARCH_EVENT } from "@/lib/search-constants"

interface SearchResult {
  id: string
  title: string
  type: "job" | "result" | "admit_card" | "answer_key" | "private_job" | "blog"
  slug: string
  category?: string
  company?: string
}

const typeConfig = {
  job: { icon: FileText, label: "Govt Jobs", href: "/apply", color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  private_job: { icon: Building2, label: "Private Jobs", href: "/private-jobs", color: "text-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
  result: { icon: Award, label: "Results", href: "/result", color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-950/30" },
  admit_card: { icon: CreditCard, label: "Admit Cards", href: "/admit-card", color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950/30" },
  answer_key: { icon: HelpCircle, label: "Answer Keys", href: "/answer-key", color: "text-indigo-500", bgColor: "bg-indigo-50 dark:bg-indigo-950/30" },
  blog: { icon: Newspaper, label: "Blogs", href: "/blog", color: "text-teal-500", bgColor: "bg-teal-50 dark:bg-teal-950/30" },
} as const

const CATEGORY_CHIPS = [
  { label: "All", value: "" },
  { label: "Govt Jobs", value: "job" },
  { label: "Private Jobs", value: "private_job" },
  { label: "Results", value: "result" },
  { label: "Admit Cards", value: "admit_card" },
  { label: "Answer Keys", value: "answer_key" },
  { label: "Blogs", value: "blog" },
]

// Module-level pending query so any visible trigger (header pill, hero hint)
// can open the dialog with a prefilled query. Consumed once on mount.
let pendingSearchQuery = ""

export function setPendingSearchQuery(q: string) {
  pendingSearchQuery = q
}

function consumePendingSearchQuery() {
  const q = pendingSearchQuery
  pendingSearchQuery = ""
  return q
}

function SearchContent({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter()
  const { data: session } = useSession()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const [selectedCategory, setSelectedCategory] = React.useState("")
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const abortRef = React.useRef<AbortController | null>(null)

  // Recent searches from localStorage (per user)
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])

  React.useEffect(() => {
    inputRef.current?.focus()
    // Load recent searches
    try {
      const stored = localStorage.getItem(`ChayanJobs_recent_searches_${session?.user?.id || "guest"}`)
      if (stored) setRecentSearches(JSON.parse(stored))
    } catch {}
  }, [session?.user?.id])

  React.useEffect(() => {
    setShowSuggestions(!query && !loading && !error)
  }, [query, loading, error])

  const saveRecentSearch = (q: string) => {
    if (!q.trim()) return
    const key = `ChayanJobs_recent_searches_${session?.user?.id || "guest"}`
    try {
      const current = recentSearches.filter((s) => s.toLowerCase() !== q.toLowerCase())
      const updated = [q, ...current].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem(key, JSON.stringify(updated))
    } catch {}
  }

  const performSearch = React.useCallback(async (q: string, category?: string) => {
    if (!q.trim()) {
      setResults([])
      setError("")
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError("")

    try {
      const params = new URLSearchParams({ q, limit: "8" })
      if (category) params.set("category", category)
      const res = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
      if (!res.ok) throw new Error("Search failed")
      const json = await res.json()
      if (controller.signal.aborted) return

      const items: SearchResult[] = []
      if (json.data?.jobs) {
        for (const j of json.data.jobs) {
          items.push({ id: j.id, title: j.title, type: "job", slug: j.slug, category: j.department?.name })
        }
      }
      if (json.data?.privateJobs) {
        for (const j of json.data.privateJobs) {
          items.push({ id: j.id, title: j.title, type: "private_job", slug: j.slug, company: j.company?.name })
        }
      }
      if (json.data?.results) {
        for (const r of json.data.results) {
          items.push({ id: r.id, title: r.title, type: "result", slug: r.slug, category: r.department?.name })
        }
      }
      if (json.data?.admitCards) {
        for (const a of json.data.admitCards) {
          items.push({ id: a.id, title: a.title, type: "admit_card", slug: a.slug, category: a.department?.name })
        }
      }
      if (json.data?.answerKeys) {
        for (const a of json.data.answerKeys) {
          items.push({ id: a.id, title: a.title, type: "answer_key", slug: a.slug, category: a.department?.name })
        }
      }
      if (json.data?.blogs) {
        for (const b of json.data.blogs) {
          items.push({ id: b.id, title: b.title, type: "blog", slug: b.slug, category: b.category?.name })
        }
      }
      setResults(items)
      setSelectedIndex(-1)
      saveRecentSearch(q)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError("Failed to perform search. Please try again.")
      setResults([])
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [recentSearches, session?.user?.id])

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const handleChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => performSearch(value, selectedCategory || undefined), 150)
  }

  // Prefill when opened via a visible trigger carrying a query (hero chip,
  // header pill with context). Consumes the module-level pending query once.
  React.useEffect(() => {
    const pending = consumePendingSearchQuery()
    if (pending.trim()) {
      setQuery(pending)
      setShowSuggestions(false)
      const t = setTimeout(() => performSearch(pending, undefined), 50)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    if (query) performSearch(query, category || undefined)
  }

  const groupedResults = React.useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    for (const r of results) {
      if (!groups[r.type]) groups[r.type] = []
      groups[r.type].push(r)
    }
    return groups
  }, [results])

  const flatResults = React.useMemo(() => results, [results])

  const navigateTo = (result: SearchResult) => {
    onNavigate()
    const base = typeConfig[result.type].href
    router.push(`${base}/${result.slug}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (showSuggestions && recentSearches.length > 0) {
        // Navigate through recent searches
        setSelectedIndex((prev) => (prev < recentSearches.length - 1 ? prev + 1 : 0))
      } else if (flatResults.length > 0) {
        setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0))
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (showSuggestions && recentSearches.length > 0 && selectedIndex > 0) {
        setSelectedIndex((prev) => prev - 1)
      } else if (flatResults.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1))
      }
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (showSuggestions && recentSearches.length > 0 && selectedIndex >= 0 && recentSearches[selectedIndex]) {
        const q = recentSearches[selectedIndex]
        setQuery(q)
        performSearch(q, selectedCategory || undefined)
        setShowSuggestions(false)
      } else if (selectedIndex >= 0 && flatResults[selectedIndex]) {
        navigateTo(flatResults[selectedIndex])
      } else if (query.trim()) {
        performSearch(query, selectedCategory || undefined)
        saveRecentSearch(query)
      }
    } else if (e.key === "Escape") {
      onNavigate()
    }
  }

  const handleSuggestionClick = (q: string) => {
    setQuery(q)
    performSearch(q, selectedCategory || undefined)
    saveRecentSearch(q)
    setShowSuggestions(false)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    try {
      localStorage.removeItem(`ChayanJobs_recent_searches_${session?.user?.id || "guest"}`)
    } catch {}
  }

  const configKeys = Object.keys(typeConfig) as (keyof typeof typeConfig)[]

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          placeholder="Search jobs, results, admit cards, blogs..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="border-0 bg-transparent pl-9 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setSelectedIndex(-1); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-1.5 py-2 border-t border-gray-200 dark:border-gray-700">
        {CATEGORY_CHIPS.map((chip) => (
          <Button
            key={chip.value}
            type="button"
            variant={selectedCategory === chip.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(chip.value)}
            className={cn(
              "h-8 px-3 text-xs font-medium transition-all",
              selectedCategory === chip.value && "shadow-sm"
            )}
          >
            {chip.label}
          </Button>
        ))}
      </div>

      <div className="max-h-[450px] overflow-y-auto border-t border-gray-200 dark:border-gray-700">
        {loading && (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && query && Object.keys(groupedResults).length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-500">
            <Search className="h-8 w-8" />
            <p className="text-sm">No results found for "{query}"</p>
            <p className="text-xs">Try different keywords or change category</p>
          </div>
        )}

        {!loading && !error && Object.entries(groupedResults).length > 0 && (
          <div className="py-2">
            {configKeys.map((type) => {
              const items = groupedResults[type]
              if (!items || items.length === 0) return null
              const config = typeConfig[type]
              const Icon = config.icon
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    <Icon className={cn("h-3.5 w-3.5", config.color)} />
                    {config.label} ({items.length})
                  </div>
                  {items.map((item) => {
                    const globalIndex = flatResults.indexOf(item)
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigateTo(item)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                          selectedIndex === globalIndex
                            ? `${config.bgColor} text-teal-700 dark:text-teal-300`
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                      >
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded", config.bgColor)}>
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div className="flex-1 truncate">
                          <p className="font-medium">{item.title}</p>
                          {item.category && (
                            <p className="text-xs text-gray-500">{item.category}</p>
                          )}
                          {item.company && !item.category && (
                            <p className="text-xs text-gray-500">{item.company}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state with suggestions */}
        {!loading && !error && !query && (
          <div className="p-4 space-y-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-2 mb-2">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    <History className="h-3.5 w-3.5" />
                    Recent Searches
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.slice(0, 5).map((search, i) => (
                    <Button
                      key={search}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(search)}
                      className="h-8 px-3 text-xs"
                      onMouseEnter={() => setSelectedIndex(i)}
                    >
                      <Clock className="h-3 w-3 mr-1.5" />
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div>
              <div className="flex items-center gap-2 px-2 mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                <TrendingUp className="h-3.5 w-3.5" />
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCHES.slice(0, 8).map((search) => (
                  <Button
                    key={search}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(search)}
                    className="h-8 px-3 text-xs"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>

            {/* Keyboard hints */}
            <div className="flex flex-col items-center gap-2 py-4 text-gray-500 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs">
                Press <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 text-xs">↑</kbd>{" "}
                <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 text-xs">↓</kbd> to navigate,{" "}
                <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 text-xs">Enter</kbd> to select
              </p>
              <p className="text-xs text-gray-400">
                <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 text-xs">Ctrl</kbd>+<kbd className="rounded border bg-gray-100 px-1.5 py-0.5 text-xs">K</kbd> to open search anytime
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" key={String(open)}>
        <DialogHeader>
          <DialogTitle className="sr-only">Search</DialogTitle>
        </DialogHeader>
        <SearchContent onNavigate={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function useSearchDialog() {
  const [open, setOpen] = React.useState(false)

  const openWithQuery = React.useCallback((q: string) => {
    setPendingSearchQuery(q)
    setOpen(true)
  }, [])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    const onRequest = (e: Event) => {
      const query = (e as CustomEvent<string>).detail ?? ""
      setPendingSearchQuery(query)
      setOpen(true)
    }
    document.addEventListener("keydown", down)
    window.addEventListener(OPEN_SEARCH_EVENT, onRequest)
    return () => {
      document.removeEventListener("keydown", down)
      window.removeEventListener(OPEN_SEARCH_EVENT, onRequest)
    }
  }, [])

  return { open, setOpen, openWithQuery }
}