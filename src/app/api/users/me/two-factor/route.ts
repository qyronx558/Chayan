import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MIGRATION_REQUIRED_MESSAGE, isSchemaMismatchError } from "@/lib/prisma-errors"
import { randomBytes } from "crypto"
import { base32Encode, verifyTOTP } from "@/lib/totp"
import { rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit"

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
  } catch { /* ignore */ }
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
      // Starting setup replaces the secret, so it must never be possible while
      // 2FA is on - otherwise a stolen session could switch 2FA off without a code.
      const current = await db.user.findUnique({ where: { id: session.user.id }, select: { twoFactorEnabled: true } })
      if (current?.["twoFactorEnabled"] === true) {
        return NextResponse.json(
          { success: false, error: "Two-factor authentication is already on. Disable it with your authenticator code first." },
          { status: 400 }
        )
      }
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
      if (!(await rateLimit([{ key: `2fa-code:user:${session.user.id}`, max: 10, windowSec: 900 }])).ok) {
        return NextResponse.json({ success: false, error: TOO_MANY_ATTEMPTS }, { status: 429 })
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

      await db.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: true },
      })

      await audit(session.user.id, session.user.role, "Two-factor authentication enabled")

      return NextResponse.json({
        success: true,
        // Backup codes are not issued until they can be stored and checked at
        // login; handing out codes that do not work would be worse than none.
        data: { enabled: true, backupCodes: [] as string[] },
      })
    }

    if (action === "disable") {
      const token = (body as { token?: string }).token
      if (!token || typeof token !== "string" || !/^\d{6}$/.test(token)) {
        return NextResponse.json({ success: false, error: "Enter your authenticator code to disable 2FA" }, { status: 400 })
      }
      if (!(await rateLimit([{ key: `2fa-code:user:${session.user.id}`, max: 10, windowSec: 900 }])).ok) {
        return NextResponse.json({ success: false, error: TOO_MANY_ATTEMPTS }, { status: 429 })
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

    // The old one-step toggle is gone: it could enable 2FA with a secret the
    // user never saw (locking them out) and disable it without any code.
    return NextResponse.json(
      { success: false, error: "Use the authenticator setup flow to change two-factor authentication" },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to update 2FA" }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  // Turning 2FA off always needs a current authenticator code (POST action "disable").
  return NextResponse.json(
    { success: false, error: "Enter your authenticator code to disable two-factor authentication" },
    { status: 400 }
  )
}
