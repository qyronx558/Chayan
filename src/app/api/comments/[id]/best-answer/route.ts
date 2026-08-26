import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/roles"

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const reply = await prisma.comment.findUnique({ where: { id } })
    if (!reply || reply.status !== "APPROVED") {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }
    if (!reply.parentId) {
      return NextResponse.json(
        { success: false, error: "Only replies can be marked as best answer" },
        { status: 400 }
      )
    }

    const parent = await prisma.comment.findUnique({ where: { id: reply.parentId } })
    if (!parent) {
      return NextResponse.json({ success: false, error: "Parent comment not found" }, { status: 404 })
    }

    const admin = isAdmin(session.user.role)
    const isParentAuthor = parent.userId === session.user.id
    if (!isParentAuthor && !admin) {
      return NextResponse.json(
        { success: false, error: "Only the original commenter or a moderator can mark a best answer" },
        { status: 403 }
      )
    }

    // Only one best answer per thread; toggle off if already marked
    await prisma.comment.updateMany({
      where: { parentId: parent.id, isBestAnswer: true },
      data: { isBestAnswer: false },
    })

    if (!reply.isBestAnswer) {
      await prisma.comment.update({ where: { id }, data: { isBestAnswer: true } })
    }

    return NextResponse.json({ success: true, data: { isBestAnswer: !reply.isBestAnswer } })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to mark best answer" },
      { status: 500 }
    )
  }
}
