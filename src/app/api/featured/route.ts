import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { featuredItemSchema } from "@/lib/validations"
import { isSuperAdmin } from "@/lib/roles"
import { publicApiResponse, revalidatePublicContent } from "@/lib/cache"

export async function GET() {
  try {
    const now = new Date()
    const items = await prisma.featuredItem.findMany({
      where: {
        AND: [
          { isActive: true },
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: [{ isPinned: "desc" }, { sortOrder: "asc" }],
    })
    return publicApiResponse({ success: true, data: items }, "gov")
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch featured items" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = featuredItemSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }

    const highest = await prisma.featuredItem.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    })
    const { startDate, endDate, ...rest } = validation.data
    const item = await prisma.featuredItem.create({
      data: {
        ...rest,
        sortOrder: (highest?.sortOrder ?? -1) + 1,
        startDate: startDate || null,
        endDate: endDate || null,
      },
    })
    revalidatePublicContent("featured")

    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create featured item" },
      { status: 500 }
    )
  }
}
