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
    beacon("/api/track/view", { ...entity, sessionId: sessionId() })
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

export function beacon(url: string, payload: unknown) {
  const body = JSON.stringify(payload)
  try {
    if (navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) return
  } catch {}
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => null)
}
