import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { blogPostSchema } from "@/lib/validations"
import { isAdmin } from "@/lib/roles"
import { revalidatePublicContent } from "@/lib/cache"
import { Prisma } from "@prisma/client"
import { staffAudit } from "@/lib/moderation"
import { requireAction } from "@/lib/admin/access"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth()
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()
    const validation = blogPostSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }

    const { title, slug: postSlug, excerpt, content, author, image, tags, categoryId, published } = validation.data

    const existing = await prisma.blogPost.findUnique({ where: { id: slug } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Blog post not found" }, { status: 404 })
    }
    if (session.user.role === "ADMIN" && existing.createdById !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const slugPost = await prisma.blogPost.findFirst({
      where: { slug: postSlug, id: { not: slug } },
    })
    if (slugPost) {
      return NextResponse.json({ success: false, error: "A post with this slug already exists" }, { status: 409 })
    }

    const data: Prisma.BlogPostUpdateInput = {
      title,
      slug: postSlug,
      ...(excerpt !== undefined && excerpt !== null ? { excerpt } : {}),
      ...(content !== undefined && content !== null ? { content } : {}),
      ...(author !== undefined && author !== null ? { author } : {}),
      ...(image !== undefined && image !== null ? { image } : {}),
      ...(tags !== undefined && tags !== null ? { tags } : {}),
      ...(categoryId !== undefined && categoryId !== null ? { categoryId } : {}),
      published,
    }

    if (session.user.role === "ADMIN") {
      data.moderation = "PENDING"
      data.reviewedById = null
      data.reviewedAt = null
      data.reviewNote = null
    }

    const post = await prisma.blogPost.update({
      where: { id: slug },
      data,
    })

    await staffAudit({
      action: "UPDATE",
      entity: "Blog",
      entityId: post.id,
      user: session.user,
      note: `Updated "${post.title}"`,
    })
    revalidatePublicContent("blog", existing.slug)
    if (post.slug !== existing.slug) revalidatePublicContent("blog", post.slug)

    return NextResponse.json({ success: true, data: post })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update blog post" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth()
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    try {
      requireAction(session.user.role, "Blog", "delete")
    } catch {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { slug } = await params
    const existing = await prisma.blogPost.findUnique({ where: { id: slug } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Blog post not found" }, { status: 404 })
    }

    await prisma.blogPost.delete({ where: { id: slug } })
    await staffAudit({
      action: "DELETE",
      entity: "Blog",
      entityId: slug,
      user: session.user,
      note: `Deleted "${existing.title}"`,
    })
    revalidatePublicContent("blog", existing.slug)
    return NextResponse.json({ success: true, message: "Blog post deleted" })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete blog post" },
      { status: 500 }
    )
  }
}
