import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/roles"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || !isAdmin(session.user.role)) return null
  return session
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const postType = searchParams.get("postType")
    const postId = searchParams.get("postId")

    const flagged = await prisma.comment.findMany({
      where: {
        status: "PENDING_REVIEW",
        ...(postType && postId ? { postType: postType as never, postId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, name: true, image: true, helpfulCount: true } } },
    })

    return NextResponse.json({ success: true, data: flagged })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load flagged comments" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const action = body.action as string

    switch (action) {
      case "pin": {
        await prisma.comment.updateMany({
          where: { postType: body.postType, postId: body.postId, isPinned: true },
          data: { isPinned: false, isOfficial: false },
        })
        await prisma.comment.update({
          where: { id: body.commentId },
          data: { isPinned: true, isOfficial: true },
        })
        return NextResponse.json({ success: true })
      }
      case "unpin": {
        await prisma.comment.update({ where: { id: body.commentId }, data: { isPinned: false, isOfficial: false } })
        return NextResponse.json({ success: true })
      }
      case "lock":
      case "unlock": {
        await prisma.discussionThread.upsert({
          where: { postType_postId: { postType: body.postType, postId: body.postId } },
          create: { postType: body.postType, postId: body.postId, locked: action === "lock" },
          update: { locked: action === "lock" },
        })
        return NextResponse.json({ success: true, data: { locked: action === "lock" } })
      }
      case "approve": {
        await prisma.comment.updateMany({
          where: { id: { in: body.commentIds }, status: "PENDING_REVIEW" },
          data: { status: "APPROVED", flaggedReasons: [], reportCount: 0 },
        })
        return NextResponse.json({ success: true })
      }
      case "bulkDelete": {
        const comments = await prisma.comment.findMany({
          where: { id: { in: body.commentIds }, status: "PENDING_REVIEW" },
        })
        await prisma.$transaction([
          prisma.comment.deleteMany({ where: { id: { in: comments.map((c) => c.id) } } }),
          ...comments
            .filter((c) => !c.parentId)
            .map((c) =>
              prisma.discussionThread.updateMany({
                where: { postType: c.postType, postId: c.postId },
                data: { commentCount: { decrement: 1 } },
              })
            ),
          ...comments
            .filter((c) => c.parentId)
            .map((c) =>
              prisma.comment.update({
                where: { id: c.parentId! },
                data: { replyCount: { decrement: 1 } },
              })
            ),
        ])
        return NextResponse.json({ success: true, data: { deleted: comments.length } })
      }
      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Admin action failed" },
      { status: 500 }
    )
  }
}
