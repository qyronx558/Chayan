import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/roles"

export async function GET() {
  try {
    const session = await auth()
    if (!session || !isAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const items = await prisma.jobReport.findMany({
      where: { status: "PENDING" },
      include: { privateJob: { include: { company: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    return NextResponse.json({ success: true, data: items })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
