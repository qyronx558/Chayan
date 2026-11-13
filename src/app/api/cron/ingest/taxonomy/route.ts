import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSecret } from "@/lib/ingest/auth"

export const dynamic = "force-dynamic"

/** GET → existing category + department names, so the extractor reuses them instead of inventing near-duplicates. */
export async function GET(request: NextRequest) {
  const denied = requireSecret(request)
  if (denied) return denied
  const [categories, departments] = await Promise.all([
    prisma.category.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.department.findMany({ select: { name: true }, orderBy: { name: "asc" }, take: 2000 }),
  ])
  return NextResponse.json({
    success: true,
    categories: categories.map((c) => c.name),
    departments: departments.map((d) => d.name),
  })
}
