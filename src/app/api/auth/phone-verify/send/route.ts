import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendOTPSMS, formatPhoneNumber, isValidIndianPhoneNumber } from "@/lib/sms"

const OTP_EXPIRY_MINUTES = 10

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 })
    }

    if (!isValidIndianPhoneNumber(phone)) {
      return NextResponse.json({ success: false, error: "Invalid Indian phone number format" }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(phone)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    })

    if (existing?.phone && existing.phone !== formattedPhone) {
      const otherUser = await prisma.user.findFirst({
        where: { phone: formattedPhone },
        select: { id: true },
      })
      if (otherUser) {
        return NextResponse.json({ success: false, error: "Phone number already registered with another account" }, { status: 400 })
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phone: formattedPhone,
        resetToken: otp,
        resetTokenExpiry: otpExpiry,
      },
    })

    const smsResult = await sendOTPSMS(formattedPhone, otp)
    if (!smsResult.success) {
      console.error("Failed to send OTP SMS:", smsResult.error)
      return NextResponse.json({ success: false, error: "Failed to send OTP. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `OTP sent to ${formattedPhone}` })
  } catch (error) {
    console.error("Phone OTP send error:", error)
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 })
  }
}