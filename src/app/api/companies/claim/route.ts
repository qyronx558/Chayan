import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { companyClaimSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: "Login required" }, { status: 401 })
    const body = await request.json()
    const v = companyClaimSchema.safeParse(body)
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 })
    const company = await prisma.company.findUnique({ where: { id: v.data.companyId } })
    if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 })
    // String domain match alone NEVER verifies - inbox OTP proof is mandatory.
    // This legacy endpoint only records intent; verification happens via /api/employer/verify/*.
    const emailDomain = v.data.workEmail.toLowerCase().split("@")[1] || ""
    await prisma.$transaction([
      prisma.company.update({
        where: { id: company.id },
        data: { verifiedStatus: "PENDING", claimEmailDomain: emailDomain },
      }),
      prisma.companyMember.upsert({
        where: { companyId_userId: { companyId: company.id, userId: session.user.id } },
        update: { verified: false, role: "OWNER" },
        create: { companyId: company.id, userId: session.user.id, role: "OWNER", verified: false },
      }),
    ])
    return NextResponse.json({
      success: true,
      verified: false,
      message: "Claim noted. Complete inbox OTP verification to unlock posting - string match alone is not trusted.",
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
