import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MIGRATION_REQUIRED_MESSAGE, isSchemaMismatchError } from "@/lib/prisma-errors"
import { randomBytes } from "crypto"
import { rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit"

const db = prisma as unknown as {
  user: {
    findUnique: (a: unknown) => Promise<Record<string, unknown> | null>
    findFirst: (a: unknown) => Promise<Record<string, unknown> | null>
    update: (a: unknown) => Promise<unknown>
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const limit = await rateLimit([{ key: `email-change:user:${session.user.id}`, max: 5, windowSec: 3600 }])
    if (!limit.ok) return NextResponse.json({ success: false, error: TOO_MANY_ATTEMPTS }, { status: 429 })
    const body = await request.json()
    const newEmail = typeof (body as { newEmail?: unknown }).newEmail === "string" ? ((body as { newEmail: string }).newEmail.trim().toLowerCase()) : ""
    if (newEmail.length > 254 || /[<>"]/.test(newEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json({ success: false, error: "Enter a valid email address" }, { status: 400 })
    }
    const taken = await db.user.findUnique({ where: { email: newEmail } })
    if (taken) return NextResponse.json({ success: false, error: "That email is already in use" }, { status: 400 })
    const token = randomBytes(32).toString("hex")
    await db.user.update({
      where: { id: session.user.id },
      data: { pendingEmail: newEmail, emailChangeToken: token, emailChangeExpiry: new Date(Date.now() + 60 * 60 * 1000) },
    })
    try {
      const { writeAuditEvent } = await import("@/lib/audit")
      await writeAuditEvent({ action: "UPDATE", entityType: "User", entityId: session.user.id, actorId: session.user.id, actorRole: session.user.role ?? "USER", summary: `Email change requested to ${newEmail}`, source: "API" })
    } catch { /* ignore */ }
    try {
      const { Resend } = await import("resend")
      const key = process.env.RESEND_API_KEY
      const base = (process.env.NEXT_PUBLIC_APP_URL || "https://ChayanJobs.in").replace(/\/+$/, "")
      if (key) {
        const resend = new Resend(key)
        await resend.emails.send({
          from: `ChayanJobs <${process.env.RESEND_FROM_EMAIL || "noreply@chayanjobs.com"}>`,
          to: newEmail,
          subject: "Confirm your new ChayanJobs email",
          html: `<p>Confirm your new email by opening this link within 1 hour:</p><p><a href="${base}/profile?emailConfirm=${token}">Confirm ${newEmail}</a></p>`,
        }).catch(() => undefined)
      }
    } catch { /* ignore */ }
    // The token proves inbox ownership, so it only ever travels by email.
    return NextResponse.json({ success: true, data: { pendingEmail: newEmail } })
  } catch (error) {
    if (isSchemaMismatchError(error)) {
      return NextResponse.json({ success: false, error: MIGRATION_REQUIRED_MESSAGE }, { status: 503 })
    }
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to request email change" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    const token = typeof (body as { token?: unknown }).token === "string" ? (body as { token: string }).token : ""
    if (!token) return NextResponse.json({ success: false, error: "Confirmation token is required" }, { status: 400 })
    const limit = await rateLimit([{ key: `email-confirm:user:${session.user.id}`, max: 10, windowSec: 3600 }])
    if (!limit.ok) return NextResponse.json({ success: false, error: TOO_MANY_ATTEMPTS }, { status: 429 })
    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (!user || user["emailChangeToken"] !== token) {
      return NextResponse.json({ success: false, error: "Invalid or expired confirmation link" }, { status: 400 })
    }
    const expiry = user["emailChangeExpiry"] as Date | string | null
    if (!expiry || new Date(expiry).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: "Confirmation link has expired" }, { status: 400 })
    }
    const pending = user["pendingEmail"] as string | null
    if (!pending) return NextResponse.json({ success: false, error: "No pending email change" }, { status: 400 })
    await db.user.update({
      where: { id: session.user.id },
      data: { email: pending, emailVerified: new Date(), pendingEmail: null, emailChangeToken: null, emailChangeExpiry: null },
    })
    try {
      const { writeAuditEvent } = await import("@/lib/audit")
      await writeAuditEvent({ action: "UPDATE", entityType: "User", entityId: session.user.id, actorId: session.user.id, actorRole: session.user.role ?? "USER", summary: `Email changed to ${pending} after confirmation`, source: "API" })
    } catch { /* ignore */ }
    return NextResponse.json({ success: true, data: { email: pending } })
  } catch (error) {
    if (isSchemaMismatchError(error)) {
      return NextResponse.json({ success: false, error: MIGRATION_REQUIRED_MESSAGE }, { status: 503 })
    }
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to confirm email change" }, { status: 500 })
  }
}
