import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isSchemaMismatchError } from "@/lib/prisma-errors"
import { z } from "zod"
import { compare, hash } from "bcryptjs"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
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
    const updatePassword = prisma.user.update as unknown as (a: unknown) => Promise<unknown>
    try {
      await updatePassword({
        where: { id: user.id },
        data: { password: hashed, passwordChangedAt: new Date() },
      })
    } catch (error) {
      if (!isSchemaMismatchError(error)) throw error
      await updatePassword({
        where: { id: user.id },
        data: { password: hashed },
      })
    }
    try {
      const client = prisma as unknown as {
        session: { deleteMany: (a: unknown) => Promise<unknown> }
        userSession: { deleteMany: (a: unknown) => Promise<unknown> }
      }
      await client.session.deleteMany({ where: { userId: user.id } }).catch(() => undefined)
      await client.userSession.deleteMany({ where: { userId: user.id } }).catch(() => undefined)
    } catch { undefined }
    try {
      const { writeAuditEvent } = await import("@/lib/audit")
      await writeAuditEvent({
        action: "UPDATE", entityType: "User", entityId: user.id,
        actorId: user.id, actorRole: session.user.role ?? "USER",
        summary: "Password changed, other sessions signed out", source: "API",
      })
    } catch { undefined }
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to change password" },
      { status: 500 }
    )
  }
}
