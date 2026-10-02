import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [companies, jobs] = await Promise.all([
      prisma.company.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, verifiedStatus: true },
      }),
      prisma.privateJob.findMany({
        where: { status: "ACTIVE" },
        select: { location: true, type: true, remotePolicy: true, skills: true, category: true },
      }),
    ])

    const locationSet = new Set<string>()
    const typeSet = new Set<string>()
    const remoteSet = new Set<string>()
    const skillCount = new Map<string, number>()
    const categorySet = new Set<string>()
    for (const job of jobs) {
      if (job.location) locationSet.add(job.location)
      if (job.type) typeSet.add(job.type)
      if (job.remotePolicy) remoteSet.add(job.remotePolicy)
      if (job.category) categorySet.add(job.category)
      for (const s of job.skills || []) skillCount.set(s, (skillCount.get(s) || 0) + 1)
    }
    const topSkills = [...skillCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([s]) => s)

    return NextResponse.json({
      success: true,
      data: {
        companies,
        locations: Array.from(locationSet).sort(),
        types: Array.from(typeSet).sort(),
        remotes: Array.from(remoteSet).sort(),
        skills: topSkills,
        categories: Array.from(categorySet).sort(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch filters" },
      { status: 500 }
    )
  }
}
