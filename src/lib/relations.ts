import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Normalizes an optional relation id coming from admin forms / API payloads.
 * - `null` / `undefined` / `""` / whitespace-only (`" "`, `"  "`) → `null`
 *   (Radix Select uses `" "` / `"none"` sentinels for "None" — those must
 *   never reach `prisma.xxx.connect({ id })`).
 * - otherwise returns the trimmed id.
 */
export function normalizeOptionalId(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.toLowerCase() === "none" || trimmed === "__none" || trimmed === "__draft") return null
  return trimmed
}

/**
 * Normalizes a required relation id. Returns `""` when missing so callers
 * can return a 400 with a friendly message.
 */
export function normalizeRequiredId(value: unknown): string {
  if (typeof value !== "string") return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.toLowerCase() === "none" || trimmed === "__none") return ""
  return trimmed
}

/** Normalizes an optional plain-text status (`" "` → `null`). */
export function normalizeOptionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== "string") return value as string
  const trimmed = value.trim()
  return trimmed ? value : null
}

export type RelationCheck = {
  departmentId?: string | null
  categoryId?: string | null
  stateId?: string | null
  jobId?: string | null
  companyId?: string | null
  blogCategoryId?: string | null
}

/**
 * Verifies that every provided relation id actually exists. Returns an error
 * message naming the missing relation, or `null` when everything is fine.
 * Run this BEFORE any `connect: { id }` so a stale/deleted dropdown value
 * becomes a 400 ("Selected X no longer exists…") instead of Prisma P2025
 * ("An operation failed because it depends on one or more records…").
 */
export async function findMissingRelation(check: RelationCheck): Promise<string | null> {
  const tasks: Array<Promise<{ label: string; found: boolean }>> = []

  if (check.departmentId) {
    tasks.push(
      prisma.department
        .findUnique({ where: { id: check.departmentId }, select: { id: true } })
        .then((r) => ({ label: "Department", found: !!r }))
    )
  }
  if (check.categoryId) {
    tasks.push(
      prisma.category
        .findUnique({ where: { id: check.categoryId }, select: { id: true } })
        .then((r) => ({ label: "Category", found: !!r }))
    )
  }
  if (check.stateId) {
    tasks.push(
      prisma.state
        .findUnique({ where: { id: check.stateId }, select: { id: true } })
        .then((r) => ({ label: "State", found: !!r }))
    )
  }
  if (check.jobId) {
    tasks.push(
      prisma.job
        .findUnique({ where: { id: check.jobId }, select: { id: true } })
        .then((r) => ({ label: "Linked Job", found: !!r }))
    )
  }
  if (check.companyId) {
    tasks.push(
      prisma.company
        .findUnique({ where: { id: check.companyId }, select: { id: true } })
        .then((r) => ({ label: "Company", found: !!r }))
    )
  }
  if (check.blogCategoryId) {
    tasks.push(
      prisma.blogCategory
        .findUnique({ where: { id: check.blogCategoryId }, select: { id: true } })
        .then((r) => ({ label: "Blog category", found: !!r }))
    )
  }

  if (tasks.length === 0) return null
  const results = await Promise.all(tasks)
  const missing = results.filter((r) => !r.found).map((r) => r.label)
  if (missing.length === 0) return null
  return `Selected ${missing.join(", ")} no longer exists. Please refresh the page and select again.`
}

export function missingRelationResponse(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 })
}

/**
 * Converts low-level Prisma relation errors into friendly 400s.
 * - P2025 (record required for `connect` not found) → 400 with guidance.
 * - P2002 (unique constraint, e.g. duplicate slug) → 409.
 * - P2003 (FK constraint) → 400.
 * Returns `null` when the error is not a recognized Prisma error.
 */
export function prismaRelationErrorResponse(error: unknown): NextResponse | null {
  const code = (error as { code?: string })?.code
  const message = error instanceof Error ? error.message : ""
  if (code === "P2025" || /depends on one or more records that were required but not found/i.test(message)) {
    const match =
      message.match(/No '(\w+)' record\(s\)/i) ||
      message.match(/needed to inline the relation on '(\w+)'/i)
    const model = match?.[1]
    return NextResponse.json(
      {
        success: false,
        error: model
          ? `Selected ${model} no longer exists. Please refresh and select a valid ${model}.`
          : "A selected Department / Category / State / Job / Company no longer exists. Please refresh and select again.",
      },
      { status: 400 }
    )
  }
  if (code === "P2002") {
    return NextResponse.json(
      { success: false, error: "A record with this slug already exists. Please use a different slug." },
      { status: 409 }
    )
  }
  if (code === "P2003") {
    return NextResponse.json(
      { success: false, error: "A selected reference no longer exists. Please refresh and try again." },
      { status: 400 }
    )
  }
  return null
}
