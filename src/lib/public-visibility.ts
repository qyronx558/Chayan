import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"

/**
 * Public detail pages show only APPROVED content. Pending / rejected posts
 * (bot imports, ADMIN drafts awaiting review) 404 for visitors and crawlers,
 * but staff can still open them to preview before approving.
 */
export async function canViewContent(moderation: string | null | undefined): Promise<boolean> {
  if (moderation === "APPROVED" || moderation === null || moderation === undefined) return true
  try {
    const session = await auth()
    return isAdmin(session?.user?.role)
  } catch {
    return false
  }
}

export function isPubliclyVisible(moderation: string | null | undefined): boolean {
  return moderation === "APPROVED" || moderation === null || moderation === undefined
}

/** robots meta for detail pages: anything not approved stays out of search indexes. */
export function robotsFor(moderation: string | null | undefined, thin = false) {
  return moderation === "APPROVED" && !thin ? undefined : { index: false, follow: true }
}
