import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type AnyClient = Record<string, {
  findMany: (a: unknown) => Promise<Array<Record<string, unknown>>>
}>

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const db = prisma as unknown as AnyClient
    let events: Array<Record<string, unknown>> = []
    try {
      if (db.auditEvent) {
        events = await db.auditEvent.findMany({
          where: { OR: [{ actorId: session.user.id }, { entityType: "User", entityId: session.user.id }] },
          orderBy: { createdAt: "desc" }, take: 20,
        })
      } else if (db.log) {
        const logs = await db.log.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 20 })
        events = logs.map((l) => ({ id: l["id"], summary: l["details"] ?? `${l["action"]} ${l["entity"]}`, createdAt: l["createdAt"], action: l["action"] }))
      }
    } catch { events = [] }
    let attempts: Array<Record<string, unknown>> = []
    try {
      if (db.loginAttempt) {
        attempts = await db.loginAttempt.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 10 })
      }
    } catch { attempts = [] }
    return NextResponse.json({
      success: true,
      data: {
        events: events.map((e) => ({
          id: String(e["id"] ?? ""),
          summary: String(e["summary"] ?? e["details"] ?? "Activity"),
          createdAt: String(e["createdAt"] ?? new Date().toISOString()),
          action: e["action"] ? String(e["action"]) : undefined,
        })),
        signIns: attempts.map((a) => ({
          id: String(a["id"] ?? ""),
          success: a["success"] === true,
          device: a["device"] ? String(a["device"]) : "Unknown device",
          createdAt: String(a["createdAt"] ?? new Date().toISOString()),
        })),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to load activity" }, { status: 500 })
  }
}
