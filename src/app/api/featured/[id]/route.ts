import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { featuredItemSchema } from "@/lib/validations"
import { isSuperAdmin } from "@/lib/roles"
import { z } from "zod"
import { revalidatePublicContent } from "@/lib/cache"

const patchSchema = z
  .object({
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
    isPinned: z.boolean().optional(),
  })
  .strict()

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const patch = patchSchema.safeParse(body)
    if (patch.success) {
      const item = await prisma.featuredItem.update({ where: { id }, data: patch.data })
      revalidatePublicContent("featured")
      return NextResponse.json({ success: true, data: item })
    }

    const validation = featuredItemSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }

    const existing = await prisma.featuredItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Featured item not found" }, { status: 404 })
    }

    const { startDate, endDate, ...rest } = validation.data
    const item = await prisma.featuredItem.update({
      where: { id },
      data: {
        ...rest,
        startDate: startDate || null,
        endDate: endDate || null,
      },
    })
    revalidatePublicContent("featured")

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update featured item" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await prisma.featuredItem.delete({ where: { id } })
    revalidatePublicContent("featured")

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete featured item" },
      { status: 500 }
    )
  }
}
