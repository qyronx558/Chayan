import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MIGRATION_REQUIRED_MESSAGE, isSchemaMismatchError } from "@/lib/prisma-errors"
import { randomBytes, createHmac } from "crypto"

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

function base32Encode(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let bits = ""
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0")
  }
  let result = ""
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0")
    result += alphabet[parseInt(chunk, 2)]
  }
  return result
}

function base32Decode(encoded: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let bits = ""
  for (const char of encoded.toUpperCase().replace(/=+$/, "")) {
    const idx = alphabet.indexOf(char)
    if (idx === -1) continue
    bits += idx.toString(2).padStart(5, "0")
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

function generateTOTP(secret: string, timeStep = 30, digits = 6): string {
  const time = Math.floor(Date.now() / 1000 / timeStep)
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(0, 0)
  buf.writeUInt32BE(time, 4)
  const key = base32Decode(secret)
  const hmac = createHmac("sha1", key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff)
  return String(code % 10 ** digits).padStart(digits, "0")
}

function verifyTOTP(secret: string, token: string, window = 1): boolean {
  const timeStep = 30
  const now = Math.floor(Date.now() / 1000 / timeStep)
  for (let i = -window; i <= window; i++) {
    const time = now + i
    const buf = Buffer.alloc(8)
    buf.writeUInt32BE(0, 0)
    buf.writeUInt32BE(time, 4)
    const key = base32Decode(secret)
    const hmac = createHmac("sha1", key).update(buf).digest()
    const offset = hmac[hmac.length - 1] & 0x0f
    const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff)
    const otp = String(code % 10 ** 6).padStart(6, "0")
    if (otp === token) return true
  }
  return false
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

      if (!verifyTOTP(secret, token)) {
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
      if (!secret || !verifyTOTP(secret, token)) {
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
