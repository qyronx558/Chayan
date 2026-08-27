import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const encoder = new TextEncoder()

function sseEvent(data: unknown, event?: string): Uint8Array {
  const lines = []
  if (event) lines.push(`event: ${event}`)
  lines.push(`data: ${JSON.stringify(data)}`)
  lines.push("")
  return encoder.encode(lines.join("\n"))
}

function createHeartbeat(): Uint8Array {
  return encoder.encode(": heartbeat\n\n")
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postType = searchParams.get("postType")
    const postId = searchParams.get("postId")

    if (!postType || !postId) {
      return NextResponse.json(
        { success: false, error: "postType and postId are required" },
        { status: 400 }
      )
    }

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(sseEvent({ type: "connected", postType, postId }, "open"))

        let lastEventId = 0
        let closed = false

        const send = (event: string, data: unknown) => {
          if (!closed) controller.enqueue(sseEvent(data, event))
        }

        const heartbeatInterval = setInterval(() => {
          if (!closed) controller.enqueue(createHeartbeat())
        }, 15000)

        const checkUpdates = async () => {
          if (closed) return
          try {
            const thread = await prisma.discussionThread.findUnique({
              where: { postType_postId: { postType: postType as never, postId } },
              select: { updatedAt: true, commentCount: true },
            })
            if (thread && thread.updatedAt.getTime() > lastEventId) {
              lastEventId = thread.updatedAt.getTime()
              send("thread-update", { commentCount: thread.commentCount, updatedAt: thread.updatedAt.toISOString() })
            }
          } catch {
            // ignore
          }
        }

        const pollInterval = setInterval(checkUpdates, 3000)

        request.signal.addEventListener("abort", () => {
          closed = true
          clearInterval(heartbeatInterval)
          clearInterval(pollInterval)
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Stream failed" },
      { status: 500 }
    )
  }
}