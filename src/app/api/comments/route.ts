import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/roles"
import {
  discussionCommentSchema,
} from "@/lib/validations"
import {
  EDIT_WINDOW_MS,
  checkRateLimit,
  recordCommentPosted,
  moderateContent,
  verifyCaptcha,
} from "@/lib/discussion"

const PAGE_SIZE = 10
const REPLIES_PREVIEW = 2

type SortKey = "top" | "newest" | "controversial"

function decodeCursor(cursor: string | null): number {
  if (!cursor) return 0
  return Number(Buffer.from(cursor, "base64url").toString("utf8")) || 0
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset)).toString("base64url")
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postType = searchParams.get("postType")
    const postId = searchParams.get("postId")
    const parentId = searchParams.get("parentId")
    const sort = (searchParams.get("sort") || "newest") as SortKey
    const filter = searchParams.get("filter") || "all"
    const q = searchParams.get("q")?.trim()
    const cursor = searchParams.get("cursor")

    if (!postType || !postId) {
      return NextResponse.json(
        { success: false, error: "postType and postId are required" },
        { status: 400 }
      )
    }

    const session = await auth()
    const admin = isAdmin(session?.user?.role)

    // Replies listing for a specific parent
    if (parentId) {
      const replies = await prisma.comment.findMany({
        where: { parentId, status: "APPROVED", ...(admin ? {} : {}) },
        orderBy: [{ isBestAnswer: "desc" }, { createdAt: "asc" }],
        include: {
          user: { select: { id: true, name: true, image: true, helpfulCount: true } },
          upvotes: session?.user?.id
            ? { where: { userId: session.user.id }, select: { id: true } }
            : false,
        },
      })
      return NextResponse.json({
        success: true,
        data: {
          comments: replies.map((r) => serialize(r, session?.user?.id)),
          nextCursor: null,
        },
      })
    }

    const thread = await prisma.discussionThread.findUnique({
      where: { postType_postId: { postType: postType as never, postId } },
    })
    const pinnedComment = await prisma.comment.findFirst({
      where: { postType: postType as never, postId, isPinned: true },
      include: { user: { select: { id: true, name: true, image: true, helpfulCount: true } } },
    })

    let following = false
    if (session?.user?.id && thread) {
      const f = await prisma.commentFollow.findUnique({
        where: { threadId_userId: { threadId: thread.id, userId: session.user.id } },
      })
      following = Boolean(f)
    }

    const baseWhere = {
      postType: postType as never,
      postId,
      parentId: null,
      status: "APPROVED" as const,
      ...(filter === "questions" ? { kind: "QUESTION" as const } : {}),
      ...(filter === "announcements" ? { isOfficial: true } : {}),
      ...(filter === "answers" ? { OR: [{ kind: "ANSWER" as const }, { isBestAnswer: true }] } : {}),
      ...(q ? { content: { contains: q, mode: "insensitive" as const } } : {}),
    }

    // Ranked id list (controversial needs a computed score), sliced in memory for cursor paging.
    let orderedIds: string[]
    if (sort === "controversial") {
      const rows = await prisma.comment.findMany({
        where: baseWhere,
        select: { id: true, upvoteCount: true, replyCount: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      })
      orderedIds = rows
        .sort(
          (a, b) =>
            b.replyCount * Math.max(b.upvoteCount, 1) - a.replyCount * Math.max(a.upvoteCount, 1)
        )
        .map((r) => r.id)
    } else {
      const rows = await prisma.comment.findMany({
        where: baseWhere,
        select: { id: true },
        orderBy: [
          ...(sort === "top" ? ([{ upvoteCount: "desc" }] as const) : []),
          { createdAt: "desc" },
        ],
        take: 1000,
      })
      orderedIds = rows.map((r) => r.id)
    }

    const offset = decodeCursor(cursor)
    const pageIds = orderedIds.slice(offset, offset + PAGE_SIZE)
    const hasNext = offset + PAGE_SIZE < orderedIds.length

    const comments = await prisma.comment.findMany({
      where: { id: { in: pageIds } },
      include: {
        user: { select: { id: true, name: true, image: true, helpfulCount: true } },
        upvotes: session?.user?.id
          ? { where: { userId: session.user.id }, select: { id: true } }
          : false,
      },
    })

    const byId = new Map(comments.map((c) => [c.id, c]))
    const ordered = pageIds.map((id) => byId.get(id)!).filter(Boolean)

    // Preview replies (best answer floats to top of its thread)
    const previewReplies =
      ordered.length > 0
        ? await prisma.comment.findMany({
            where: {
              parentId: { in: ordered.map((c) => c.id) },
              status: "APPROVED",
              ...(filter === "answers" ? { OR: [{ kind: "ANSWER" as const }, { isBestAnswer: true }] } : {}),
            },
            orderBy: [{ isBestAnswer: "desc" }, { createdAt: "asc" }],
            include: {
              user: { select: { id: true, name: true, image: true, helpfulCount: true } },
              upvotes: session?.user?.id
                ? { where: { userId: session.user.id }, select: { id: true } }
                : false,
            },
          })
        : []

    const repliesByParent = new Map<string, ReturnType<typeof serialize>[]>()
    const hiddenByParent = new Map<string, number>()
    for (const r of previewReplies) {
      if (!r.parentId) continue
      hiddenByParent.set(r.parentId, (hiddenByParent.get(r.parentId) || 0) + 1)
      const list = repliesByParent.get(r.parentId) || []
      if ((list.length < REPLIES_PREVIEW && !r.isBestAnswer) || r.isBestAnswer) {
        list.push(serialize(r, session?.user?.id))
        repliesByParent.set(r.parentId, list)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        comments: ordered.map((c) => ({
          ...serialize(c, session?.user?.id),
          replies: repliesByParent.get(c.id) || [],
          visibleReplyCount: repliesByParent.get(c.id)?.length || 0,
        })),
        nextCursor: hasNext ? encodeCursor(offset + PAGE_SIZE) : null,
        meta: {
          total: thread?.commentCount ?? 0,
          locked: thread?.locked ?? false,
          following,
          isAdmin: admin,
          pinnedComment: pinnedComment ? serialize(pinnedComment, session?.user?.id) : null,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load discussion",
      },
      { status: 500 }
    )
  }
}

