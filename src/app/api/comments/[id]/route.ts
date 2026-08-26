import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/roles"
import { canEdit, moderateContent } from "@/lib/discussion"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment || comment.status === "DELETED") {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    const admin = isAdmin(session.user.role)
    if (comment.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "You can only edit your own comments" }, { status: 403 })
    }
    if (!canEdit(comment.createdAt, comment.editedAt, session.user.role)) {
      return NextResponse.json(
        { success: false, error: "The 15-minute edit window has expired" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const content = typeof body.content === "string" ? body.content.trim() : ""
    if (!content) {
      return NextResponse.json({ success: false, error: "Comment cannot be empty" }, { status: 400 })
    }

    const flags = moderateContent(content)
    const updated = await prisma.comment.update({
      where: { id },
      data: {
        content,
        editedAt: new Date(),
        flaggedReasons: flags,
        ...(flags.length > 0 && !admin ? { status: "PENDING_REVIEW" as const } : {}),
      },
      include: { user: { select: { id: true, name: true, image: true, helpfulCount: true } } },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to edit comment" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment || comment.status === "DELETED") {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    const admin = isAdmin(session.user.role)
    if (comment.userId !== session.user.id && !admin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    // Soft delete keeps reply threads and denormalized counters consistent
    await prisma.$transaction([
      prisma.comment.update({
        where: { id },
        data: { status: "DELETED", isPinned: false, isBestAnswer: false, content: "[removed]" },
      }),
      prisma.discussionThread.updateMany({
        where: { postType: comment.postType, postId: comment.postId },
        data: { commentCount: { decrement: 1 } },
      }),
      ...(comment.parentId
        ? [
            prisma.comment.update({
              where: { id: comment.parentId },
              data: { replyCount: { decrement: 1 } },
            }),
          ]
        : []),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete comment" },
      { status: 500 }
    )
  }
}
