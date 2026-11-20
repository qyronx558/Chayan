export type TrackedEntityType =
  | "JOB"
  | "PRIVATE_JOB"
  | "RESULT"
  | "ADMIT_CARD"
  | "ANSWER_KEY"
  | "SYLLABUS"
  | "ADMISSION"
  | "BLOG"

interface PendingEntity {
  path: string
  entityType: TrackedEntityType
  entityId: string
}

let pending: PendingEntity | null = null
let lastViewPath: string | null = null

export function declareEntity(entity: PendingEntity) {
  if (lastViewPath === entity.path) {
    lastViewPath = null
    queueView({ ...entity, sessionId: sessionId() })
    return
  }
  pending = entity
}

export function takeEntity(path: string): Omit<PendingEntity, "path"> | null {
  if (!pending || pending.path !== path) {
    lastViewPath = path
    return null
  }
  const { entityType, entityId } = pending
  pending = null
  lastViewPath = null
  return { entityType, entityId }
}

export function sessionId(): string {
  try {
    let v = sessionStorage.getItem("cj_sid")
    if (!v) {
      v = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem("cj_sid", v)
    }
    return v
  } catch {
    return `${Date.now().toString(36)}`
  }
}

// Views and vitals are queued and sent as ONE request when the tab is hidden
// or closed (or the queue fills), instead of one request per page: every
// request starts a server function, so batching cuts invocations by the
// number of pages a visitor opens.
const MAX_QUEUE = 20
let views: unknown[] = []
let vitals: unknown[] = []
const beforeFlush = new Set<() => void>()
let listening = false

function listen() {
  if (listening || typeof window === "undefined") return
  listening = true
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushTracking()
  })
  window.addEventListener("pagehide", flushTracking)
}

export function queueView(payload: unknown) {
  listen()
  views.push(payload)
  if (views.length >= MAX_QUEUE) flushTracking()
}

export function queueVitals(payload: unknown) {
  listen()
  vitals.push(payload)
}

/** Runs `fn` right before the next flush (e.g. to record time on page). */
export function onBeforeFlush(fn: () => void): () => void {
  beforeFlush.add(fn)
  return () => beforeFlush.delete(fn)
}

export function flushTracking() {
  for (const fn of [...beforeFlush]) {
    try {
      fn()
    } catch {}
  }
  if (views.length === 0 && vitals.length === 0) return
  const body = { views, vitals }
  views = []
  vitals = []
  beacon("/api/track/view", body)
}

function beacon(url: string, payload: unknown) {
  const body = JSON.stringify(payload)
  try {
    if (navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) return
  } catch {}
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => null)
}
