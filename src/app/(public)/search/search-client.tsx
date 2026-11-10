"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Award, BookOpen, Briefcase, Building2, CalendarClock, Clock, CreditCard, ExternalLink, FileDown,
  FileText, Globe, GraduationCap, HelpCircle, History, KeyRound, Loader2, MapPin, Newspaper, Search,
  Sparkles, TrendingUp, Wallet, X, Users, Bell, ArrowUpRight, Command,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { buildBrowseUrl, looksLikeUrl, normalizeExternalUrl, getExternalHostname } from "@/lib/apply-room"
import {
  SEARCH_KINDS, SEARCH_KIND_META,
  type SearchAction, type SearchHit, type SearchKind, type SearchResponse, type SearchSort,
} from "@/lib/search-types"

const KIND_ICON: Record<SearchKind, React.ElementType> = {
  job: Briefcase, private_job: Building2, result: Award, admit_card: CreditCard,
  answer_key: KeyRound, syllabus: BookOpen, admission: GraduationCap, notification: Bell, blog: Newspaper,
}
const ACTION_ICON: Record<SearchAction["kind"], React.ElementType> = {
  apply: ExternalLink, open: ArrowUpRight, pdf: FileDown, website: Globe,
}
const SORTS: { value: SearchSort; label: string }[] = [
  { value: "relevance", label: "Best match" },
  { value: "latest", label: "Newest first" },
  { value: "deadline", label: "Closing soonest" },
]
const WITHIN = [
  { value: "", label: "Any time" }, { value: "1", label: "Past 24 hours" },
  { value: "7", label: "Past week" }, { value: "30", label: "Past month" }, { value: "90", label: "Past 3 months" },
]
const RECENT_KEY = "cj-recent-searches"

function loadRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]")
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 8) : []
  } catch { return [] }
}
function saveRecent(q: string) {
  const t = q.trim()
  if (!t || t.length < 2) return
  const next = [t, ...loadRecent().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8)
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch { /* ignore */ }
}

function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  const safe = tokens.filter((t) => t.length > 1).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  if (!safe.length) return <>{text}</>
  const parts = text.split(new RegExp(`(${safe.join("|")})`, "ig"))
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <mark key={i} className="rounded-sm bg-brick/15 px-0.5 text-inherit">{p}</mark> : <React.Fragment key={i}>{p}</React.Fragment>
      )}
    </>
  )
}

