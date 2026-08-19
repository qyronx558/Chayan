import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ tracked: false, application: null })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")

    if (!jobId) {
      return NextResponse.json({ tracked: false, application: null })
    }

    const application = await prisma.application.findUnique({
      where: { userId_jobId: { userId: session.user.id, jobId } },
      select: { id: true, status: true, type: true },
    })

    return NextResponse.json({
      tracked: !!application,
      application,
    })
  } catch {
    return NextResponse.json({ tracked: false, application: null })
  }
}