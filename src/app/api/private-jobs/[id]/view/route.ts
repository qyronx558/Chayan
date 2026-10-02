import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function dayKey(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const day = dayKey()
    await prisma.$transaction([
      prisma.privateJob.update({ where: { id }, data: { views: { increment: 1 } } }),
      prisma.privateJobView.upsert({
        where: { privateJobId_date: { privateJobId: id, date: day } },
        update: { views: { increment: 1 } },
        create: { privateJobId: id, date: day, views: 1 },
      }),
    ]).catch(() => {})
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
