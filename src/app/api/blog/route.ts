import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { blogPostSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { isAdmin } from "@/lib/roles"
import { applyContentScope, scopeErrorStatus } from "@/lib/admin-content"
import { defaultModerationForRole, staffAudit } from "@/lib/moderation"
import { isListTab } from "@/lib/admin/access"
import { notifyUsers } from "@/lib/notifications"
import { sendNotificationSMS } from "@/lib/sms"
import { CANDIDATE_POOL_SIZE } from "@/lib/trending/config"
import { rankCandidateList, type AnyItem } from "@/lib/trending/rank"
import { normalizeOptionalId, findMissingRelation, missingRelationResponse, prismaRelationErrorResponse } from "@/lib/relations"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const search = searchParams.get("search") || ""
    const published = searchParams.get("published")
    const category = searchParams.get("category") || ""
    const tag = searchParams.get("tag") || ""
    const sort = searchParams.get("sort") || "latest"
    const tab = searchParams.get("tab") || ""
    const includeCounts = searchParams.get("includeCounts") === "1"
    const skip = (page - 1) * limit

    const where: Prisma.BlogPostWhereInput = {}

    const scope = searchParams.get("scope")
    const isOwnerScope = scope === "mine" || scope === "all"
    if (isOwnerScope) {
      const session = await auth()
      if (!session?.user || !isAdmin(session.user.role)) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }
      try {
        await applyContentScope(where, searchParams)
      } catch (e) {
        return NextResponse.json(
          { success: false, error: e instanceof Error ? e.message : "Forbidden" },
          { status: scopeErrorStatus(e) }
        )
      }
    } else {
      // Unpublished posts are CMS-only and must never be exposed by a public query.
      where.published = true
      where.moderation = "APPROVED"
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ]
    }

    if (tab && !isListTab(tab)) {
      return NextResponse.json({ success: false, error: "Invalid tab" }, { status: 400 })
    }

    if (isOwnerScope && published === "true") where.published = true
    if (isOwnerScope && published === "false") where.published = false

    if (category) {
      where.category = { slug: category }
    }

    if (tag) {
      where.tags = { contains: tag, mode: "insensitive" }
    }

    const baseWhere: Prisma.BlogPostWhereInput = { ...where }

    if (isOwnerScope && tab && tab !== "all") {
      if (tab === "published") where.moderation = "APPROVED"
      else if (tab === "needs") where.moderation = "PENDING"
      else if (tab === "rejected") where.moderation = "REJECTED"
      else if (tab === "draft") where.published = false
    }

    if (sort === "trending" && !isOwnerScope) {
      const [pool, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          include: { category: true, createdBy: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: CANDIDATE_POOL_SIZE,
        }),
        prisma.blogPost.count({ where }),
      ])
      const { ranked, fallback, windowDays } = await rankCandidateList("blog", pool as unknown as AnyItem[])
      return NextResponse.json({
        success: true,
        data: ranked.slice(skip, skip + limit).map((r) => r.item),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        trending: { fallback, windowDays },
      })
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: { category: true, createdBy: { select: { id: true, name: true, email: true } } },
        orderBy: sort === "popular" ? [{ views: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ])

    let counts: { all: number; published: number; needsReview: number; draft: number; rejected: number } | undefined
    if (isOwnerScope && includeCounts) {
      const [all, publishedCount, needsReview, draft, rejected] = await Promise.all([
        prisma.blogPost.count({ where: baseWhere }),
        prisma.blogPost.count({ where: { ...baseWhere, moderation: "APPROVED" } }),
        prisma.blogPost.count({ where: { ...baseWhere, moderation: "PENDING" } }),
        prisma.blogPost.count({ where: { ...baseWhere, published: false } }),
        prisma.blogPost.count({ where: { ...baseWhere, moderation: "REJECTED" } }),
      ])
      counts = { all, published: publishedCount, needsReview, draft, rejected }
    }

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      ...(counts ? { counts } : {}),
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch blog posts" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = blogPostSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }

    const { title, slug, excerpt, content, author, image, tags, categoryId: rawCategoryId, published } = validation.data

    const categoryId = normalizeOptionalId(rawCategoryId)
    if (categoryId) {
      const missing = await findMissingRelation({ blogCategoryId: categoryId })
      if (missing) return missingRelationResponse(missing)
    }

    const existing = await prisma.blogPost.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ success: false, error: "A post with this slug already exists" }, { status: 409 })
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        ...(excerpt !== undefined && excerpt !== null ? { excerpt } : {}),
        ...(content !== undefined && content !== null ? { content } : {}),
        ...(author !== undefined && author !== null ? { author } : {}),
        ...(image !== undefined && image !== null ? { image } : {}),
        ...(tags !== undefined && tags !== null ? { tags } : {}),
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
        published,
        moderation: defaultModerationForRole(session.user.role),
        ...(session.user.role === "SUPER_ADMIN"
          ? { reviewedById: session.user.id, reviewedAt: new Date() }
          : {}),
        createdBy: { connect: { id: session.user.id } },
      },
    })

    await staffAudit({
      action: "CREATE",
      entity: "Blog",
      entityId: post.id,
      user: session.user,
      note: `Created "${post.title}" moderation=${post.moderation}`,
    })

    if (post.published && post.moderation === "APPROVED") {
      await notifyUsers("BLOG", post.title, post.slug, `New blog post published: ${post.title}`)
      sendNotificationSMS("BLOG", post.title, post.slug, `New blog post published: ${post.title}`).catch(console.error)
    }

    return NextResponse.json({ success: true, data: post }, { status: 201 })
  } catch (error) {
    const friendly = prismaRelationErrorResponse(error)
    if (friendly) return friendly
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create blog post" },
      { status: 500 }
    )
  }
}
