import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        privateJobId: z.string().min(1).max(64),
        /** When the candidate opened the application (device clock); defaults to now. */
        appliedAt: z.coerce.date().optional(),
      })
    )
    .min(1)
    .max(100),
  source: z.enum(["apply_click", "import"]).default("apply_click"),
})

/**
 * Records that the signed-in candidate opened the application of these jobs
 * (Apply button), or imports what this device recorded before sign-in.
 * Never moves a job backwards: interview / offer / rejected stay as they are;
 * "saved" (or nothing) becomes "applied".
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const v = bodySchema.safeParse(await request.json().catch(() => null))
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 })

    const userId = session.user.id
    const now = new Date()
    const wanted = new Map<string, Date>()
    for (const it of v.data.items) {
      // A device clock in the future is clamped to now.
      const at = it.appliedAt && it.appliedAt.getTime() < now.getTime() ? it.appliedAt : now
      const prev = wanted.get(it.privateJobId)
      if (!prev || at < prev) wanted.set(it.privateJobId, at)
    }
    const ids = [...wanted.keys()]
    const [jobs, existing] = await Promise.all([
      prisma.privateJob.findMany({ where: { id: { in: ids } }, select: { id: true } }),
      prisma.privateApplication.findMany({ where: { userId, privateJobId: { in: ids } } }),
    ])
    const known = new Set(jobs.map((j) => j.id))
    const byJob = new Map(existing.map((a) => [a.privateJobId, a]))

    const out: { privateJobId: string; appliedAt: Date; status: string }[] = []
    for (const id of ids) {
      if (!known.has(id)) continue
      const at = wanted.get(id) as Date
      const app = byJob.get(id)
      if (!app) {
        const created = await prisma.privateApplication.create({
          data: { userId, privateJobId: id, status: "applied", appliedAt: at, source: v.data.source },
        })
        out.push({ privateJobId: id, appliedAt: created.appliedAt as Date, status: created.status })
        continue
      }
      const promote = app.status === "saved"
      if (!promote && app.appliedAt) {
        out.push({ privateJobId: id, appliedAt: app.appliedAt, status: app.status })
        continue
      }
      const updated = await prisma.privateApplication.update({
        where: { id: app.id },
        data: { ...(promote ? { status: "applied" as const } : {}), appliedAt: app.appliedAt ?? at, source: app.source ?? v.data.source },
      })
      out.push({ privateJobId: id, appliedAt: updated.appliedAt as Date, status: updated.status })
    }
    return NextResponse.json({ success: true, data: out })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
