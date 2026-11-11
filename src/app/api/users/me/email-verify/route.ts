import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit"

const db = prisma as unknown as {
  user: {
    findUnique: (a: unknown) => Promise<Record<string, unknown> | null>
    update: (a: unknown) => Promise<unknown>
  }
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    if (user["emailVerified"]) return NextResponse.json({ success: true, data: { already: true } })
    const limit = await rateLimit([{ key: `email-verify:user:${session.user.id}`, max: 5, windowSec: 3600 }])
    if (!limit.ok) return NextResponse.json({ success: false, error: TOO_MANY_ATTEMPTS }, { status: 429 })
    const token = randomBytes(32).toString("hex")
    await db.user.update({
      where: { id: session.user.id },
      data: { resetToken: `email-${token}`, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
    }).catch(() => undefined)
    try {
      const { Resend } = await import("resend")
      const key = process.env.RESEND_API_KEY
      const base = (process.env.NEXT_PUBLIC_APP_URL || "https://ChayanJobs.in").replace(/\/+$/, "")
      if (key) {
        const resend = new Resend(key)
        await resend.emails.send({
          from: `ChayanJobs <${process.env.RESEND_FROM_EMAIL || "noreply@chayanjobs.com"}>`,
          to: String(user["email"]),
          subject: "Verify your ChayanJobs email",
          html: `<p>Verify your email by opening this link within 1 hour:</p><p><a href="${base}/profile?emailVerify=${token}">Verify email</a></p>`,
        }).catch(() => undefined)
      }
    } catch { /* ignore */ }
    // The token proves inbox ownership, so it only ever travels by email.
    return NextResponse.json({ success: true, data: { sent: true } })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to send verification email" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    const token = typeof (body as { token?: unknown }).token === "string" ? (body as { token: string }).token : ""
    if (!token) return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 })
    const limit = await rateLimit([{ key: `email-verify-confirm:user:${session.user.id}`, max: 10, windowSec: 3600 }])
    if (!limit.ok) return NextResponse.json({ success: false, error: TOO_MANY_ATTEMPTS }, { status: 429 })
    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (!user || user["resetToken"] !== `email-${token}`) {
      return NextResponse.json({ success: false, error: "Invalid or expired link" }, { status: 400 })
    }
    const expiry = user["resetTokenExpiry"] as Date | string | null
    if (!expiry || new Date(String(expiry)).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: "Link has expired" }, { status: 400 })
    }
    await db.user.update({ where: { id: session.user.id }, data: { emailVerified: new Date(), resetToken: null, resetTokenExpiry: null } }).catch(() => undefined)
    try {
      const { writeAuditEvent } = await import("@/lib/audit")
      await writeAuditEvent({ action: "UPDATE", entityType: "User", entityId: session.user.id, actorId: session.user.id, actorRole: session.user.role ?? "USER", summary: "Email verified", source: "API" })
    } catch { /* ignore */ }
    return NextResponse.json({ success: true, data: { verified: true } })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to verify email" }, { status: 500 })
  }
}
