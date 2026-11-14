import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/roles"

/**
 * Location master data (states, districts) is managed by SUPER_ADMIN only.
 * ADMINs can read it and attach it to jobs, but never create/edit/delete it.
 * Middleware only checks isAdmin, so every write route must call this.
 */
export async function requireSuperAdmin(forbiddenMessage = "Only super admins can manage states and districts") {
  const session = await auth()
  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) }
  }
  if (!isSuperAdmin(session.user.role)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: forbiddenMessage },
        { status: 403 }
      ),
    }
  }
  return { ok: true as const, user: session.user }
}

/** P2002 → 409 with a message naming the clashing field. */
export function locationConflictResponse(error: unknown, entity: "State" | "District"): NextResponse | null {
  if ((error as { code?: string })?.code !== "P2002") return null
  const target = (error as { meta?: { target?: unknown } }).meta?.target
  const field = Array.isArray(target) ? target.join(",") : String(target ?? "")
  const what = field.includes("slug") ? "slug" : "name"
  const scope = entity === "District" ? " in this state" : ""
  return NextResponse.json(
    { success: false, error: `A ${entity.toLowerCase()} with this ${what} already exists${scope}.` },
    { status: 409 }
  )
}

export function serverError(error: unknown, fallback: string) {
  return NextResponse.json(
    { success: false, error: error instanceof Error ? error.message : fallback },
    { status: 500 }
  )
}
