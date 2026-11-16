import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/location-api"
import { writeAuditLog } from "@/lib/moderation"
import { revalidatePublicContent } from "@/lib/cache"
import { syncFeed } from "@/lib/private-jobs/feed-sync"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const guard = () => requireSuperAdmin("Only super admins can manage job feeds")

interface Ctx {
  params: Promise<{ id: string }>
}

const patchSchema = z
  .object({ enabled: z.boolean().optional(), indiaOnly: z.boolean().optional() })
  .refine((v) => v.enabled !== undefined || v.indiaOnly !== undefined, "Nothing to update")

/** PATCH { enabled?, indiaOnly? } */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const g = await guard()
  if (!g.ok) return g.response
  const { id } = await params
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 })
  const feed = await prisma.privateJobFeed.update({ where: { id }, data: parsed.data }).catch(() => null)
  if (!feed) return NextResponse.json({ success: false, error: "Feed not found" }, { status: 404 })
  await writeAuditLog({ action: "UPDATE", entity: "PrivateJobFeed", entityId: id, userId: g.user.id, details: JSON.stringify(parsed.data) })
  return NextResponse.json({ success: true, data: feed })
}

/** POST ?force=1 → run this feed now (force: count misses even when the circuit breaker would hold). */
export async function POST(request: NextRequest, { params }: Ctx) {
  const g = await guard()
  if (!g.ok) return g.response
  const { id } = await params
  try {
    const force = request.nextUrl.searchParams.get("force") === "1"
    const result = await syncFeed(id, { force })
    if (force) {
      await writeAuditLog({ action: "UPDATE", entity: "PrivateJobFeed", entityId: id, userId: g.user.id, details: "Forced sync past the circuit breaker" })
    }
    return NextResponse.json({ success: true, data: result })
  } catch (e) {
    const status = (e as { status?: number })?.status === 404 ? 404 : 500
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Sync failed" }, { status })
  }
}

/**
 * DELETE ?closeJobs=1 → remove the feed. Its live postings are closed when
 * closeJobs=1; otherwise they stay up and expire on their own (expiresAt).
 */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const g = await guard()
  if (!g.ok) return g.response
  const { id } = await params
  const closeJobs = request.nextUrl.searchParams.get("closeJobs") === "1"
  const feed = await prisma.privateJobFeed.findUnique({ where: { id } })
  if (!feed) return NextResponse.json({ success: false, error: "Feed not found" }, { status: 404 })
  let closed = 0
  if (closeJobs) {
    const r = await prisma.privateJob.updateMany({
      where: { feedId: id, status: "ACTIVE" },
      data: { status: "EXPIRED", closedAt: new Date() },
    })
    closed = r.count
  }
  await prisma.privateJobFeed.delete({ where: { id } })
  await writeAuditLog({
    action: "DELETE",
    entity: "PrivateJobFeed",
    entityId: id,
    userId: g.user.id,
    details: `${feed.provider} board ${feed.boardToken}; closed ${closed} live jobs`,
  })
  if (closed > 0) {
    try {
      revalidatePublicContent("private-job")
    } catch {
      // best-effort
    }
  }
  return NextResponse.json({ success: true, closed })
}
