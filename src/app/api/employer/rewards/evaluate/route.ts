import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { evaluateCompanyMilestones } from "@/lib/employer-earnings"

/** Re-check milestones for the caller's verified companies (idempotent). */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    const onlyCompanyId = typeof body.companyId === "string" ? body.companyId : null

    const members = await prisma.companyMember.findMany({
      where: { userId: session.user.id, verified: true },
      select: { companyId: true, company: { select: { verifiedStatus: true } } },
    })
    let companyIds = members.filter((m) => m.company.verifiedStatus === "VERIFIED").map((m) => m.companyId)
    if (onlyCompanyId) companyIds = companyIds.filter((id) => id === onlyCompanyId)
    if (companyIds.length === 0) return NextResponse.json({ success: false, error: "No verified company yet" }, { status: 403 })

    const results: Record<string, { awarded: { kind: string; coins: number }[] }> = {}
    for (const id of companyIds.slice(0, 10)) {
      const r = await evaluateCompanyMilestones(id)
      results[id] = { awarded: r.awarded }
    }
    const total = Object.values(results).flatMap((r) => r.awarded).reduce((s, a) => s + a.coins, 0)
    return NextResponse.json({
      success: true,
      data: results,
      message: total > 0 ? `${total} coins submitted for review` : "No new milestones yet",
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
