"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Inline border colours: the global `* { border-color }` rule outranks layered utilities.
const BRICK = "var(--color-brick)"

export interface SidebarGroup {
  id: string
  title: string
  articles: { slug: string; title: string; description: string }[]
}

function matches(query: string, a: { title: string; description: string }) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return q.split(/\s+/).every((word) => a.title.toLowerCase().includes(word) || a.description.toLowerCase().includes(word))
}

function SidebarNav({ groups, onNavigate }: { groups: SidebarGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname()
  const [query, setQuery] = useState("")

  const filtered = useMemo(
    () => groups.map((g) => ({ ...g, articles: g.articles.filter((a) => matches(query, a)) })).filter((g) => g.articles.length > 0),
    [groups, query],
  )

  return (
    <div>
      <label htmlFor="docs-filter" className="sr-only">
        Filter guides
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id="docs-filter"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter guides"
          autoComplete="off"
          className="h-9 w-full border border-rule bg-paper pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-rule-2 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear filter"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <nav aria-label="Help Centre guides" className="mt-5 space-y-6">
        <Link
          href="/docs"
          onClick={onNavigate}
          aria-current={pathname === "/docs" ? "page" : undefined}
          style={{ borderLeftColor: pathname === "/docs" ? BRICK : "transparent" }}
          className={cn(
            "block border-l-2 py-1 pl-3 text-sm no-underline transition-colors",
            pathname === "/docs" ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Help Centre home
        </Link>
        {filtered.map((group) => (
          <div key={group.id}>
            <p className="agate mb-1.5 text-[0.75rem] text-muted-foreground">{group.title}</p>
            <ul className="border-l border-rule">
              {group.articles.map((a) => {
                const href = `/docs/${a.slug}`
                const active = pathname === href
                return (
                  <li key={a.slug}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      style={{ borderLeftColor: active ? BRICK : "transparent" }}
                      className={cn(
                        "-ml-px block border-l-2 py-1.5 pl-3 text-[0.92rem] leading-snug no-underline transition-colors",
                        active ? "font-semibold text-foreground" : "text-ink-2 hover:text-foreground",
                      )}
                    >
                      {a.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No guide matches “{query}”. Try a simpler word, or see the{" "}
            <Link href="/docs/faq" onClick={onNavigate} className="text-brick underline">
              FAQ
            </Link>
            .
          </p>
        ) : null}
      </nav>
    </div>
  )
}

export function DocsSidebar({ groups }: { groups: SidebarGroup[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const current = groups.flatMap((g) => g.articles).find((a) => pathname === `/docs/${a.slug}`)

  return (
    <>
      {/* Small screens: a collapsible menu above the article */}
      <div className="docs-chrome lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="docs-mobile-nav"
          className="flex w-full items-center justify-between border-y-2 border-rule-2 py-2.5 text-left"
        >
          <span className="min-w-0">
            <span className="agate block text-[0.72rem] text-muted-foreground">Help Centre menu</span>
            <span className="block truncate font-display font-bold text-foreground">{current?.title ?? "All guides"}</span>
          </span>
          <span className="agate shrink-0 text-sm text-muted-foreground">{open ? "Close" : "Browse"}</span>
        </button>
        {open ? (
          <div id="docs-mobile-nav" className="border-b border-rule pb-6 pt-4">
            <SidebarNav groups={groups} onNavigate={() => setOpen(false)} />
          </div>
        ) : null}
      </div>

      {/* Large screens: a sticky column */}
      <aside className="docs-chrome hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-10 pr-2 [scrollbar-width:thin]">
          <SidebarNav groups={groups} />
        </div>
      </aside>
    </>
  )
}
