import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { profileSchema, roleUpdateSchema } from "@/lib/validations"
import { writeAuditLog } from "@/lib/moderation"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookmark: true,
            comments: true,
            jobs: true,
            privateJobs: true,
            results: true,
            admitCards: true,
            answerKeys: true,
            admissions: true,
            syllabi: true,
            blogPosts: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch user" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    if (existing.role === "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Super admin cannot be modified" }, { status: 403 })
    }
    if (id === session.user.id) {
      return NextResponse.json({ success: false, error: "You cannot change your own role" }, { status: 403 })
    }

    const body = await request.json()

    // Single-button promote/demote path: { role: "ADMIN" | "USER" }
    const roleValidation = roleUpdateSchema.safeParse(body)
    if (roleValidation.success) {
      const prevRole = existing.role
      const nextRole = roleValidation.data.role
      if (prevRole === nextRole) {
        return NextResponse.json({ success: false, error: `User is already ${nextRole}` }, { status: 400 })
      }
      const [user] = await prisma.$transaction([
        prisma.user.update({
          where: { id },
          data: { role: nextRole },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.log.create({
          data: {
            action: "ROLE_CHANGE",
            entity: "User",
            entityId: id,
            userId: session.user.id,
            details: `${prevRole} -> ${nextRole} | user=${existing.email} (${id}) by super_admin=${session.user.email} (${session.user.id})`,
          },
        }),
      ])
      return NextResponse.json({ success: true, data: user })
    }

    // Profile edit path (kept for compatibility)
    const validation = profileSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    const { name, image, phone } = validation.data

    if (name !== undefined && name !== null) updateData.name = name
    if (image !== undefined && image !== null) updateData.image = image
    if (phone !== undefined && phone !== null) updateData.phone = phone

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update. Send { role: \"ADMIN\" | \"USER\" } to change role." }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await writeAuditLog({
      action: "UPDATE",
      entity: "User",
      entityId: id,
      userId: session.user.id,
      details: `Profile updated for ${existing.email} (${id})`,
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    if (existing.role === "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Super admin cannot be deleted" }, { status: 403 })
    }

    await prisma.$transaction([
      prisma.user.delete({ where: { id } }),
      prisma.log.create({
        data: {
          action: "DELETE",
          entity: "User",
          entityId: id,
          userId: session.user.id,
          details: `Deleted user ${existing.email} (${id}, role=${existing.role}) by super_admin=${session.user.email}`,
        },
      }),
    ])
    return NextResponse.json({ success: true, message: "User deleted" })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete user" },
      { status: 500 }
    )
  }
}
