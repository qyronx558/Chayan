import { prisma } from "@/lib/prisma"

/**
 * Live account state used to keep JWT sessions honest: the role is re-read
 * from the database (so a demoted admin loses access) and sessions issued
 * before the last password change are rejected.
 *
 * Cached briefly per instance so it costs at most one small query per user
 * every CACHE_MS. Any failure returns null and the session is left untouched.
 */

export interface AuthState {
  role: "USER" | "ADMIN" | "SUPER_ADMIN"
  passwordChangedAt: number | null
}

const CACHE_MS = 30_000
const cache = new Map<string, { at: number; state: AuthState | null }>()

type FindUser = (a: unknown) => Promise<Record<string, unknown> | null>

export async function loadAuthState(userId: string): Promise<AuthState | null> {
  const now = Date.now()
  const hit = cache.get(userId)
  if (hit && now - hit.at < CACHE_MS) return hit.state

  const find = prisma.user.findUnique as unknown as FindUser
  let row: Record<string, unknown> | null = null
  try {
    row = await find({ where: { id: userId }, select: { role: true, passwordChangedAt: true } })
  } catch {
    try {
      row = await find({ where: { id: userId }, select: { role: true } })
    } catch {
      return null
    }
  }

  const role = row?.role
  const state: AuthState | null =
    role === "USER" || role === "ADMIN" || role === "SUPER_ADMIN"
      ? {
          role,
          passwordChangedAt: row?.passwordChangedAt ? new Date(row.passwordChangedAt as string | Date).getTime() : null,
        }
      : null

  if (cache.size > 5000) cache.clear()
  cache.set(userId, { at: now, state })
  return state
}

/** Drop the cached state after a role or password change so it applies at once. */
export function invalidateAuthState(userId: string): void {
  cache.delete(userId)
}
