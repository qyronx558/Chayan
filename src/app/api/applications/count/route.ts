import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/** Public count of users tracking a job - powers genuine social proof. No auth needed. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")
    if (!jobId) return NextResponse.json({ count: 0 })
    const count = await prisma.application.count({ where: { jobId } })
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
