import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/roles"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !isAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const { action } = await request.json()
    if (!["APPROVED", "REJECTED"].includes(action)) return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    const item = await prisma.jobReferral.update({ where: { id }, data: { status: action } })
    return NextResponse.json({ success: true, data: item })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
