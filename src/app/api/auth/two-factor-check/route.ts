import { NextRequest, NextResponse } from "next/server"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { email, password } = body as { email?: string; password?: string }
    if (!email || !password) {
      return NextResponse.json({ requires2FA: false })
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
