import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const [user, bookmarks, applications, comments, resume, prefs] = await Promise.all([
      (prisma.user as unknown as { findUnique: (a: unknown) => Promise<Record<string, unknown> | null> }).findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          language: true,
          qualification: true,
          dateOfBirth: true,
          preferredStates: true,
          interestedCategories: true,
          role: true,
          emailVerified: true,
          phoneVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
          twoFactorEnabled: true,
          passwordChangedAt: true,
        },
      }),
      (prisma.bookmark as unknown as { findMany: (a: unknown) => Promise<Record<string, unknown>[]> }).findMany({
        where: { userId },
        select: { id: true, jobId: true, resultId: true, admitCardId: true, createdAt: true },
      }).catch(() => []),
      (prisma.application as unknown as { findMany: (a: unknown) => Promise<Record<string, unknown>[]> }).findMany({
        where: { userId },
        select: { id: true, jobId: true, status: true, appliedAt: true, createdAt: true },
      }).catch(() => []),
      (prisma.comment as unknown as { findMany: (a: unknown) => Promise<Record<string, unknown>[]> }).findMany({
        where: { userId },
        select: { id: true, body: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }).catch(() => []),
      (prisma.resume as unknown as { findUnique: (a: unknown) => Promise<Record<string, unknown> | null> }).findUnique({
        where: { userId },
        select: { fileName: true, fileType: true, fileSize: true, skills: true, education: true, experience: true, updatedAt: true },
      }).catch(() => null),
      (prisma.notificationPreference as unknown as { findUnique: (a: unknown) => Promise<Record<string, unknown> | null> }).findUnique({
        where: { userId },
      }).catch(() => null),
    ])

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      account: user,
      resume: resume ?? null,
      bookmarks,
      applications,
      comments,
      notificationPreferences: prefs ?? null,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="profile-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    )
  }
}
