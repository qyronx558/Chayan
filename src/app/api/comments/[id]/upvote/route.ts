import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Sign in to upvote" }, { status: 401 })
    }
    const userId = session.user.id
    const { id } = await params

    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment || comment.status !== "APPROVED") {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    const existing = await prisma.commentUpvote.findUnique({
      where: { commentId_userId: { commentId: id, userId } },
    })

    if (existing) {
      await prisma.$transaction([
        prisma.commentUpvote.delete({ where: { id: existing.id } }),
        prisma.comment.update({ where: { id }, data: { upvoteCount: { decrement: 1 } } }),
        prisma.user.update({
          where: { id: comment.userId },
          data: { helpfulCount: { decrement: 1 } },
        }),
      ])
      return NextResponse.json({ success: true, data: { hasUpvoted: false } })
    }

    await prisma.$transaction([
      prisma.commentUpvote.create({ data: { commentId: id, userId } }),
      prisma.comment.update({ where: { id }, data: { upvoteCount: { increment: 1 } } }),
      prisma.user.update({
        where: { id: comment.userId },
        data: { helpfulCount: { increment: 1 } },
      }),
    ])

    return NextResponse.json({ success: true, data: { hasUpvoted: true } })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to upvote" },
      { status: 500 }
    )
  }
}
