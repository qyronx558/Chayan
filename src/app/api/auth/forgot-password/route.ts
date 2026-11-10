import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"
import { clientIp, ipRules, rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    const limit = await rateLimit([
      { key: `forgot:email:${email.trim().toLowerCase().slice(0, 200)}`, max: 3, windowSec: 3600 },
      ...ipRules("forgot", clientIp(request), 20, 3600),
    ])
    if (!limit.ok) return NextResponse.json({ success: false, error: TOO_MANY_ATTEMPTS }, { status: 429 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists, a reset email has been sent." })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiry = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      // Only a hash is stored: a database leak cannot be turned into password resets.
      data: { resetToken: crypto.createHash("sha256").update(token).digest("hex"), resetTokenExpiry: expiry },
    })

    const result = await sendPasswordResetEmail(email, token)
    if (!result.success) {
      return NextResponse.json({ success: false, error: "Failed to send email. Try again later." }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "If an account exists, a reset email has been sent." })
  } catch {
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}
