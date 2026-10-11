import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isSchemaMismatchError } from "@/lib/prisma-errors"
import { isAdmin } from "@/lib/roles"

const db = prisma as unknown as Record<string, never> & {
  user: {
    findUnique: (a: unknown) => Promise<Record<string, unknown> | null>
  }
  resume: { findUnique: (a: unknown) => Promise<Record<string, unknown> | null> }
  notificationPreference: {
    findUnique: (a: unknown) => Promise<Record<string, unknown> | null>
    create: (a: unknown) => Promise<Record<string, unknown>>
  }
  bookmark: { count: (a: unknown) => Promise<number> }
  comment: { count: (a: unknown) => Promise<number> }
  application: { count: (a: unknown) => Promise<number> }
  job: { count: (a: unknown) => Promise<number> }
}

const ADMIN_SECTIONS = ["Jobs", "Results", "Admit cards", "Answer keys", "Admissions", "Syllabus", "Blog", "Private jobs", "Users"]

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id
    let user: Record<string, unknown> | null
    try {
      user = await db.user.findUnique({
        where: { id: userId },
        include: {
          notificationPreference: true,
          resume: true,
          accounts: { select: { provider: true } },
        },
      })
    } catch (error) {
      if (!isSchemaMismatchError(error)) throw error
      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          phone: true,
          emailVerified: true,
          password: true,
          createdAt: true,
          updatedAt: true,
          notificationPreference: true,
          resume: true,
          accounts: { select: { provider: true } },
        },
      })
    }
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    const u = user as Record<string, unknown>
    let prefs = u["notificationPreference"] as Record<string, unknown> | null
    if (!prefs) {
      try {
        prefs = await db.notificationPreference.create({ data: { userId } }) as Record<string, unknown>
      } catch {
        prefs = null
      }
    }
    const resume = (u["resume"] as Record<string, unknown> | null) ?? null
    const accounts = (u["accounts"] as Array<{ provider: string }>) ?? []
    const hasPassword = !!(u["password"] as string | null)
    const hasGoogle = accounts.some((a) => a.provider === "google")
    const role = (u["role"] as string) ?? "USER"
    const admin = isAdmin(role)
    const [bookmarks, comments, applications, savedJobs] = await Promise.all([
      db.bookmark.count({ where: { userId } }).catch(() => 0),
      db.comment.count({ where: { userId } }).catch(() => 0),
      db.application.count({ where: { userId } }).catch(() => 0),
      db.bookmark.count({ where: { userId, jobId: { not: null } } }).catch(() => 0),
    ])
    let adminStats: { uploads: number; approved: number; pendingReview: number } | null = null
    if (admin) {
      try {
        const models = ["job", "privateJob", "result", "admitCard", "answerKey", "admission", "syllabus", "blogPost"] as const
        let uploads = 0
        let approved = 0
        let pending = 0
        for (const m of models) {
          const delegate = (prisma as unknown as Record<string, { count: (a: unknown) => Promise<number> }>)[m]
          if (!delegate) continue
          const [total, appr, pend] = await Promise.all([
            delegate.count({ where: { createdById: userId } }).catch(() => 0),
            delegate.count({ where: { createdById: userId, moderation: "APPROVED" } }).catch(() => 0),
            delegate.count({ where: { createdById: userId, moderation: "PENDING" } }).catch(() => 0),
          ])
          uploads += total
          approved += appr
          pending += pend
        }
        adminStats = { uploads, approved, pendingReview: pending }
      } catch {
        adminStats = { uploads: 0, approved: 0, pendingReview: 0 }
      }
    }
    const emailVerified = u["emailVerified"] as string | null
    const phoneVerifiedAt = (u["phoneVerifiedAt"] as string | null) ?? null
    const avatarUrl = (u["avatarUrl"] as string | null) ?? (u["image"] as string | null) ?? null
    const data = {
      id: u["id"],
      name: u["name"] ?? null,
      email: u["email"],
      emailVerified: emailVerified ?? null,
      emailVerifiedAt: emailVerified ?? null,
      phone: (u["phone"] as string | null) ?? null,
      phoneVerifiedAt,
      phoneVerified: !!phoneVerifiedAt || (prefs?.["phoneVerified"] as boolean) === true,
      avatarUrl,
      image: avatarUrl,
      language: (u["language"] as string) ?? "English",
      qualification: (u["qualification"] as string | null) ?? null,
      dateOfBirth: (u["dateOfBirth"] as string | null) ?? null,
      preferredStates: Array.isArray(u["preferredStates"]) ? (u["preferredStates"] as string[]) : [],
      interestedCategories: Array.isArray(u["interestedCategories"]) ? (u["interestedCategories"] as string[]) : [],
      role,
      signInMethod: hasPassword ? "Password" : hasGoogle ? "Google" : "Password",
      password: hasPassword,
      memberSince: u["createdAt"] as string,
      createdAt: u["createdAt"],
      updatedAt: u["updatedAt"],
      passwordChangedAt: (u["passwordChangedAt"] as string | null) ?? null,
      twoFactorEnabled: (u["twoFactorEnabled"] as boolean) === true,
      editableSections: admin ? ADMIN_SECTIONS : [],
      resume: resume
        ? {
            fileName: resume["fileName"],
            fileType: resume["fileType"],
            fileSize: resume["fileSize"],
            updatedAt: resume["updatedAt"],
            url: null,
          }
        : null,
      resumeUrl: null,
      resumeFileName: resume ? (resume["fileName"] as string) : null,
      resumeFileSize: resume ? (resume["fileSize"] as number) : null,
      resumeUpdatedAt: resume ? (resume["updatedAt"] as string) : null,
      preferences: prefs ?? {},
      counts: { applications, bookmarks, savedJobs, comments },
      adminStats,
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const role = session.user.role ?? "USER"
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin accounts can only be removed by a super admin. Contact support." },
        { status: 403 }
      )
    }
    const body = await request.json().catch(() => ({}))
    if ((body as { confirm?: string }).confirm !== "DELETE") {
      return NextResponse.json({ success: false, error: 'Type DELETE to confirm' }, { status: 400 })
    }
    const { writeAuditEvent } = await import("@/lib/audit")
    await writeAuditEvent({
      action: "DELETE",
      entityType: "User",
      entityId: session.user.id,
      actorId: session.user.id,
      actorRole: role,
      summary: `Account deleted by owner ${session.user.id}`,
      source: "API",
    }).catch(() => undefined)
    await (prisma.user.delete({ where: { id: session.user.id } }) as Promise<unknown>).catch(() => undefined)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete account" },
      { status: 500 }
    )
  }
}
