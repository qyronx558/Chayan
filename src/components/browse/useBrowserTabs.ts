"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getExternalHostname, normalizeExternalUrl } from "@/lib/apply-room"

export interface BrowserTab {
 id: string
 /** Empty string = blank "New tab" page (nothing loaded yet). */
 url: string
 title: string
 hostname: string
 /** pdf tabs use the same-origin /api/doc viewer for guaranteed framing */
 kind: "web" | "pdf"
 /** Pages visited in this tab, oldest first (Back / Forward walk this list). */
 history: TabVisit[]
 /** Position of the page being shown inside `history`. */
 index: number
}

export interface TabVisit {
 url: string
 title: string
}

/** Longest Back trail kept per tab; older pages drop off the start. */
const MAX_HISTORY = 50

const STORAGE_PREFIX = "cj-browser-tabs-v1:"
export const MAX_TABS = 8

function storageKey(scope: string): string {
 return `${STORAGE_PREFIX}${scope}`
}

function makeId(): string {
 try {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
 } catch { /* fallback below */ }
 return `tab-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

export function makeBlankTab(): BrowserTab {
 return { id: makeId(), url: "", title: "New tab", hostname: "", kind: "web", history: [], index: -1 }
}

/** Tab fields that follow from the page being shown. */
function pageFields(visit: TabVisit): Pick<BrowserTab, "url" | "title" | "hostname" | "kind"> {
 return {
  url: visit.url,
  title: visit.title,
  hostname: getExternalHostname(visit.url),
  kind: /\.pdf(\?|#|$)/i.test(visit.url) ? "pdf" : "web",
 }
}

function toTab(url: string, title?: string | null): BrowserTab | null {
 const normalized = normalizeExternalUrl(url)
 if (!normalized) return null
 const hostname = getExternalHostname(normalized)
 // Chrome-like: show the page title, fall back to the domain (never a raw URL).
 const visit: TabVisit = { url: normalized, title: (title || "").trim().slice(0, 80) || hostname }
 return { id: makeId(), ...pageFields(visit), history: [visit], index: 0 }
}

function sanitizeStored(raw: unknown): BrowserTab[] {
 if (!Array.isArray(raw)) return []
 const out: BrowserTab[] = []
 for (const t of raw as Array<Partial<BrowserTab>>) {
  if (!t || typeof t !== "object") continue
  if (t.url === "") {
   // Blank "New tab" pages survive reloads.
   out.push({ ...makeBlankTab(), id: typeof t.id === "string" ? t.id : makeId() })
   continue
  }
  if (typeof t.url !== "string" || !normalizeExternalUrl(t.url)) continue
  const url = normalizeExternalUrl(t.url) as string
  const hostname = getExternalHostname(url)
  const current: TabVisit = {
   url,
   title: typeof t.title === "string" && t.title.trim() ? t.title.trim().slice(0, 80) : hostname,
  }
  // Restore the Back / Forward trail; anything malformed falls back to just this page.
  let history: TabVisit[] = []
  if (Array.isArray(t.history)) {
   for (const v of t.history as Array<Partial<TabVisit>>) {
    const visitUrl = v && typeof v.url === "string" ? normalizeExternalUrl(v.url) : null
    if (!visitUrl) continue
    history.push({
     url: visitUrl,
     title: typeof v.title === "string" && v.title.trim() ? v.title.trim().slice(0, 80) : getExternalHostname(visitUrl),
    })
   }
  }
  let index = typeof t.index === "number" && Number.isInteger(t.index) ? t.index : -1
  if (history.length > MAX_HISTORY || !history[index] || history[index].url !== url) {
   history = [current]
   index = 0
  }
  out.push({ id: typeof t.id === "string" ? t.id : makeId(), ...pageFields(current), history, index })
 }
 return out.slice(0, MAX_TABS)
}

export interface BrowserTabsApi {
 tabs: BrowserTab[]
 activeId: string | null
 activeTab: BrowserTab | null
 openTab: (url: string, opts?: { title?: string | null; switchTo?: boolean }) => BrowserTab | null
 closeTab: (id: string) => void
 switchTab: (id: string) => void
 navigateActive: (url: string, opts?: { title?: string | null }) => BrowserTab | null
 newTab: () => BrowserTab
 /** The active tab has an earlier / later page in its own trail. */
 canGoBack: boolean
 canGoForward: boolean
 goBack: () => void
 goForward: () => void
}

/**
 * Multi-tab state for the ChayanJobs in-app browser.
 * Persisted per-page-scope in sessionStorage so refresh keeps tabs.
 * Clean + simple: max 8 tabs, oldest evicted past the cap, min 1 tab.
 */
export function useBrowserTabs(scope: string, initialUrl: string, initialTitle?: string | null): BrowserTabsApi {
 const [tabs, setTabs] = useState<BrowserTab[]>(() => {
  const first = toTab(initialUrl, initialTitle)
  const fallback = first ? [first] : [makeBlankTab()]
  if (typeof window === "undefined") return fallback
  try {
   const raw = window.sessionStorage.getItem(storageKey(scope))
   if (raw) {
    const valid = sanitizeStored(JSON.parse(raw))
    if (valid.length > 0) {
     // Ensure the freshly requested URL opens (deep link from a new job).
     const normalized = normalizeExternalUrl(initialUrl)
     // A tab that started on this link and has since moved on (it is in the
     // tab's Back trail) still counts: a refresh must not open a second tab.
     if (normalized && !valid.some((t) => t.url === normalized || t.history.some((v) => v.url === normalized))) {
      const extra = toTab(normalized, initialTitle)
      if (extra) return [...valid, extra].slice(-MAX_TABS)
     }
     return valid
    }
   }
  } catch { /* corrupted storage -> fall through to initial */ }
  return fallback
 })
 const [activeId, setActiveId] = useState<string | null>(() => {
  // Prefer the tab that belongs to the requested link (showing it now or
  // earlier in its trail); otherwise the most recent tab.
  const normalized = normalizeExternalUrl(initialUrl)
  const owner = normalized
   ? tabs.find((t) => t.url === normalized) ?? tabs.find((t) => t.history.some((v) => v.url === normalized))
   : undefined
  return (owner ?? tabs[tabs.length - 1])?.id ?? null
 })

 // Persist on change.
 useEffect(() => {
  try {
   window.sessionStorage.setItem(storageKey(scope), JSON.stringify(tabs))
  } catch { /* storage full/blocked -> tabs still work in memory */ }
 }, [tabs, scope])

 // Keep activeId valid when tabs close.
 useEffect(() => {
  /* eslint-disable react-hooks/set-state-in-effect -- syncing selection after tab close is intentional */
  if (tabs.length === 0) { setActiveId(null); return }
  if (!activeId || !tabs.some((t) => t.id === activeId)) setActiveId(tabs[tabs.length - 1].id)
  /* eslint-enable react-hooks/set-state-in-effect */
 }, [tabs, activeId])

 const openTab = useCallback((url: string, opts?: { title?: string | null; switchTo?: boolean }) => {
  const tab = toTab(url, opts?.title)
  if (!tab) return null
  setTabs((prev) => {
   // Reuse an existing tab for the same URL instead of duplicating.
   const existing = prev.find((t) => t.url !== "" && t.url === tab.url)
   if (existing) {
    if (opts?.switchTo !== false) setActiveId(existing.id)
    return prev
   }
   // Prefer replacing a blank tab over evicting a loaded one.
   const blankIdx = prev.findIndex((t) => t.url === "")
   if (blankIdx >= 0) {
    const next = [...prev]
    next[blankIdx] = { ...tab, id: next[blankIdx].id }
    if (opts?.switchTo !== false) setActiveId(next[blankIdx].id)
    return next
   }
   const next = [...prev, tab]
   const trimmed = next.length > MAX_TABS ? next.slice(next.length - MAX_TABS) : next
   if (opts?.switchTo !== false) setActiveId(tab.id)
   return trimmed
  })
  return tab
 }, [])

 const closeTab = useCallback((id: string) => {
  setTabs((prev) => {
   if (prev.length <= 1) return prev // keep at least one tab (clean UX)
   return prev.filter((t) => t.id !== id)
  })
 }, [])

 const switchTab = useCallback((id: string) => setActiveId(id), [])

 const navigateActive = useCallback((url: string, opts?: { title?: string | null }) => {
  const normalized = normalizeExternalUrl(url)
  if (!normalized || !activeId) return null
  const hostname = getExternalHostname(normalized)
  let updated: BrowserTab | null = null
  setTabs((prev) => prev.map((t) => {
   if (t.id !== activeId) return t
   if (t.url === normalized) return t // same page: nothing new to go back from
   // Retitle to the new destination (Chrome-like); explicit title wins.
   const visit: TabVisit = { url: normalized, title: (opts?.title || "").trim().slice(0, 80) || hostname }
   // Like a real browser: a new page replaces whatever was ahead in Forward.
   const history = [...t.history.slice(0, t.index + 1), visit].slice(-MAX_HISTORY)
   updated = { ...t, ...pageFields(visit), history, index: history.length - 1 }
   return updated
  }))
  return updated
 }, [activeId])

 /** Move the active tab along its own trail (-1 = Back, +1 = Forward). */
 const step = useCallback((delta: number) => {
  setTabs((prev) => prev.map((t) => {
   if (t.id !== activeId) return t
   const visit = t.history[t.index + delta]
   return visit ? { ...t, ...pageFields(visit), index: t.index + delta } : t
  }))
 }, [activeId])
 const goBack = useCallback(() => step(-1), [step])
 const goForward = useCallback(() => step(1), [step])

 const newTab = useCallback(() => {
  const tab = makeBlankTab()
  setTabs((prev) => {
   const next = [...prev, tab].slice(-MAX_TABS)
   setActiveId(tab.id)
   return next
  })
  return tab
 }, [])

 const activeTab = useMemo(() => tabs.find((t) => t.id === activeId) ?? tabs[0] ?? null, [tabs, activeId])

 const canGoBack = !!activeTab && activeTab.index > 0
 const canGoForward = !!activeTab && activeTab.index < activeTab.history.length - 1

 return {
  tabs, activeId: activeTab?.id ?? null, activeTab, openTab, closeTab, switchTab, navigateActive, newTab,
  canGoBack, canGoForward, goBack, goForward,
 }
}
