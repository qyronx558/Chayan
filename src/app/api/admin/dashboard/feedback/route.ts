import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { moduleDb } from "@/lib/admin/dashboard-server"
import { MODULE_CATALOG, type FeedbackItem } from "@/components/admin/dashboard/types"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: admin only" }, { status: 403 })
    }
    const db = moduleDb()
    const nested = await Promise.all(
      MODULE_CATALOG.map(async (m) => {
        const rows = await db[m.delegate].findMany({
          where: { createdById: session.user.id, moderation: "REJECTED" },
          select: { id: true, title: true, reviewNote: true, reviewedAt: true, createdAt: true },
          orderBy: { reviewedAt: "desc" },
          take: 4,
        })
        return rows
          .filter((r) => r.reviewNote !== null && r.reviewNote !== undefined && r.reviewNote !== "")
          .map((r) => ({
            id: r.id ?? "",
            title: r.title ?? "",
            reason: (r.reviewNote ?? "").slice(0, 280),
            at: new Date((r.reviewedAt ?? r.createdAt) as Date).toISOString(),
            module: m.label,
            href: `${m.href}?tab=rejected`,
          }))
      })
    )
    const items: FeedbackItem[] = nested
      .flat()
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 8)
      .map((r) => ({
        id: r.id,
        module: r.module,
        title: r.title,
        reason: r.reason,
        createdAt: r.at,
        href: r.href,
      }))
    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load feedback" },
      { status: 500 }
    )
  }
}
