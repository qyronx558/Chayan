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