function serialize(c: any, userId?: string) {
  const own = Boolean(userId && c.userId === userId)
  return {
    id: c.id,
    content: c.content,
    imageUrl: c.imageUrl,
    kind: c.kind,
    status: c.status,
    isPinned: c.isPinned,
    isOfficial: c.isOfficial,
    isBestAnswer: c.isBestAnswer,
    upvoteCount: c.upvoteCount,
    replyCount: c.replyCount,
    editedAt: c.editedAt,
    createdAt: c.createdAt,
    flaggedReasons: c.flaggedReasons,
    parentId: c.parentId ?? null,
    user: {
      id: c.user.id,
      name: c.user.name || "Anonymous",
      image: c.user.image,
      helpfulCount: c.user.helpfulCount,
    },
    hasUpvoted: Array.isArray(c.upvotes) ? c.upvotes.length > 0 : false,
    isOwn: own,
    canEdit:
      own &&
      !c.editedAt &&
      Date.now() - new Date(c.createdAt).getTime() <= EDIT_WINDOW_MS,
    replies: [],
    visibleReplyCount: 0,
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Please sign in to join the discussion" }, { status: 401 })
    }
    const userId = session.user.id
    const admin = isAdmin(session.user.role)

    const body = await request.json()
    const parsed = discussionCommentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }
    const { content, postType, postId, parentId, kind, imageUrl, captchaToken, captchaAnswer, path } =
      parsed.data

    const rate = checkRateLimit(userId)
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: `Please wait ${rate.retryAfterSeconds}s before commenting again`, code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      )
    }
    if (rate.requiresCaptcha) {
      if (!captchaToken || !captchaAnswer || !verifyCaptcha(captchaToken, captchaAnswer)) {
        return NextResponse.json(
          { success: false, error: "CAPTCHA verification failed", code: "CAPTCHA_REQUIRED" },
          { status: 403 }
        )
      }
    }

    const thread = await prisma.discussionThread.upsert({
      where: { postType_postId: { postType, postId } },
      create: { postType, postId },
      update: {},
    })
    if (thread.locked && !admin) {
      return NextResponse.json(
        { success: false, error: "This discussion has been locked by moderators", code: "LOCKED" },
        { status: 403 }
      )
    }

    const flags = moderateContent(content)
    const status = flags.length > 0 && !admin ? ("PENDING_REVIEW" as const) : ("APPROVED" as const)

    let parentAuthorId: string | null = null
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } })
      if (!parent || parent.postId !== postId || parent.postType !== postType || parent.parentId) {
        return NextResponse.json({ success: false, error: "Invalid parent comment" }, { status: 400 })
      }
      parentAuthorId = parent.userId
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        imageUrl: imageUrl || null,
        userId,
        postType,
        postId,
        parentId: parentId || null,
        kind: parentId ? "ANSWER" : kind,
        status,
        flaggedReasons: flags,
      },
      include: { user: { select: { id: true, name: true, image: true, helpfulCount: true } } },
    })

    await Promise.all([
      prisma.discussionThread.update({
        where: { id: thread.id },
        data: { commentCount: { increment: 1 } },
      }),
      parentId
        ? prisma.comment.update({
            where: { id: parentId },
            data: { replyCount: { increment: 1 } },
          })
        : Promise.resolve(null),
    ])
    recordCommentPosted(userId)

    // Notifications: reply to parent author, @mentions among thread participants, thread followers
    const notifiedUserIds = new Set<string>()
    const title = parentAuthorId
      ? `${session.user.name || "Someone"} replied to your comment`
      : `${session.user.name || "Someone"} commented on a post you follow`

    const targets: string[] = []
    if (parentAuthorId && parentAuthorId !== userId) targets.push(parentAuthorId)

    const mentionNames = [...content.matchAll(/@([\w\s.-]{2,40})@?(?=\s|$)/g)].map((m) =>
      m[1].trim().toLowerCase()
    )
    if (mentionNames.length > 0) {
      const participants = await prisma.comment.findMany({
        where: { postType, postId, userId: { not: userId } },
        select: { user: { select: { id: true, name: true } } },
        distinct: ["userId"],
      })
      for (const p of participants) {
        const name = (p.user.name || "").toLowerCase()
        if (name && mentionNames.some((mn) => mn === name || name.includes(mn))) {
          if (p.user.id !== userId) {
            targets.push(p.user.id)
            notifiedUserIds.add(p.user.id)
          }
        }
      }
    }

    if (targets.length > 0) {
      await prisma.userNotification.createMany({
        data: targets.map((uid) => ({
          userId: uid,
          type: "GENERAL",
          title,
          message: content.slice(0, 140),
          slug: path || "/",
        })),
      })
    }

    if (thread && !parentAuthorId) {
      const followers = await prisma.commentFollow.findMany({
        where: { threadId: thread.id, userId: { not: userId } },
        select: { userId: true },
      })
      const followerIds = followers.map((f) => f.userId).filter((uid) => !notifiedUserIds.has(uid))
      if (followerIds.length > 0) {
        await prisma.userNotification.createMany({
          data: followerIds.map((uid) => ({
            userId: uid,
            type: "GENERAL",
            title,
            message: content.slice(0, 140),
            slug: path || "/",
          })),
        })
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...serialize(comment, userId),
          replies: [],
          visibleReplyCount: 0,
          pendingReview: status === "PENDING_REVIEW",
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to post comment",
      },
      { status: 500 }
    )
  }
}
