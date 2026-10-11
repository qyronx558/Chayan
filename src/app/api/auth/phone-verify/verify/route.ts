import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendWelcomeSMS } from "@/lib/sms"
import { createHash, timingSafeEqual } from "crypto"

const db = prisma as unknown as Record<string, {
  findUnique: (a: unknown) => Promise<Record<string, unknown> | null>
  findFirst: (a: unknown) => Promise<Record<string, unknown> | null>
  findMany: (a: unknown) => Promise<Array<Record<string, unknown>>>
  update: (a: unknown) => Promise<unknown>
  updateMany: (a: unknown) => Promise<unknown>
  deleteMany: (a: unknown) => Promise<unknown>
}>

function hashesEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex")
    const bb = Buffer.from(b, "hex")
    if (ba.length !== bb.length) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return a === b
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json()
    const { otp } = body as { otp?: string }
    if (!otp || otp.length !== 6) {
      return NextResponse.json({ success: false, error: "Enter the 6-digit code" }, { status: 400 })
    }
    const candidate = createHash("sha256").update(otp).digest("hex")
    try {
      const rows = await db.phoneVerificationCode.findMany({
        where: { userId: session.user.id, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" }, take: 3,
      })
      const match = rows.find((r) => hashesEqual(String(r["codeHash"] ?? ""), candidate))
      if (match) {
        if ((match["attempts"] as number) >= (match["maxAttempts"] as number)) {
          return NextResponse.json({ success: false, error: "Too many attempts. Request a new code." }, { status: 429 })
        }
        await db.phoneVerificationCode.deleteMany({ where: { userId: session.user.id } }).catch(() => undefined)
        await db.user.update({ where: { id: session.user.id }, data: { phoneVerifiedAt: new Date() } }).catch(() => undefined)
        try {
          await (prisma as unknown as { notificationPreference: { upsert: (a: unknown) => Promise<unknown> } }).notificationPreference.upsert({
            where: { userId: session.user.id },
            create: { userId: session.user.id, phoneVerified: true },
            update: { phoneVerified: true },
          })
        } catch { undefined }
        try {
          const { writeAuditEvent } = await import("@/lib/audit")
          await writeAuditEvent({ action: "UPDATE", entityType: "User", entityId: session.user.id, actorId: session.user.id, actorRole: session.user.role ?? "USER", summary: "Phone number verified", source: "API" })
        } catch { undefined }
        const u = await db.user.findUnique({ where: { id: session.user.id } }).catch(() => null)
        const phone = u?.["phone"] as string | undefined
        if (phone) sendWelcomeSMS(phone).catch(() => undefined)
        return NextResponse.json({ success: true, message: "Phone number verified successfully!" })
      }
      if (rows.length > 0) {
        await db.phoneVerificationCode.updateMany({ where: { userId: session.user.id }, data: {} }).catch(() => undefined)
        return NextResponse.json({ success: false, error: "Invalid OTP. Please try again." }, { status: 400 })
      }
    } catch { undefined }
    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (!user || !user["resetToken"] || !user["resetTokenExpiry"]) {
      return NextResponse.json({ success: false, error: "No OTP request found. Please request a new OTP." }, { status: 400 })
    }
    if (new Date(String(user["resetTokenExpiry"])).getTime() < Date.now()) {
      await db.user.update({ where: { id: session.user.id }, data: { resetToken: null, resetTokenExpiry: null } }).catch(() => undefined)
      return NextResponse.json({ success: false, error: "OTP has expired. Please request a new OTP." }, { status: 400 })
    }
    if (user["resetToken"] !== otp) {
      return NextResponse.json({ success: false, error: "Invalid OTP. Please try again." }, { status: 400 })
    }
    await db.user.update({ where: { id: session.user.id }, data: { resetToken: null, resetTokenExpiry: null, phoneVerifiedAt: new Date() } }).catch(() => undefined)
    try {
      await (prisma as unknown as { notificationPreference: { upsert: (a: unknown) => Promise<unknown> } }).notificationPreference.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, phoneVerified: true },
        update: { phoneVerified: true },
      })
    } catch { undefined }
    return NextResponse.json({ success: true, message: "Phone number verified successfully!" })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to verify OTP" }, { status: 500 })
  }
}
