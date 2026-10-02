import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const members = await prisma.companyMember.findMany({
      where: { userId: session.user.id },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({
      success: true,
      data: members.map((m) => ({
        companyId: m.companyId,
        role: m.role,
        verified: m.verified,
        company: {
          id: m.company.id,
          name: m.company.name,
          slug: m.company.slug,
          website: m.company.website,
          verifiedStatus: m.company.verifiedStatus,
        },
      })),
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
