import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendOTPSMS, formatPhoneNumber, isValidIndianPhoneNumber, isDevSmsMode } from "@/lib/sms"
import { createHash, randomInt } from "crypto"
import { rateLimit } from "@/lib/rate-limit"

const db = prisma as unknown as Record<string, {
  findUnique: (a: unknown) => Promise<Record<string, unknown> | null>
  findFirst: (a: unknown) => Promise<Record<string, unknown> | null>
  findMany: (a: unknown) => Promise<Array<Record<string, unknown>>>
  update: (a: unknown) => Promise<unknown>
  create: (a: unknown) => Promise<Record<string, unknown>>
  count: (a: unknown) => Promise<number>
}>

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json()
    const { phone } = body as { phone?: string }
    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 })
    }
    if (!isValidIndianPhoneNumber(phone)) {
      return NextResponse.json({ success: false, error: "Enter a valid 10-digit mobile number" }, { status: 400 })
    }
    const formattedPhone = formatPhoneNumber(phone)
    const otherUser = await db.user.findFirst({ where: { phone: formattedPhone } }).catch(() => null)
    if (otherUser && String(otherUser["id"]) !== session.user.id) {
      return NextResponse.json({ success: false, error: "Phone number already registered with another account" }, { status: 400 })
    }
    try {
      const recent = await db.phoneVerificationCode.count({
        where: { userId: session.user.id, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
      }).catch(() => 0)
      if (recent >= 3) {
        return NextResponse.json({ success: false, error: "Too many codes requested. Try again in 10 minutes." }, { status: 429 })
      }
    } catch { undefined }
    // Works even when the code table is missing, so SMS cost cannot be run up.
    if (!(await rateLimit([{ key: `phone-send:user:${session.user.id}`, max: 5, windowSec: 600 }])).ok) {
      return NextResponse.json({ success: false, error: "Too many codes requested. Try again in 10 minutes." }, { status: 429 })
    }
    const otp = randomInt(100000, 1000000).toString()
    const codeHash = createHash("sha256").update(otp).digest("hex")
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    let storedHashed = false
    try {
      await db.phoneVerificationCode.create({
        data: { userId: session.user.id, phone: formattedPhone, codeHash, expiresAt, attempts: 0, maxAttempts: 5 },
      })
      storedHashed = true
    } catch { storedHashed = false }
    if (!storedHashed) {
      await db.user.update({
        where: { id: session.user.id },
        data: { phone: formattedPhone, resetToken: otp, resetTokenExpiry: expiresAt },
      }).catch(() => undefined)
    } else {
      await db.user.update({ where: { id: session.user.id }, data: { phone: formattedPhone } }).catch(() => undefined)
    }
    const smsResult = await sendOTPSMS(formattedPhone, otp)
    if (!smsResult.success) {
      return NextResponse.json({ success: false, error: "Failed to send OTP. Please try again." }, { status: 500 })
    }
    if (isDevSmsMode()) {
      return NextResponse.json({ success: true, message: `OTP sent to ${formattedPhone}`, devCode: otp })
    }
    return NextResponse.json({ success: true, message: `OTP sent to ${formattedPhone}` })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 })
  }
}
