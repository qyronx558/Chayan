import { auth } from "@/lib/auth"
import { isAdmin, resolveContentScope } from "@/lib/roles"
import { isModerationStatus } from "@/lib/moderation"

/**
 * Shared admin/public scope handling for the 8 reviewable content types.
 * - `scope=mine`: owner-scoped (ADMIN sees own, SUPER_ADMIN sees own when asked).
 * - `scope=all`: SUPER_ADMIN only, optional `createdById` (unique Admin ID) + `moderation` filters.
 * - `onlyAdmins=true` (with scope=all): hide SUPER_ADMIN's own uploads - verification queue shows
 *   only ADMIN-uploaded content.
 * - no scope (public): only APPROVED content.
 */
export async function applyContentScope<T extends Record<string, unknown>>(
  where: T,
  searchParams: URLSearchParams
): Promise<{ scope: string | null; isAdminScope: boolean }> {
  const scope = searchParams.get("scope")
  const createdById = searchParams.get("createdById") || ""
  const moderation = searchParams.get("moderation") || ""
  const onlyAdmins = searchParams.get("onlyAdmins") === "true"

  if (scope === "mine" || scope === "all") {
    const session = await auth()
    if (!session?.user || !isAdmin(session.user.role)) {
      const err = new Error("Unauthorized")
      ;(err as Error & { status?: number }).status = 401
      throw err
    }
    try {
      Object.assign(
        where,
        resolveContentScope(scope, session.user.role, session.user.id, createdById || undefined)
      )
    } catch (e) {
      throw e
    }
    // ADMINs may filter their own queue by moderation; SUPER_ADMIN can filter anything.
    if (moderation) {
      if (!isModerationStatus(moderation)) {
        const err = new Error("Invalid moderation filter")
        ;(err as Error & { status?: number }).status = 400
        throw err
      }
      ;(where as Record<string, unknown>).moderation = moderation
    }
    // Guard: ADMIN must not snoop another admin's queue via createdById.
    if (scope === "mine" && session.user.role === "ADMIN" && createdById && createdById !== session.user.id) {
      const err = new Error("Forbidden")
      ;(err as Error & { status?: number }).status = 403
      throw err
    }
    // Verification views: only ADMIN-uploaded content, never SUPER_ADMIN's own uploads.
    // (createdById + onlyAdmins combine with AND when both are present.)
    if (onlyAdmins) {
      if (session.user.role !== "SUPER_ADMIN") {
        const err = new Error("Forbidden")
        ;(err as Error & { status?: number }).status = 403
        throw err
      }
      ;(where as Record<string, unknown>).createdBy = { role: "ADMIN" }
    }
    return { scope, isAdminScope: true }
  }

  // Public surface: verification gate - only approved content is visible.
  ;(where as Record<string, unknown>).moderation = "APPROVED"
  return { scope, isAdminScope: false }
}

export function scopeErrorStatus(err: unknown): number {
  const s = (err as { status?: unknown })?.status
  return typeof s === "number" ? s : 500
}

export const CREATED_BY_SELECT = {
  createdBy: { select: { id: true, name: true, email: true } },
} as const