function StateBadge({ hit }: { hit: SearchHit }) {
  if (!hit.state) return null
  const days = hit.lastDate ? Math.ceil((+new Date(hit.lastDate) - Date.now()) / 86_400_000) : null
  const map = {
    open: { label: days != null ? `${days}d left` : "Open", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
    closing: { label: days != null && days >= 0 ? `Closing in ${days}d` : "Closing soon", cls: "bg-brick/10 text-brick" },
    closed: { label: "Closed", cls: "bg-muted text-muted-foreground" },
    upcoming: { label: "Upcoming", cls: "bg-sky-500/10 text-sky-700 dark:text-sky-400" },
  } as const
  const m = map[hit.state]
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", m.cls)}>{m.label}</span>
}

export function SearchClient() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const urlQ = sp.get("q") ?? ""
  const type = (SEARCH_KINDS as string[]).includes(sp.get("type") ?? "") ? (sp.get("type") as SearchKind) : null
  const sort = (["latest", "deadline"].includes(sp.get("sort") ?? "") ? sp.get("sort") : "relevance") as SearchSort
  const within = sp.get("within") ?? ""
  const openOnly = sp.get("open") === "1"

  const [input, setInput] = React.useState(urlQ)
  const [focused, setFocused] = React.useState(false)
  const [data, setData] = React.useState<SearchResponse | null>(null)
  const [extra, setExtra] = React.useState<SearchHit[]>([])
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [more, setMore] = React.useState(false)
  const [error, setError] = React.useState("")
  const [recent, setRecent] = React.useState<string[]>([])
  const [trending, setTrending] = React.useState<string[]>([])
  const inputRef = React.useRef<HTMLInputElement>(null)

  const update = React.useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v)
        else next.delete(k)
      }
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [sp, router, pathname]
  )

  // Keep box in sync when navigation changes ?q (e.g. from the browser omnibox).
  React.useEffect(() => { setInput(urlQ) }, [urlQ])
  React.useEffect(() => {
    setRecent(loadRecent())
    fetch("/api/search/trending").then((r) => r.json()).then((j) => setTrending(j.terms ?? [])).catch(() => {})
  }, [])

  // "/" focuses search, Esc clears.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") { e.preventDefault(); inputRef.current?.focus() }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); inputRef.current?.focus() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Debounced live search as you type (URL updates after a pause).
  React.useEffect(() => {
    if (input.trim() === urlQ.trim()) return
    const t = setTimeout(() => update({ q: input.trim() || null }), 350)
    return () => clearTimeout(t)
  }, [input, urlQ, update])

  const key = `${urlQ}|${type}|${sort}|${within}|${openOnly}`
  React.useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true); setError(""); setPage(1); setExtra([])
    const params = new URLSearchParams({ q: urlQ, limit: "12", sort })
    if (type) params.set("type", type)
    if (within) params.set("within", within)
    if (openOnly) params.set("open", "1")
    fetch(`/api/search/advanced?${params}`, { signal: ctrl.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((j: SearchResponse) => { setData(j); if (urlQ.trim().length > 1) { saveRecent(urlQ); setRecent(loadRecent()) } })
      .catch((e) => { if (e?.name !== "AbortError") { setError("Search failed. Please try again."); setData(null) } })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loadMore = async () => {
    setMore(true)
    try {
      const params = new URLSearchParams({ q: urlQ, limit: "12", sort, page: String(page + 1) })
      if (type) params.set("type", type)
      if (within) params.set("within", within)
      if (openOnly) params.set("open", "1")
      const j: SearchResponse = await fetch(`/api/search/advanced?${params}`).then((r) => r.json())
      setExtra((e) => [...e, ...j.hits]); setPage((p) => p + 1)
      setData((d) => (d ? { ...d, hasMore: j.hasMore } : d))
    } finally { setMore(false) }
  }

  const hits = data ? [...data.hits, ...extra] : []
  const [selected, setSelected] = React.useState<string | null>(null)
  const activeHit = hits.find((h) => h.id === selected) ?? hits[0] ?? null
  const tokens = data?.tokens ?? []
  const urlTarget = looksLikeUrl(input.trim()) ? normalizeExternalUrl(input.trim()) : null
  const activeFilters = (within ? 1 : 0) + (openOnly ? 1 : 0) + (sort !== "relevance" ? 1 : 0)
  const totalAll = data ? SEARCH_KINDS.reduce((n, k) => n + data.facets[k], 0) : 0
  const showSuggest = focused && !input.trim() && (recent.length > 0 || trending.length > 0)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    inputRef.current?.blur()
    update({ q: input.trim() || null })
  }

  const Filters = (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sort by</legend>
        <div className="space-y-1">
          {SORTS.map((s) => (
            <label key={s.value} className={cn("flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted", sort === s.value && "bg-muted font-semibold")}>
              <input type="radio" name="sort" className="accent-brick" checked={sort === s.value} onChange={() => update({ sort: s.value === "relevance" ? null : s.value })} />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Posted</legend>
        <div className="space-y-1">
          {WITHIN.map((w) => (
            <label key={w.value} className={cn("flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted", within === w.value && "bg-muted font-semibold")}>
              <input type="radio" name="within" className="accent-brick" checked={within === w.value} onChange={() => update({ within: w.value || null })} />
              {w.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-rule px-3 py-2.5 text-sm">
        <span>
          <span className="block font-semibold">Still accepting</span>
          <span className="block text-xs text-muted-foreground">Hide jobs &amp; admissions past deadline</span>
        </span>
        <input type="checkbox" className="h-4 w-4 accent-brick" checked={openOnly} onChange={(e) => update({ open: e.target.checked ? "1" : null })} />
      </label>
      {activeFilters > 0 && (
        <button type="button" onClick={() => update({ sort: null, within: null, open: null })} className="text-sm font-medium text-brick underline underline-offset-4">
          Reset filters
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-paper-2/70 to-background">
      {/* ── Command bar ── */}
      <div className="border-b border-rule bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-4 pb-6 pt-12 sm:px-8 lg:px-10 lg:pt-16">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brick">
            <Sparkles className="h-3.5 w-3.5" /> ChayanJobs Search
          </p>
          <h1 className="max-w-3xl font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            {urlQ ? <>Results for <span className="text-brick">“{urlQ}”</span></> : "Search every job, result & notice"}
          </h1>

          <form onSubmit={submit} role="search" className="relative mt-8 max-w-4xl">
            <div className={cn("flex items-center gap-3 rounded-2xl border bg-card px-4 shadow-sm transition-shadow", focused ? "border-brick shadow-lg ring-4 ring-brick/10" : "border-rule")}>
              {loading && urlQ ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brick" /> : <Search className="h-5 w-5 shrink-0 text-muted-foreground" />}
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                onKeyDown={(e) => { if (e.key === "Escape") { setInput(""); update({ q: null }); inputRef.current?.blur() } }}
                placeholder="Search jobs, results, admit cards - or paste any website link"
                aria-label="Search ChayanJobs or open a website"
                autoComplete="off"
                spellCheck={false}
                className="h-16 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
              />
              {input && (
                <button type="button" aria-label="Clear" onClick={() => { setInput(""); update({ q: null }); inputRef.current?.focus() }} className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden items-center gap-1 rounded-md border border-rule bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>

            {showSuggest && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-rule bg-card shadow-xl">
                {recent.length > 0 && (
                  <div className="p-3">
                    <div className="mb-1.5 flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span className="flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> Recent</span>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]) }} className="normal-case tracking-normal hover:text-brick">Clear</button>
                    </div>
                    {recent.map((r) => (
                      <button key={r} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setInput(r); update({ q: r }) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted">
                        <Clock className="h-4 w-4 text-muted-foreground" /> {r}
                      </button>
                    ))}
                  </div>
                )}
                {trending.length > 0 && (
                  <div className="border-t border-rule p-3">
                    <div className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" /> Trending</div>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {trending.slice(0, 8).map((t) => (
                        <button key={t} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setInput(t); update({ q: t }) }} className="rounded-full border border-rule px-3 py-1 text-xs font-medium hover:border-brick hover:text-brick">{t}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          <p className="mt-2 hidden text-xs text-muted-foreground sm:block">
            Tips: <code className="rounded bg-muted px-1">type:result</code> limits to one section · <code className="rounded bg-muted px-1">is:open</code> hides closed · press <kbd className="rounded border border-rule px-1">/</kbd> to focus
          </p>

          {/* Paste-a-link: opens through the in-app browser, in a new tab */}
          {urlTarget && (
            <a
              href={buildBrowseUrl(urlTarget, { from: "/search" })}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-3 rounded-xl border border-brick/40 bg-brick/5 p-3 transition-colors hover:bg-brick/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brick text-brick-ink"><Globe className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Open {getExternalHostname(urlTarget)} inside ChayanJobs</span>
                <span className="block truncate text-xs text-muted-foreground">{urlTarget} · opens in a new tab with forms &amp; PDFs working</span>
              </span>
              <ArrowUpRight className="h-5 w-5 text-brick" />
            </a>
          )}

          {/* Kind tabs with live counts */}
          <div className="-mx-1 mt-8 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter by section">
            <KindTab active={!type} onClick={() => update({ type: null })} icon={Search} label="All" count={data ? totalAll : null} />
            {SEARCH_KINDS.map((k) => (
              <KindTab key={k} active={type === k} onClick={() => update({ type: k })} icon={KIND_ICON[k]} label={SEARCH_KIND_META[k].label} count={data ? data.facets[k] : null} dim={!!data && data.facets[k] === 0} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-10 xl:grid-cols-[220px_minmax(0,1fr)_400px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{Filters}</div>
        </aside>

        <main className="min-w-0">
          <details className="mb-4 rounded-xl border border-rule bg-card lg:hidden">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold">
              Filters &amp; sort {activeFilters > 0 && <span className="ml-1 rounded-full bg-brick px-1.5 text-xs text-brick-ink">{activeFilters}</span>}
            </summary>
            <div className="border-t border-rule p-4">{Filters}</div>
          </details>

          {data && !loading && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">{data.total.toLocaleString()}</strong> {data.total === 1 ? "result" : "results"}
                {urlQ ? <> for <strong className="text-foreground">{urlQ}</strong></> : null} · {data.tookMs}ms
              </span>
              {data.suggestion && urlQ.toLowerCase() !== data.suggestion && (
                <span>Showing results for <button className="font-semibold text-brick underline underline-offset-4" onClick={() => { setInput(data.suggestion!); update({ q: data.suggestion }) }}>{data.suggestion}</button></span>
              )}
            </div>
          )}

          {loading ? (
            <div className="space-y-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-3xl border border-rule bg-card p-7">
                  <div className="mb-3 h-3 w-24 rounded bg-muted" />
                  <div className="mb-2 h-5 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-brick/30 bg-brick/5 p-8 text-center">
              <p className="font-semibold text-brick">{error}</p>
              <button onClick={() => update({})} className="mt-3 text-sm underline">Retry</button>
            </div>
          ) : hits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-rule bg-card p-10 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-display text-lg font-bold">No matches for “{urlQ}”</p>
              <p className="mt-1 text-sm text-muted-foreground">Try fewer words, check spelling, or remove filters.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {trending.slice(0, 8).map((t) => (
                  <button key={t} onClick={() => { setInput(t); update({ q: t, type: null }) }} className="rounded-full border border-rule px-3 py-1 text-xs font-medium hover:border-brick hover:text-brick">{t}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <ul className="space-y-5">
                {hits.map((h) => <HitCard key={`${h.kind}-${h.id}`} hit={h} tokens={tokens} selected={activeHit?.id === h.id} onSelect={() => setSelected(h.id)} />)}
              </ul>
              {data?.hasMore && (
                <div className="mt-6 text-center">
                  <button onClick={loadMore} disabled={more} className="inline-flex h-11 items-center gap-2 rounded-xl border border-rule bg-card px-6 text-sm font-semibold shadow-sm transition-colors hover:border-brick hover:text-brick disabled:opacity-60">
                    {more && <Loader2 className="h-4 w-4 animate-spin" />} Load more results
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Preview pane (xl+) */}
        <aside className="hidden xl:block">
          <div className="sticky top-24">
            {activeHit && !loading ? <PreviewPane hit={activeHit} tokens={tokens} /> : (
              <div className="rounded-3xl border border-dashed border-rule p-10 text-center text-sm text-muted-foreground">Select a result to preview it here.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function KindTab({ active, onClick, icon: Icon, label, count, dim }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string; count: number | null; dim?: boolean }) {
  return (
    <button
      type="button" role="tab" aria-selected={active} onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
        active ? "border-foreground bg-foreground text-background" : "border-rule bg-card hover:border-foreground/50",
        dim && !active && "opacity-50"
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
      {count !== null && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-background/20" : "bg-muted text-muted-foreground")}>{count}</span>}
    </button>
  )
}

function HitCard({ hit, tokens, selected, onSelect }: { hit: SearchHit; tokens: string[]; selected: boolean; onSelect: () => void }) {
  const Icon = KIND_ICON[hit.kind]
  const meta = SEARCH_KIND_META[hit.kind]
  return (
    <li onClick={onSelect} onMouseEnter={onSelect} className={cn("group relative cursor-pointer rounded-3xl border bg-card p-5 shadow-sm transition-all hover:shadow-md sm:p-7", selected ? "border-foreground/60 ring-2 ring-foreground/10" : "border-rule hover:border-foreground/40")}>
      <div className="flex items-start gap-5">
        <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted sm:flex"><Icon className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brick">{meta.singular}</span>
            <StateBadge hit={hit} />
            {hit.trending && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400"><TrendingUp className="h-3 w-3" />Trending</span>}
            <span className="ml-auto text-xs text-muted-foreground">{formatDate(hit.date)}</span>
          </div>

          <h2 className="mt-2 font-display text-xl font-bold leading-snug sm:text-2xl">
            <Link href={hit.href} {...(hit.href.startsWith("/browse") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="hover:text-brick">
              <Highlight text={hit.title} tokens={tokens} />
            </Link>
          </h2>

          {hit.subtitle && <p className="mt-0.5 text-sm text-muted-foreground"><Highlight text={hit.subtitle} tokens={tokens} /></p>}
          {hit.snippet && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground"><Highlight text={hit.snippet} tokens={tokens} /></p>}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {hit.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{hit.location}</span>}
            {hit.vacancies != null && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{hit.vacancies.toLocaleString()} posts</span>}
            {hit.salary && <span className="inline-flex items-center gap-1"><Wallet className="h-3.5 w-3.5" />{hit.salary}</span>}
            {hit.lastDate && <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />Last date {formatDate(hit.lastDate)}</span>}
          </div>

          {hit.actions.length > 0 && (
            <div className="relative z-10 mt-5 flex flex-wrap gap-2.5" onClick={(e) => e.stopPropagation()}>
              {hit.actions.map((a) => {
                const AIcon = ACTION_ICON[a.kind] ?? FileText
                return (
                  <a
                    key={a.label}
                    href={a.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors",
                      a.primary ? "bg-foreground text-background hover:bg-brick hover:text-brick-ink" : "border border-rule bg-background hover:border-foreground/50"
                    )}
                  >
                    <AIcon className="h-4 w-4" /> {a.label}
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

function PreviewPane({ hit, tokens }: { hit: SearchHit; tokens: string[] }) {
  const Icon = KIND_ICON[hit.kind]
  const meta = SEARCH_KIND_META[hit.kind]
  const facts = [
    hit.subtitle ? { label: hit.kind === "private_job" ? "Company" : "Organisation", value: hit.subtitle } : null,
    hit.location ? { label: "Location", value: hit.location } : null,
    hit.vacancies != null ? { label: "Posts", value: hit.vacancies.toLocaleString() } : null,
    hit.salary ? { label: "Salary", value: hit.salary } : null,
    hit.lastDate ? { label: "Last date", value: formatDate(hit.lastDate) } : null,
    { label: "Posted", value: formatDate(hit.date) },
    hit.status ? { label: "Status", value: hit.status } : null,
  ].filter(Boolean) as { label: string; value: string }[]
  return (
    <div className="overflow-hidden rounded-3xl border border-rule bg-card shadow-lg">
      <div className="bg-gradient-to-br from-brick/15 via-muted to-card p-7">
        <div className="flex items-center justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-sm"><Icon className="h-6 w-6" /></span>
          <StateBadge hit={hit} />
        </div>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-brick">{meta.singular}</p>
        <h3 className="mt-1 font-display text-2xl font-bold leading-snug"><Highlight text={hit.title} tokens={tokens} /></h3>
      </div>
      <div className="space-y-6 p-7">
        {hit.snippet && <p className="text-sm leading-relaxed text-muted-foreground">{hit.snippet}</p>}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          {facts.map((f) => (
            <div key={f.label} className={f.label === "Organisation" || f.label === "Company" ? "col-span-2" : ""}>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</dt>
              <dd className="mt-0.5 font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-2.5">
          {hit.actions.map((a) => {
            const AIcon = ACTION_ICON[a.kind] ?? FileText
            return (
              <a key={a.label} href={a.href} target="_blank" rel="noopener noreferrer"
                className={cn("flex h-12 w-full items-center justify-between rounded-xl px-5 text-sm font-semibold transition-colors",
                  a.primary ? "bg-foreground text-background hover:bg-brick hover:text-brick-ink" : "border border-rule hover:border-foreground/50")}>
                <span className="flex items-center gap-2"><AIcon className="h-4 w-4" />{a.label}</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )
          })}
          <Link href={hit.href} {...(hit.href.startsWith("/browse") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="flex h-11 w-full items-center justify-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-brick hover:underline">
            View full details &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
