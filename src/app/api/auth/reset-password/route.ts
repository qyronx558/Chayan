import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createHash } from "crypto"
import { clientIp, ipRules, rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit"
import { invalidateAuthState } from "@/lib/auth-state"
import { isSchemaMismatchError } from "@/lib/prisma-errors"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password || typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json({ success: false, error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 })
    }
    if (password.length > 200) {
      return NextResponse.json({ success: false, error: "Password is too long" }, { status: 400 })
    }

    const ipLimit = ipRules("reset", clientIp(request), 20, 3600)
    if (ipLimit.length > 0 && !(await rateLimit(ipLimit)).ok) {
      return NextResponse.json({ success: false, error: TOO_MANY_ATTEMPTS }, { status: 429 })
    }

    // Real reset tokens are 64 hex chars and stored hashed. Anything else (for
    // example a 6-digit phone OTP parked in the same column) is never accepted.
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset token" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { resetToken: createHash("sha256").update(token).digest("hex") },
    })

    if (!user || !user.resetTokenExpiry) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset token" }, { status: 400 })
    }

    if (new Date() > user.resetTokenExpiry) {
      return NextResponse.json({ success: false, error: "Reset token has expired. Please request a new one." }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // passwordChangedAt signs out every session that was issued before the reset.
    const updateUser = prisma.user.update as unknown as (a: unknown) => Promise<unknown>
    const base = { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
    try {
      await updateUser({ where: { id: user.id }, data: { ...base, passwordChangedAt: new Date() } })
    } catch (error) {
      if (!isSchemaMismatchError(error)) throw error
      await updateUser({ where: { id: user.id }, data: base })
    }
    invalidateAuthState(user.id)

    return NextResponse.json({ success: true, message: "Password reset successfully. You can now log in." })
  } catch {
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}
