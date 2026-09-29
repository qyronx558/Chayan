export type Role = "USER" | "ADMIN" | "SUPER_ADMIN"

export const isSuperAdmin = (role?: string | null): boolean => role === "SUPER_ADMIN"

export const isAdmin = (role?: string | null): boolean => role === "ADMIN" || role === "SUPER_ADMIN"

export const canManageAllContent = (role?: string | null): boolean => isSuperAdmin(role)

export const canManageUsers = (role?: string | null): boolean => isSuperAdmin(role)

/**
 * Returns the owner-scoping filter for converted admins.
 * SUPER_ADMIN sees everything; regular ADMIN only sees their own content;
 * unauthenticated/public requests are unfiltered (published content).
 */
export function contentScope(role?: string | null, userId?: string | null): { createdById?: string } {
  if (role === "ADMIN" && userId) return { createdById: userId }
  return {}
}

export type ContentScopeParam = "mine" | "all" | null | undefined

/**
 * Resolve admin content scope for list endpoints.
 * - ADMIN can only use `mine` (own content). Requesting `all` throws 403.
 * - SUPER_ADMIN can use `mine` (own) or `all` (every admin, optional createdById filter).
 * - Public callers pass no scope and get published content only (handled per-route).
 */
export function resolveContentScope(
  scope: ContentScopeParam,
  role?: string | null,
  userId?: string | null,
  createdById?: string | null
): { createdById?: string } {
  if (scope === "all") {
    if (role !== "SUPER_ADMIN") {
      const err = new Error("Only super admins can view all content")
      ;(err as Error & { status?: number }).status = 403
      throw err
    }
    if (createdById) return { createdById }
    return {}
  }
  return contentScope(role, userId)
}

export const canReviewContent = (role?: string | null): boolean => role === "SUPER_ADMIN"

/** Canonical unique Admin ID = User.id (cuid). Exposed + searchable, never reassigned. */
export function shortAdminId(id?: string | null, len = 8): string {
  if (!id) return "-"
  return id.length > len ? `${id.slice(0, len)}…` : id
}
