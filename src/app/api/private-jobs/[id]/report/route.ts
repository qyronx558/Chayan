import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { jobReportSchema } from "@/lib/validations"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const v = jobReportSchema.safeParse(body)
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 })
    const job = await prisma.privateJob.findUnique({ where: { id } })
    if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    const session = await auth()
    // Throttle: max 3 reports per job per user
    if (session?.user) {
      const count = await prisma.jobReport.count({ where: { privateJobId: id, userId: session.user.id } })
      if (count >= 3) return NextResponse.json({ success: false, error: "You already reported this job" }, { status: 429 })
    }
    const report = await prisma.jobReport.create({
      data: {
        privateJobId: id,
        userId: session?.user?.id || null,
        reason: v.data.reason,
        details: v.data.details || null,
      },
    })
    // Lower trust slightly on each report so risky jobs sink fast; recomputed fully on admin edit.
    await prisma.privateJob.update({ where: { id }, data: { trustScore: { decrement: 5 } } }).catch(() => {})
    return NextResponse.json({ success: true, data: report }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
