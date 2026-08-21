import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendWelcomeSMS } from "@/lib/sms"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { otp } = body

    if (!otp || otp.length !== 6) {
      return NextResponse.json({ success: false, error: "Valid 6-digit OTP is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { resetToken: true, resetTokenExpiry: true, phone: true, notificationPreference: { select: { phoneVerified: true } } },
    })

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return NextResponse.json({ success: false, error: "No OTP request found. Please request a new OTP." }, { status: 400 })
    }

    if (new Date() > user.resetTokenExpiry) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { resetToken: null, resetTokenExpiry: null },
      })
      return NextResponse.json({ success: false, error: "OTP has expired. Please request a new OTP." }, { status: 400 })
    }

    if (user.resetToken !== otp) {
      return NextResponse.json({ success: false, error: "Invalid OTP. Please try again." }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        phoneVerified: true,
      },
      update: {
        phoneVerified: true,
      },
    })

    if (user.phone && !user.notificationPreference?.phoneVerified) {
      sendWelcomeSMS(user.phone).catch(console.error)
    }

    return NextResponse.json({ success: true, message: "Phone number verified successfully!" })
  } catch (error) {
    console.error("Phone OTP verify error:", error)
    return NextResponse.json({ success: false, error: "Failed to verify OTP" }, { status: 500 })
  }
}