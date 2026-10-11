import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MIGRATION_REQUIRED_MESSAGE, isSchemaMismatchError } from "@/lib/prisma-errors"
import { randomBytes } from "crypto"

const db = prisma as unknown as {
  user: {
    findUnique: (a: unknown) => Promise<Record<string, unknown> | null>
    findFirst: (a: unknown) => Promise<Record<string, unknown> | null>
    update: (a: unknown) => Promise<Record<string, unknown>>
  }
}

async function twoFactorStorageReady(): Promise<boolean> {
  try {
    await db.user.findFirst({ where: {}, select: { twoFactorEnabled: true } })
    return true
  } catch (error) {
    if (isSchemaMismatchError(error)) return false
    return true
  }
}

async function audit(actorId: string, role: string | undefined, summary: string) {
  try {
    const { writeAuditEvent } = await import("@/lib/audit")
    await writeAuditEvent({ action: "UPDATE", entityType: "User", entityId: actorId, actorId, actorRole: role ?? "USER", summary, source: "API" })
  } catch { undefined }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    if (!(await twoFactorStorageReady())) {
      return NextResponse.json({ success: true, data: { enabled: false, unavailable: true } })
    }
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { twoFactorEnabled: true } })
    return NextResponse.json({ success: true, data: { enabled: (user?.["twoFactorEnabled"] as boolean) === true } })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to load 2FA status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    const enable = (body as { enabled?: boolean }).enabled !== false
    if (!(await twoFactorStorageReady())) {
      return NextResponse.json({ success: false, error: MIGRATION_REQUIRED_MESSAGE }, { status: 503 })
    }
    if (enable) {
      const secret = randomBytes(20).toString("base64url")
      await db.user.update({ where: { id: session.user.id }, data: { twoFactorEnabled: true, twoFactorSecret: secret } })
      await audit(session.user.id, session.user.role, "Two-factor authentication enabled")
      return NextResponse.json({ success: true, data: { enabled: true, secret } })
    }
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
    if (user?.["role"] === "ADMIN" || user?.["role"] === "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Two-factor authentication is required for admins" }, { status: 400 })
    }
    await db.user.update({ where: { id: session.user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
    await audit(session.user.id, session.user.role, "Two-factor authentication disabled")
    return NextResponse.json({ success: true, data: { enabled: false } })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to update 2FA" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    if (!(await twoFactorStorageReady())) {
      return NextResponse.json({ success: false, error: MIGRATION_REQUIRED_MESSAGE }, { status: 503 })
    }
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
    if (user?.["role"] === "ADMIN" || user?.["role"] === "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Two-factor authentication is required for admins" }, { status: 400 })
    }
    await db.user.update({ where: { id: session.user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
    await audit(session.user.id, session.user.role, "Two-factor authentication disabled")
    return NextResponse.json({ success: true, data: { enabled: false } })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to disable 2FA" }, { status: 500 })
  }
}
