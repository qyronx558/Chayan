import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations"
import { profileUpdateSchema } from "@/lib/profile-schemas"
import { isSchemaMismatchError } from "@/lib/prisma-errors"
import { hash } from "bcryptjs"
import { clientIp, ipRules, rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit"

const db = prisma as unknown as {
  user: {
    findUnique: (a: unknown) => Promise<Record<string, unknown> | null>
    update: (a: unknown) => Promise<Record<string, unknown>>
    create: (a: unknown) => Promise<Record<string, unknown>>
    findMany: (a: unknown) => Promise<Record<string, unknown>[]>
    count: (a: unknown) => Promise<number>
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }
    const { name, email, password } = validation.data
    const ipLimit = ipRules("register", clientIp(request), 20, 3600)
    if (ipLimit.length > 0 && !(await rateLimit(ipLimit)).ok) {
      return NextResponse.json({ success: false, error: TOO_MANY_ATTEMPTS }, { status: 429 })
    }
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 400 })
    }
    const hashedPassword = await hash(password, 12)
    const user = await db.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Registration failed" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""
    const skip = (page - 1) * limit
    const searchOr = search
      ? [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { id: { contains: search } },
        ]
      : []
    const where = {
      ...(searchOr.length > 0 ? { OR: searchOr } : {}),
      ...(role === "USER" || role === "ADMIN" || role === "SUPER_ADMIN" ? { role: role as "USER" | "ADMIN" | "SUPER_ADMIN" } : {}),
    }
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, image: true, role: true, phone: true,
          emailVerified: true, createdAt: true, updatedAt: true,
          _count: { select: { bookmark: true, comments: true, jobs: true, privateJobs: true, results: true, admitCards: true, answerKeys: true, admissions: true, syllabi: true, blogPosts: true } },
        },
        orderBy: { createdAt: "desc" }, skip, take: limit,
      }),
      db.user.count({ where }),
    ])
    return NextResponse.json({ success: true, data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch users" },
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
    const body = await request.json()
    const validation = profileUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }
    const existing = await db.user.findUnique({ where: { id: session.user.id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    const data = validation.data
    const prevPhone = (existing["phone"] as string | null) ?? null
    const nextPhone = data.phone ?? null
    const phoneChanged = (prevPhone ?? "") !== (nextPhone ?? "")
    const updateData: Record<string, unknown> = {
      name: data.name,
      language: data.language,
      qualification: data.qualification || null,
      preferredStates: data.preferredStates ?? [],
      interestedCategories: data.interestedCategories ?? [],
    }
    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth)
      if (!isNaN(dob.getTime())) updateData["dateOfBirth"] = dob
    } else {
      updateData["dateOfBirth"] = null
    }
    if (nextPhone !== undefined) {
      updateData["phone"] = nextPhone
      if (phoneChanged) {
        updateData["phoneVerifiedAt"] = null
        try {
          await (prisma as unknown as { notificationPreference: { updateMany: (a: unknown) => Promise<unknown> } }).notificationPreference.updateMany({
            where: { userId: session.user.id },
            data: { phoneVerified: false },
          })
        } catch { /* ignore */ }
      }
    }
    const select = { id: true, name: true, email: true, image: true, role: true, phone: true, createdAt: true, updatedAt: true }
    let user: Record<string, unknown>
    try {
      user = await db.user.update({ where: { id: session.user.id }, data: updateData, select })
    } catch (error) {
      if (!isSchemaMismatchError(error)) throw error
      const legacyData: Record<string, unknown> = { name: data.name }
      if (nextPhone !== undefined) legacyData["phone"] = nextPhone
      user = await db.user.update({ where: { id: session.user.id }, data: legacyData, select })
    }
    try {
      const { writeAuditEvent } = await import("@/lib/audit")
      await writeAuditEvent({
        action: "UPDATE",
        entityType: "User",
        entityId: session.user.id,
        actorId: session.user.id,
        actorRole: session.user.role ?? "USER",
        summary: phoneChanged ? "Profile updated, phone changed and verification reset" : "Profile updated",
        diff: { after: { name: data.name, language: data.language, phoneChanged } },
        source: "API",
      })
    } catch { /* ignore */ }
    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update profile" },
      { status: 500 }
    )
  }
}
