import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { jobReferralSchema } from "@/lib/validations"
import { normalizeExternalUrl } from "@/lib/apply-room"
import { isAdmin } from "@/lib/roles"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const items = await prisma.jobReferral.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    return NextResponse.json({ success: true, data: items })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()
    const v = jobReferralSchema.safeParse(body)
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 })
    const normalized = normalizeExternalUrl(v.data.url)
    if (!normalized) return NextResponse.json({ success: false, error: "Apply URL looks invalid" }, { status: 400 })
    // Dedupe: same URL referred or already a job in last 90 days
    const existing = await prisma.jobReferral.findFirst({ where: { url: normalized, status: "PENDING" } })
    if (existing) return NextResponse.json({ success: false, error: "This job was already referred and is under review" }, { status: 409 })
    const dupJob = await prisma.privateJob.findFirst({ where: { applicationUrl: normalized } })
    if (dupJob) return NextResponse.json({ success: false, error: "This job is already listed", data: { slug: dupJob.slug } }, { status: 409 })
    const item = await prisma.jobReferral.create({
      data: {
        title: v.data.title.trim(),
        companyName: v.data.companyName.trim(),
        url: normalized,
        proofUrl: v.data.proofUrl || null,
        location: v.data.location || null,
        note: v.data.note || null,
        userId: session?.user?.id || null,
      },
    })
    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
