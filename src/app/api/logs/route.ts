import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { isAdmin } from "@/lib/roles"

/**
 * Activity Logs — the audit trail behind the super-admin panel.
 * - GET    ?page&limit&action&entity&search&from&to  (ADMIN and SUPER_ADMIN)
 * - DELETE ?before=ISO  retention purge, no param = clear all (SUPER_ADMIN only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const action = searchParams.get("action") || ""
    const entity = searchParams.get("entity") || ""
    const search = searchParams.get("search") || ""
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""
    const skip = (page - 1) * limit

    const where: Prisma.LogWhereInput = {}
    if (action) where.action = action
    if (entity) where.entity = entity
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search } },
        { details: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ]
    }
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    }

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.log.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch logs" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: super admin only" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const before = searchParams.get("before") || ""

    const result = before
      ? await prisma.log.deleteMany({ where: { createdAt: { lt: new Date(before) } } })
      : await prisma.log.deleteMany()

    await prisma.log.create({
      data: {
        action: "DELETE",
        entity: "Log",
        entityId: "retention",
        userId: session.user.id,
        details: before
          ? `Purged ${result.count} logs older than ${before} by ${session.user.email}`
          : `Cleared all logs (${result.count} entries) by ${session.user.email}`,
      },
    }).catch(() => {
      // Never fail the purge because the audit write failed.
    })

    return NextResponse.json({ success: true, data: { deleted: result.count } })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete logs" },
      { status: 500 }
    )
  }
}
