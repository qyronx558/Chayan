import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notificationSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { isAdmin } from "@/lib/roles"
import { notifyUsers, existingNotificationHrefs } from "@/lib/notifications"
import { sendNotificationSMS } from "@/lib/sms"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const categoryId = searchParams.get("categoryId") || ""
    const type = searchParams.get("type") || ""
    const trending = searchParams.get("trending") || ""
    const skip = (page - 1) * limit

    const where: Prisma.NotificationWhereInput = {}

    if (categoryId) where.categoryId = categoryId
    if (type) where.type = type
    if (trending === "true") where.isTrending = true

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ])

    const hrefs = await existingNotificationHrefs(notifications)
    const data = notifications.map((n) => ({ ...n, href: hrefs.get(n.slug) || null }))

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validation = notificationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, slug, content, categoryId, type, officialUrl, isTrending } = validation.data

    const data: Prisma.NotificationCreateInput = {
      title,
      slug,
      ...(content !== undefined && content !== null ? { content } : {}),
      category: { connect: { id: categoryId } },
      ...(type !== undefined && type !== null ? { type } : {}),
      ...(officialUrl !== undefined && officialUrl !== null ? { officialUrl } : {}),
      isTrending: isTrending || false,
    }

    const notification = await prisma.notification.create({ data })

    await notifyUsers("GENERAL", notification.title, notification.slug, notification.content || undefined)
    sendNotificationSMS("GENERAL", notification.title, notification.slug, notification.content || undefined).catch(console.error)

    return NextResponse.json({ success: true, data: notification }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create notification" },
      { status: 500 }
    )
  }
}
