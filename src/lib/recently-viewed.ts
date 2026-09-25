"use client"

export type ViewedItemType =
  | "job"
  | "result"
  | "admit_card"
  | "answer_key"
  | "admission"
  | "private_job"
  | "blog"
  | "syllabus"
  | "page"

export interface ViewedItem {
  href: string
  title: string
  type: ViewedItemType
  visitedAt: number
  visits: number
  /** 0-100 reading progress (max scroll depth reached on that page) */
  progress: number
}

const STORAGE_KEY = "chayan_recently_viewed_v1"
const PAUSED_KEY = "chayan_recently_viewed_paused"
const MAX_ITEMS = 20

const EVENT_NAME = "chayan:recently-viewed-updated"

export function emitViewedUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME))
  }
}

export function onViewedUpdate(cb: () => void) {
  if (typeof window === "undefined") return () => {}
  const handler = () => cb()
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener("storage", handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener("storage", handler)
  }
}

export function isHistoryPaused(): boolean {
  try {
    return localStorage.getItem(PAUSED_KEY) === "1"
  } catch {
    return false
  }
}

export function setHistoryPaused(paused: boolean) {
  try {
    localStorage.setItem(PAUSED_KEY, paused ? "1" : "0")
  } catch {}
  emitViewedUpdate()
}

/** Infer content type + human label from a pathname, Next.js style. */
export function inferTypeFromPath(pathname: string): ViewedItemType {
  const p = pathname.toLowerCase()
  if (p.startsWith("/apply/") || p === "/jobs" || p.startsWith("/jobs/")) return "job"
  if (p.startsWith("/result/") || p === "/results" || p.startsWith("/results/")) return "result"
  if (p.startsWith("/admit-card") || p.startsWith("/admit-cards")) return "admit_card"
  if (p.startsWith("/answer-key")) return "answer_key"
  if (p.startsWith("/admission")) return "admission"
  if (p.startsWith("/private-jobs")) return "private_job"
  if (p.startsWith("/blog")) return "blog"
  if (p.startsWith("/syllabus")) return "syllabus"
  return "page"
}

/** Detail pages worth remembering. Listing/home pages are skipped to keep history meaningful. */
export function isTrackablePath(pathname: string): boolean {
  const p = pathname.split("?")[0].toLowerCase().replace(/\/$/, "") || "/"
  if (p === "/" || p === "/search" || p === "/login" || p === "/register") return false
  if (p.startsWith("/admin") || p.startsWith("/api")) return false
  if (p === "/jobs" || p === "/results" || p === "/admit-cards" || p === "/answer-keys") return false
  return (
    p.startsWith("/apply/") ||
    p.startsWith("/result/") ||
    p.startsWith("/admit-card/") ||
    p.startsWith("/answer-key/") ||
    p.startsWith("/admission/") ||
    p.startsWith("/private-jobs/") ||
    p.startsWith("/blog/") ||
    p.startsWith("/syllabus/") ||
    p.startsWith("/category/") ||
    p.startsWith("/tools/")
  )
}

export function prettifyTitle(pathname: string, fallback: string): string {
  const clean = fallback.replace(/\s*\|\s*.*$/, "").replace(/\s*-\s*Chayan.*$/i, "").trim()
  if (clean && clean.length > 3 && clean.toLowerCase() !== "chayan") return clean
  const slug = pathname.split("/").filter(Boolean).pop() ?? ""
  const words = slug.replace(/-/g, " ").trim()
  if (!words) return "Untitled page"
  return words.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 80)
}

export function getViewedItems(): ViewedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ViewedItem[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((i) => i && typeof i.href === "string" && typeof i.title === "string")
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, MAX_ITEMS)
  } catch {
    return []
  }
}

export function recordView(input: { href: string; title: string; type?: ViewedItemType }) {
  try {
    if (isHistoryPaused()) return
    const href = input.href.split("#")[0]
    if (!href || href.length < 2) return
    const existing = getViewedItems()
    const now = Date.now()
    const prev = existing.find((i) => i.href === href)
    const item: ViewedItem = {
      href,
      title: input.title.slice(0, 120) || "Untitled page",
      type: input.type ?? inferTypeFromPath(href),
      visitedAt: now,
      visits: (prev?.visits ?? 0) + 1,
      progress: prev?.progress ?? 0,
    }
    const next = [item, ...existing.filter((i) => i.href !== href)].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    emitViewedUpdate()
  } catch {}
}

export function updateProgress(href: string, progress: number) {
  try {
    if (isHistoryPaused()) return
    const clean = href.split("#")[0]
    const items = getViewedItems()
    const idx = items.findIndex((i) => i.href === clean)
    if (idx === -1) return
    const clamped = Math.max(0, Math.min(100, Math.round(progress)))
    // Only ever move forward (like video resume), reset only on re-visit handled by recordView ordering.
    if (clamped <= (items[idx].progress ?? 0)) return
    items[idx] = { ...items[idx], progress: clamped }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    // Don't emit on every scroll tick — the section reads progress on mount/remount.
  } catch {}
}

export function removeViewedItem(href: string) {
  try {
    const next = getViewedItems().filter((i) => i.href !== href)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    emitViewedUpdate()
  } catch {}
}

export function clearViewedItems() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    emitViewedUpdate()
  } catch {}
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(days / 365)}y ago`
}
