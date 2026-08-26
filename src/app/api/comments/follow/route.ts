import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { postTypeSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Sign in to follow threads" }, { status: 401 })
    }

    const body = await request.json()
    const postType = postTypeSchema.safeParse(body.postType)
    const postId = typeof body.postId === "string" ? body.postId : ""
    if (!postType.success || !postId) {
      return NextResponse.json({ success: false, error: "Invalid thread" }, { status: 400 })
    }

    const thread = await prisma.discussionThread.upsert({
      where: { postType_postId: { postType: postType.data, postId } },
      create: { postType: postType.data, postId },
      update: {},
    })

    const existing = await prisma.commentFollow.findUnique({
      where: { threadId_userId: { threadId: thread.id, userId: session.user.id } },
    })

    if (existing) {
      await prisma.commentFollow.delete({ where: { id: existing.id } })
      return NextResponse.json({ success: true, data: { following: false } })
    }

    await prisma.commentFollow.create({
      data: { threadId: thread.id, userId: session.user.id },
    })
    return NextResponse.json({ success: true, data: { following: true } })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update follow" },
      { status: 500 }
    )
  }
}
