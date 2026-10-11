import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isSchemaMismatchError } from "@/lib/prisma-errors"

const db = prisma as unknown as {
  notificationPreference: {
    findUnique: (a: unknown) => Promise<Record<string, unknown> | null>
    create: (a: unknown) => Promise<Record<string, unknown>>
    upsert: (a: unknown) => Promise<Record<string, unknown>>
  }
}

const BOOL_KEYS = [
  "jobAlerts", "resultAlerts", "admitCardAlerts", "privateJobAlerts", "admissionAlerts",
  "blogAlerts", "syllabusAlerts", "answerKeyAlerts", "generalAlerts",
  "smsJobAlerts", "smsResultAlerts", "smsAdmitCardAlerts", "smsPrivateJobAlerts",
  "smsAdmissionAlerts", "smsBlogAlerts", "smsSyllabusAlerts", "smsAnswerKeyAlerts", "smsGeneralAlerts",
  "telegramJobAlerts", "telegramResultAlerts", "telegramAdmitCardAlerts", "telegramAnswerKeyAlerts",
  "telegramDeadlineAlerts", "telegramReviewAlerts", "telegramRoleAlerts", "telegramSecurityAlerts",
  "emailDeadlineAlerts", "smsDeadlineAlerts", "emailReviewAlerts", "smsReviewAlerts",
  "emailRoleAlerts", "smsRoleAlerts", "emailSecurityAlerts", "smsSecurityAlerts",
  "telegramGeneralAlerts", "quietHoursEnabled",
] as const

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    let prefs = await db.notificationPreference.findUnique({ where: { userId: session.user.id } })
    if (!prefs) {
      prefs = await db.notificationPreference.create({ data: { userId: session.user.id } })
    }
    return NextResponse.json({ success: true, data: prefs })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load preferences" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const update: Record<string, boolean | string> = {}
    for (const k of BOOL_KEYS) {
      if (typeof body[k] === "boolean") update[k] = body[k] as boolean
    }
    if (typeof body["digestFrequency"] === "string" && ["INSTANT", "DAILY", "WEEKLY"].includes(body["digestFrequency"] as string)) {
      update["digestFrequency"] = body["digestFrequency"] as string
    }
    const LEGACY_KEYS = new Set([
      "jobAlerts", "resultAlerts", "admitCardAlerts", "privateJobAlerts", "admissionAlerts",
      "blogAlerts", "syllabusAlerts", "answerKeyAlerts", "generalAlerts",
      "smsJobAlerts", "smsResultAlerts", "smsAdmitCardAlerts", "smsPrivateJobAlerts",
      "smsAdmissionAlerts", "smsBlogAlerts", "smsSyllabusAlerts", "smsAnswerKeyAlerts", "smsGeneralAlerts",
    ])
    let prefs: Record<string, unknown>
    try {
      prefs = await db.notificationPreference.upsert({
        where: { userId: session.user.id },
        update,
        create: { userId: session.user.id, ...update },
      })
    } catch (error) {
      if (!isSchemaMismatchError(error)) throw error
      const legacyUpdate: Record<string, boolean> = {}
      for (const [k, v] of Object.entries(update)) {
        if (LEGACY_KEYS.has(k) && typeof v === "boolean") legacyUpdate[k] = v
      }
      prefs = await db.notificationPreference.upsert({
        where: { userId: session.user.id },
        update: legacyUpdate,
        create: { userId: session.user.id, ...legacyUpdate },
      })
    }
    try {
      const { writeAuditEvent } = await import("@/lib/audit")
      await writeAuditEvent({
        action: "UPDATE", entityType: "NotificationPreference", entityId: session.user.id,
        actorId: session.user.id, actorRole: session.user.role ?? "USER",
        summary: "Notification preferences updated", source: "API",
      })
    } catch { undefined }
    return NextResponse.json({ success: true, data: prefs })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to save preferences" },
      { status: 500 }
    )
  }
}
