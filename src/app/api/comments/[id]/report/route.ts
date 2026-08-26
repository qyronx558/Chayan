import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const AUTO_HIDE_THRESHOLD = 3

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Sign in to report" }, { status: 401 })
    }

    const { id } = await params
    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment || comment.status !== "APPROVED") {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: {
        reportCount: { increment: 1 },
        ...(comment.reportCount + 1 >= AUTO_HIDE_THRESHOLD
          ? { status: "PENDING_REVIEW" as const }
          : {}),
      },
    })

    return NextResponse.json({
      success: true,
      data: { reported: true, autoHidden: updated.status === "PENDING_REVIEW" },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to report comment" },
      { status: 500 }
    )
  }
}
