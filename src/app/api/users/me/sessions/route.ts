import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type AnyClient = Record<string, {
  findMany: (a: unknown) => Promise<Array<Record<string, unknown>>>
  deleteMany: (a: unknown) => Promise<unknown>
  delete: (a: unknown) => Promise<unknown>
}>

function client(): AnyClient {
  return prisma as unknown as AnyClient
}

function describeAgent(ua: string | null | undefined): string {
  if (!ua) return "Unknown device"
  if (/mobile|android|iphone/i.test(ua)) return "Mobile browser"
  if (/macintosh|mac os/i.test(ua)) return "Mac browser"
  if (/windows/i.test(ua)) return "Windows browser"
  if (/linux/i.test(ua)) return "Linux browser"
  return "Web browser"
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const db = client()
    const [authSessions, tracked] = await Promise.all([
      db.session ? db.session.findMany({ where: { userId: session.user.id }, orderBy: { expires: "desc" }, take: 20 }).catch(() => []) : Promise.resolve([]),
      db.userSession ? db.userSession.findMany({ where: { userId: session.user.id }, orderBy: { lastActiveAt: "desc" }, take: 20 }).catch(() => []) : Promise.resolve([]),
    ])
    const ua = request.headers.get("user-agent") ?? undefined
    const currentHint = describeAgent(ua)
    const seen = new Map<string, Record<string, unknown>>()
    for (const s of authSessions) {
      const id = String(s["id"] ?? s["sessionToken"] ?? Math.random())
      seen.set(id, {
        id, device: describeAgent(typeof s["userAgent"] === "string" ? (s["userAgent"] as string) : currentHint),
        location: (s["location"] as string) ?? "Unknown location",
        lastActiveAt: (s["expires"] as string) ?? new Date().toISOString(),
        current: false, kind: "auth",
      })
    }
    for (const t of tracked) {
      const id = String(t["id"])
      if (!seen.has(id)) {
        seen.set(id, {
          id, device: (t["device"] as string) ?? "Unknown device",
          location: (t["location"] as string) ?? "Unknown location",
          lastActiveAt: (t["lastActiveAt"] as string) ?? (t["createdAt"] as string) ?? new Date().toISOString(),
          current: false, kind: "tracked",
        })
      }
    }
    const list = Array.from(seen.values())
    if (list.length > 0) list[0]["current"] = true
    if (list.length === 0) {
      list.push({ id: "current", device: currentHint, location: "This network", lastActiveAt: new Date().toISOString(), current: true, kind: "current" })
    }
    return NextResponse.json({ success: true, data: list })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to load sessions" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    const id = (body as { id?: string }).id
    const keepCurrent = (body as { exceptCurrent?: boolean }).exceptCurrent === true
    const db = client()
    if (keepCurrent) {
      if (db.userSession) await db.userSession.deleteMany({ where: { userId: session.user.id } }).catch(() => undefined)
      try {
        const { writeAuditEvent } = await import("@/lib/audit")
        await writeAuditEvent({ action: "UPDATE", entityType: "User", entityId: session.user.id, actorId: session.user.id, actorRole: session.user.role ?? "USER", summary: "Signed out other sessions", source: "API" })
      } catch { undefined }
      return NextResponse.json({ success: true, data: null })
    }
    if (!id || id === "current") {
      return NextResponse.json({ success: false, error: "Cannot sign out the current session here" }, { status: 400 })
    }
    if (db.userSession) await db.userSession.delete({ where: { id } }).catch(() => undefined)
    if (db.session) await db.session.delete({ where: { id } }).catch(() => undefined)
    try {
      const { writeAuditEvent } = await import("@/lib/audit")
      await writeAuditEvent({ action: "UPDATE", entityType: "User", entityId: session.user.id, actorId: session.user.id, actorRole: session.user.role ?? "USER", summary: `Session signed out (${id})`, source: "API" })
    } catch { undefined }
    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to sign out session" }, { status: 500 })
  }
}
