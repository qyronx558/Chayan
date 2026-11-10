import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { clientIp, loginRules, rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { email, password } = body as { email?: string; password?: string }
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ requires2FA: false })
    }

    // This endpoint reveals whether a password is right, so it gets the same
    // brute-force cap as the login itself.
    const limit = await rateLimit(loginRules("login-check", email, clientIp(request)))
    if (!limit.ok) {
      return NextResponse.json(
        { requires2FA: false, error: TOO_MANY_ATTEMPTS },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { password: true, twoFactorEnabled: true },
    })

    if (!user || !user.password) {
      return NextResponse.json({ requires2FA: false })
    }

    const isValid = await compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ requires2FA: false })
    }

    return NextResponse.json({ requires2FA: user.twoFactorEnabled === true })
  } catch {
    return NextResponse.json({ requires2FA: false })
  }
}
