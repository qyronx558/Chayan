"use client"

/**
 * Which private jobs this candidate has applied to (opened the application
 * from ChayanJobs), for "Applied · 12 Nov" badges and the My applications page.
 *
 * - Every visitor: kept on this device (localStorage), so guests have it too.
 * - Signed in: also saved to their account (PrivateApplication), merged in
 *   here, and anything recorded on this device before sign-in is imported once.
 */

import { useEffect, useSyncExternalStore } from "react"
import { useSession } from "next-auth/react"

export interface AppliedEntry {
  /** ISO time the application was first opened. */
  at: string
  title?: string
  company?: string
  slug?: string
}

const KEY = "cj-applied-jobs-v1"
const MAX_LOCAL = 500

let local: Record<string, AppliedEntry> | null = null
let server: Record<string, AppliedEntry> = {}
let snapshot: Map<string, AppliedEntry> = new Map()
const EMPTY: Map<string, AppliedEntry> = new Map()
const listeners = new Set<() => void>()

function readLocal(): Record<string, AppliedEntry> {
  if (local) return local
  local = {}
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed === "object") {
      for (const [id, e] of Object.entries(parsed as Record<string, AppliedEntry>)) {
        if (e && typeof e.at === "string") local[id] = e
      }
    }
  } catch {
    // Storage blocked or corrupt: start empty.
  }
  return local
}

function writeLocal() {
  try {
    const entries = Object.entries(readLocal()).sort((a, b) => b[1].at.localeCompare(a[1].at)).slice(0, MAX_LOCAL)
    local = Object.fromEntries(entries)
    window.localStorage.setItem(KEY, JSON.stringify(local))
  } catch {
    // Storage full or blocked: the in-memory copy still works this visit.
  }
}

function rebuild() {
  const next = new Map<string, AppliedEntry>()
  for (const [id, e] of Object.entries(readLocal())) next.set(id, e)
  for (const [id, e] of Object.entries(server)) {
    const mine = next.get(id)
    // Earliest time wins; keep whichever copy has the job details.
    next.set(id, mine ? { ...e, ...mine, at: mine.at < e.at ? mine.at : e.at } : e)
  }
  snapshot = next
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return
    local = null
    rebuild()
  }
  window.addEventListener("storage", onStorage)
  if (listeners.size === 1 && snapshot.size === 0) rebuild()
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

const getSnapshot = () => snapshot
const getServerSnapshot = () => EMPTY

async function post(items: { privateJobId: string; appliedAt?: string }[], source: "apply_click" | "import") {
  try {
    const res = await fetch("/api/private-applications/applied", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, source }),
      keepalive: true,
    })
    return res.ok
  } catch {
    return false
  }
}

/** Record that the candidate opened this job's application. Idempotent. */
export function markApplied(job: { id: string; title?: string; company?: string; slug?: string }, opts: { signedIn?: boolean } = {}) {
  const map = readLocal()
  const first = !map[job.id]
  map[job.id] = { at: map[job.id]?.at ?? new Date().toISOString(), title: job.title, company: job.company, slug: job.slug }
  writeLocal()
  rebuild()
  if (opts.signedIn !== false && first) void post([{ privateJobId: job.id, appliedAt: map[job.id].at }], "apply_click")
  window.dispatchEvent(new CustomEvent("cj-applied-change", { detail: { id: job.id } }))
}

/**
 * "I didn't apply": forget it on this device and, unless the caller already
 * changed the account record itself (`server: false`), remove it there too.
 */
export function unmarkApplied(id: string, opts: { server?: boolean } = {}) {
  if (opts.server !== false && server[id]) {
    void fetch(`/api/private-applications?privateJobId=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => undefined)
  }
  const map = readLocal()
  delete map[id]
  delete server[id]
  writeLocal()
  rebuild()
  window.dispatchEvent(new CustomEvent("cj-applied-change", { detail: { id } }))
}

let syncing: Promise<void> | null = null
let syncedFor: string | null = null

/** Pull the account's applied jobs and push this device's ones (once per sign-in). */
function syncAccount(userKey: string) {
  if (syncedFor === userKey) return syncing
  syncedFor = userKey
  syncing = (async () => {
    try {
      const res = await fetch("/api/private-applications")
      if (!res.ok) return
      const json = await res.json()
      const next: Record<string, AppliedEntry> = {}
      for (const a of (json.data || []) as {
        status: string
        appliedAt: string | null
        updatedAt: string
        job: { id: string; title: string; company: string; slug: string }
      }[]) {
        if (a.status === "saved" || a.status === "withdrawn") continue
        next[a.job.id] = { at: a.appliedAt || a.updatedAt, title: a.job.title, company: a.job.company, slug: a.job.slug }
      }
      server = next
      rebuild()
      const missing = Object.entries(readLocal())
        .filter(([id]) => !next[id])
        .slice(0, 100)
        .map(([privateJobId, e]) => ({ privateJobId, appliedAt: e.at }))
      if (missing.length) await post(missing, "import")
    } catch {
      syncedFor = null // retry on the next mount
    }
  })()
  return syncing
}

function useAccountSync() {
  const { data, status } = useSession()
  const userKey = status === "authenticated" ? data?.user?.id || data?.user?.email || "me" : null
  useEffect(() => {
    if (userKey) void syncAccount(userKey)
  }, [userKey])
  return status === "authenticated"
}

/** All applied jobs (id → entry). Empty during the server render. */
export function useAppliedJobs(): Map<string, AppliedEntry> {
  useAccountSync()
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** When this job was applied to, or null. */
export function useAppliedAt(jobId: string): string | null {
  const map = useAppliedJobs()
  return map.get(jobId)?.at ?? null
}

/** Whether the visitor is signed in (for markApplied's account save). */
export { useAccountSync as useAppliedSync }
