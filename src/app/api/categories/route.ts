import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CACHE_TAGS, publicApiResponse, revalidateTags } from "@/lib/cache"
import { categorySchema } from "@/lib/validations"
import { isAdmin } from "@/lib/roles"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { job: true } } },
    })

    return publicApiResponse({ success: true, data: categories }, "gov")
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch categories" },
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
    const validation = categorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({ data: validation.data })

    revalidateTags([CACHE_TAGS.taxonomy])
    return NextResponse.json({ success: true, data: category }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create category" },
      { status: 500 }
    )
  }
}
