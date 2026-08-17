import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const job = await prisma.job.findUnique({ where: { id } })
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    }

    const today = startOfDay(new Date())

    await prisma.jobView.upsert({
      where: { jobId_date: { jobId: id, date: today } },
      update: { views: { increment: 1 } },
      create: { jobId: id, date: today, views: 1 },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to record view" },
      { status: 500 }
    )
  }
}