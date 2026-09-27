"use client"

import { api } from "@/lib/api"

/** Fire-and-forget audit log; never blocks the UI. */
export function audit(action: string, entity: string, entityId: string, details?: string) {
  try {
    api.post("/api/logs", { action, entity, entityId, details }).catch(() => {})
  } catch {
    /* noop */
  }
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

export function isExpiringSoon(dateStr: string | null | undefined, days = 7): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return false
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return diff > 0 && diff < days * 86400000
}

export const CONTENT_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
] as const

export const JOB_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "EXPIRED", label: "Expired" },
] as const

export function contentStatusBadge(status: string | null | undefined): string {
  switch ((status || "").toUpperCase()) {
    case "PUBLISHED":
    case "ACTIVE":
      return "bg-green-100 text-green-800"
    case "ARCHIVED":
    case "EXPIRED":
      return "bg-red-100 text-red-800"
    case "UPCOMING":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-700"
  }
}
