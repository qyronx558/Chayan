import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { compare, hash } from "bcryptjs"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.password) {
      return NextResponse.json(
        { success: false, error: "Your account uses Google sign-in and has no password. Use Google login instead." },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validation = changePasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }

    const { currentPassword, newPassword } = validation.data

    const valid = await compare(currentPassword, user.password)
    if (!valid) {
      return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 })
    }

    const hashed = await hash(newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to change password" },
      { status: 500 }
    )
  }
}