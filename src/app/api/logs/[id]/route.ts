import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** DELETE /api/logs/:id - single audit entry (SUPER_ADMIN only). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: super admin only" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.log.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Log not found" }, { status: 404 })
    }

    await prisma.log.delete({ where: { id } })
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete log" },
      { status: 500 }
    )
  }
}
