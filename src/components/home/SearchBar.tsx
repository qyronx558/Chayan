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
        className="relative w-full min-w-0"
        data-tour="search-input"
      >
        <div
          className={cn(
            "group relative flex h-14 w-full min-w-0 items-center rounded-full border p-1.5 pl-5 transition-all sm:h-16",
            "shadow-[0_1px_2px_rgba(40,30,20,.05),0_10px_28px_-16px_rgba(40,30,20,.25)]",
            "focus-within:border-[var(--hs-trust)] focus-within:shadow-[0_0_0_4px_var(--hs-trust-soft)]",
            isDark ? "border-paper/25 bg-paper text-ink" : "border-rule/70 bg-background"
          )}
        >
          <Search className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-focus-within:text-[var(--hs-trust)]" aria-hidden />
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
            className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 font-outlier text-[15px] shadow-none outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-base"
          />
          <Button
            type="submit"
            aria-label="Search"
            className="h-full shrink-0 rounded-full bg-brick px-4 font-outlier text-sm font-semibold text-brick-ink transition-colors hover:bg-brick/90 sm:px-6"
          >
            <Search className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </div>
        {showDropdown && (
          <div
            className={cn(
              "absolute left-0 right-0 top-full z-40 mt-3 hs-r overflow-hidden border text-left font-outlier shadow-[0_18px_44px_-18px_rgba(40,30,20,.35)]",
              isDark ? "border-rule-2 bg-paper text-ink" : "border-rule/70 bg-background"
            )}
          >
            {liveLoading && liveItems.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">Searching...</p>
            ) : liveItems.length === 0 && !liveLoading ? (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goToSearchPage(searchQuery)}
                className="flex w-full items-center justify-between px-5 py-4 text-sm hover:bg-paper-2"
              >
                <span>No quick matches. See full results for “{searchQuery.trim()}”</span>
              </button>
            ) : (
              <>
                {grouped.map(([type, list]) => {
                  const meta = UNIVERSAL_TYPE_META[type]
                  const Icon = TYPE_ICONS[type]
                  return (
                    <div key={type} className="py-1">
                      <p className="flex items-center gap-1.5 px-5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                              "hs-r-sm mx-2 flex w-[calc(100%-1rem)] items-center gap-2.5 px-3 py-2 text-left text-sm",
                              highlight === globalIndex ? "bg-paper-2" : "hover:bg-paper-2"
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{item.title}</span>
                              {item.subtitle && (
                                <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
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
                  className="flex w-full items-center justify-center border-t border-rule/60 bg-paper-2 px-5 py-3 text-sm font-semibold text-[var(--hs-trust)] hover:bg-paper-3"
                >
                  See all results for “{searchQuery.trim()}”
                </button>
              </>
            )}
          </div>
        )}
      </form>

      <div
        className={cn(
          "mt-4 flex flex-wrap items-center gap-2 font-outlier",
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
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors max-sm:min-h-9 max-sm:text-[13px]",
              isDark
                ? "border-paper/25 text-paper/80 hover:border-[var(--hs-trust)] hover:text-paper"
                : "border-rule/60 bg-transparent text-foreground hover:border-[var(--hs-trust)] hover:bg-[var(--hs-trust-soft)] hover:text-[var(--hs-trust)]"
            )}
          >
            {term}
          </button>
        ))}
      </div>

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
