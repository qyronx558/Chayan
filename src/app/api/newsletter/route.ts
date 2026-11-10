import { NextRequest, NextResponse } from "next/server"
import { sendNewsletterWelcome } from "@/lib/email"
import { prisma } from "@/lib/prisma"
import { clientIp, ipRules, rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 })
    }

    if (email.length > 254) {
      return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 })
    }
    const ipLimit = ipRules("newsletter", clientIp(request), 10, 3600)
    if (ipLimit.length > 0 && !(await rateLimit(ipLimit)).ok) {
      return NextResponse.json({ success: false, error: TOO_MANY_ATTEMPTS }, { status: 429 })
    }

    const existing = await prisma.newsletter.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: true, message: "You're already subscribed!" })
    }

    await prisma.newsletter.create({ data: { email } })

    await sendNewsletterWelcome(email)

    return NextResponse.json({ success: true, message: "Subscribed successfully!" })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Subscription failed" },
      { status: 500 }
    )
  }
}
