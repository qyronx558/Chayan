import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { moduleDb } from "@/lib/admin/dashboard-server"
import { MODULE_CATALOG, type LibraryPayload } from "@/components/admin/dashboard/types"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: super admin only" }, { status: 403 })
    }
    const db = moduleDb()
    const counts = await Promise.all(MODULE_CATALOG.map((m) => db[m.delegate].count({})))
    const modules = MODULE_CATALOG.map((m, i) => ({
      key: m.delegate,
      label: m.label,
      count: counts[i] ?? 0,
      href: m.href,
    }))
    const logs = await prisma.log.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    })
    const data: LibraryPayload = {
      total: counts.reduce((n, c) => n + c, 0),
      modules,
      activity: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        text: (l.details ?? `${l.action} ${l.entity}`).slice(0, 140),
        actor: l.user?.name ?? l.user?.email ?? "System",
        createdAt: l.createdAt.toISOString(),
      })),
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load library" },
      { status: 500 }
    )
  }
}
