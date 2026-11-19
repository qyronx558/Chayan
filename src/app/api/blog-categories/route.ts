import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicApiResponse } from "@/lib/cache"

export async function GET() {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
    })

    return publicApiResponse({ success: true, data: categories }, "blog")
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch blog categories" },
      { status: 500 }
    )
  }
}
