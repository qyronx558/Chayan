import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { companySchema } from "@/lib/validations"
import { isAdmin } from "@/lib/roles"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const verified = searchParams.get("verified") || ""
    const withStats = searchParams.get("withStats") === "1"
    const companies = await prisma.company.findMany({
      where: verified ? { verifiedStatus: verified as never } : {},
      orderBy: { name: "asc" },
      include: withStats ? { _count: { select: { privateJob: true } } } : undefined,
    })
    return NextResponse.json({ success: true, data: companies })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch companies" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = companySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }

    const company = await prisma.company.create({ data: validation.data })
    return NextResponse.json({ success: true, data: company }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create company" },
      { status: 500 }
    )
  }
}