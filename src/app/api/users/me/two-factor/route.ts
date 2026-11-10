import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MIGRATION_REQUIRED_MESSAGE, isSchemaMismatchError } from "@/lib/prisma-errors"
import { randomBytes } from "crypto"
import { base32Encode, base32Decode, verifyTOTP } from "@/lib/totp"

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

function generateBackupCodes(count = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const hex = randomBytes(4).toString("hex")
    codes.push(`${hex.slice(0, 4)}-${hex.slice(4, 8)}`)
  }
  return codes
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
    const action = (body as { action?: string }).action

    if (!(await twoFactorStorageReady())) {
      return NextResponse.json({ success: false, error: MIGRATION_REQUIRED_MESSAGE }, { status: 503 })
    }

    if (action === "setup") {
      const secret = base32Encode(randomBytes(20))
      const email = session.user.email || "user"
      const issuer = "SarkariPrime"
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

      await db.user.update({
        where: { id: session.user.id },
        data: { twoFactorSecret: secret, twoFactorEnabled: false },
      })

      return NextResponse.json({
        success: true,
        data: { otpauthUrl, secret, step: "verify" },
      })
    }

    if (action === "verify") {
      const token = (body as { token?: string }).token
      if (!token || typeof token !== "string" || !/^\d{6}$/.test(token)) {
        return NextResponse.json({ success: false, error: "Enter a valid 6-digit code" }, { status: 400 })
      }

      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { twoFactorSecret: true, twoFactorEnabled: true },
      })
      const secret = user?.["twoFactorSecret"] as string | null
      if (!secret) {
        return NextResponse.json({ success: false, error: "Start 2FA setup first" }, { status: 400 })
      }

      if (!(await verifyTOTP(secret, token))) {
        return NextResponse.json({ success: false, error: "Invalid code. Check your authenticator app and try again." }, { status: 400 })
      }

      const backupCodes = generateBackupCodes()

      await db.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: true },
      })

      await audit(session.user.id, session.user.role, "Two-factor authentication enabled")

      return NextResponse.json({
        success: true,
        data: { enabled: true, backupCodes },
      })
    }

    if (action === "disable") {
      const token = (body as { token?: string }).token
      if (!token || typeof token !== "string" || !/^\d{6}$/.test(token)) {
        return NextResponse.json({ success: false, error: "Enter your authenticator code to disable 2FA" }, { status: 400 })
      }

      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, twoFactorSecret: true },
      })

      if (user?.["role"] === "ADMIN" || user?.["role"] === "SUPER_ADMIN") {
        return NextResponse.json({ success: false, error: "Two-factor authentication is required for admins" }, { status: 400 })
      }

      const secret = user?.["twoFactorSecret"] as string | null
      if (!secret || !(await verifyTOTP(secret, token))) {
        return NextResponse.json({ success: false, error: "Invalid code" }, { status: 400 })
      }

      await db.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      })

      await audit(session.user.id, session.user.role, "Two-factor authentication disabled")
      return NextResponse.json({ success: true, data: { enabled: false } })
    }

    // Legacy toggle support
    const enable = (body as { enabled?: boolean }).enabled !== false
    if (enable) {
      const secret = base32Encode(randomBytes(20))
      await db.user.update({ where: { id: session.user.id }, data: { twoFactorEnabled: true, twoFactorSecret: secret } })
      await audit(session.user.id, session.user.role, "Two-factor authentication enabled")
      return NextResponse.json({ success: true, data: { enabled: true } })
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
