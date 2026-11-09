"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  TrendingUp,
  FileText,
  Award,
  CreditCard,
  Building2,
  Newspaper,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HERO_TRENDING_SEARCHES } from "@/lib/search-constants"
import {
  UNIVERSAL_TYPE_META,
  groupUniversalItems,
  mapSearchApiToItems,
  universalItemUrl,
  type UniversalSearchItem,
  type UniversalSearchType,
} from "@/lib/universal-search"
import { cn } from "@/lib/utils"

const TYPE_ICONS: Record<UniversalSearchType, React.ElementType> = {
  job: FileText,
  private_job: Building2,
  result: Award,
  admit_card: CreditCard,
  answer_key: HelpCircle,
  blog: Newspaper,
}

interface SearchBarProps {
  /** Render without the outer section wrapper (for the hero). */
  embedded?: boolean
  /** Dark (ink) surface or light (paper) surface. */
  tone?: "light" | "dark"
  align?: "center" | "left"
  className?: string
}

export function SearchBar({
  embedded = false,
  tone = "light",
  align = "center",
  className,
}: SearchBarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const [liveItems, setLiveItems] = useState<UniversalSearchItem[]>([])
  const [liveLoading, setLiveLoading] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const abortRef = React.useRef<AbortController | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const isDark = tone === "dark"

  const goToSearchPage = (q: string) => {
    const query = q.trim()
    setFocused(false)
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (highlight >= 0 && liveItems[highlight]) {
      router.push(universalItemUrl(liveItems[highlight]))
      return
    }
    if (searchQuery.trim()) goToSearchPage(searchQuery)
  }

  const handleTrendingClick = (term: string) => {
    setSearchQuery(term)
    goToSearchPage(term)
  }

  const fetchLive = React.useCallback(async (q: string) => {
    const query = q.trim()
    if (!query) {
      setLiveItems([])
      setLiveLoading(false)
      return
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLiveLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=2`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error("failed")
      const json = await res.json()
      if (controller.signal.aborted) return
      setLiveItems(mapSearchApiToItems(json).slice(0, 7))
      setHighlight(-1)
    } catch {
      if (!controller.signal.aborted) setLiveItems([])
    } finally {
      if (!controller.signal.aborted) setLiveLoading(false)
    }
  }, [])

  const handleChange = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchLive(value), 200)
  }

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const showDropdown = focused && searchQuery.trim().length > 0
  const grouped = React.useMemo(() => groupUniversalItems(liveItems), [liveItems])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && liveItems.length > 0) {
      e.preventDefault()
      setHighlight((p) => (p < liveItems.length - 1 ? p + 1 : 0))
    } else if (e.key === "ArrowUp" && liveItems.length > 0) {
      e.preventDefault()
      setHighlight((p) => (p > 0 ? p - 1 : liveItems.length - 1))
    } else if (e.key === "Escape") {
      setFocused(false)
    }
  }

  const content = (
    <div
      className={cn(
        "w-full min-w-0",
        align === "center" ? "mx-auto max-w-2xl text-center" : "text-left",
        className
      )}
    >
      <form
        onSubmit={handleSearch}
        className="flex w-full min-w-0 items-start gap-2"
        data-tour="search-input"
      >
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search jobs, results, admit cards, exams..."
            value={searchQuery}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={handleKeyDown}
            aria-label="Search everything - jobs, results, admit cards and blogs"
            role="combobox"
            aria-expanded={showDropdown}
            className={cn(
              "h-12 w-full rounded-none pl-11 pr-4 text-base",
              isDark
                ? "border border-paper/25 bg-paper text-ink placeholder:text-muted-foreground"
                : "border border-rule-2 bg-paper-2"
            )}
          />
          {showDropdown && (
            <div
              className={cn(
                "absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden border text-left",
                isDark
                  ? "border-rule-2 bg-paper text-ink"
                  : "border-rule-2 bg-background"
              )}
            >
              {liveLoading && liveItems.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">Searching...</p>
              ) : liveItems.length === 0 && !liveLoading ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goToSearchPage(searchQuery)}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-paper-2"
                >
                  <span>
                    No quick matches. See full results for “{searchQuery.trim()}”
                  </span>
                </button>
              ) : (
                <>
                  {grouped.map(([type, list]) => {
                    const meta = UNIVERSAL_TYPE_META[type]
                    const Icon = TYPE_ICONS[type]
                    return (
                      <div key={type}>
                        <p className="agate flex items-center gap-1.5 border-t border-rule px-4 pb-1 pt-2 text-[11px] text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                          {meta.label}
                        </p>
                        {list.map((item) => {
                          const globalIndex = liveItems.indexOf(item)
                          return (
                            <button
                              key={`${item.type}-${item.id}`}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => router.push(universalItemUrl(item))}
                              onMouseEnter={() => setHighlight(globalIndex)}
                              className={cn(
                                "flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm",
                                highlight === globalIndex ? "bg-paper-2" : "hover:bg-paper-2"
                              )}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{item.title}</span>
                                {item.subtitle && (
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {item.subtitle}
                                  </span>
                                )}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goToSearchPage(searchQuery)}
                    className="flex w-full items-center justify-center border-t border-rule bg-paper-2 px-4 py-2.5 text-sm font-medium text-brick hover:bg-paper-3"
                  >
                    See all results for “{searchQuery.trim()}”
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <Button
          type="submit"
          className={cn(
            "h-12 shrink-0 rounded-none px-5 text-sm font-medium",
            isDark && "bg-paper text-ink hover:bg-paper-2"
          )}
        >
          <Search className="mr-1.5 h-4 w-4" />
          Search
        </Button>
      </form>

      <div
        className={cn(
          "mt-3 flex flex-wrap items-center gap-1.5",
          align === "center" ? "justify-center" : "justify-start"
        )}
        data-tour="trending-searches"
      >
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            isDark ? "text-paper/60" : "text-muted-foreground"
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Popular:
        </span>
        {HERO_TRENDING_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => handleTrendingClick(term)}
            className={cn(
              "border bg-transparent px-3 py-1 text-xs font-medium transition-colors",
              isDark
                ? "border-paper/25 text-paper/80 hover:border-brick hover:text-paper"
                : "border-rule text-foreground hover:border-brick hover:text-brick"
            )}
          >
            {term}
          </button>
        ))}
      </div>

      <p
        className={cn(
          "agate mt-2 text-xs",
          align === "center" ? "" : "text-left",
          isDark ? "text-paper/45" : "text-muted-foreground"
        )}
      >
        Universal search. Press Enter for the full results and recommendations page.
      </p>
    </div>
  )

  if (embedded) return content

  return (
    <section className="w-full max-w-[100vw] overflow-x-clip py-6 sm:py-8">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
        {content}
      </div>
    </section>
  )
}
