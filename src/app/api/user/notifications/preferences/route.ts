import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    })

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId: session.user.id },
      })
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

    const body = await request.json()
    const {
      jobAlerts,
      resultAlerts,
      admitCardAlerts,
      privateJobAlerts,
      admissionAlerts,
      blogAlerts,
      syllabusAlerts,
      answerKeyAlerts,
      generalAlerts,
    } = body

    const boolOrUndefined = (v: unknown): boolean | undefined =>
      typeof v === "boolean" ? v : undefined

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {
        ...(boolOrUndefined(jobAlerts) !== undefined ? { jobAlerts } : {}),
        ...(boolOrUndefined(resultAlerts) !== undefined ? { resultAlerts } : {}),
        ...(boolOrUndefined(admitCardAlerts) !== undefined ? { admitCardAlerts } : {}),
        ...(boolOrUndefined(privateJobAlerts) !== undefined ? { privateJobAlerts } : {}),
        ...(boolOrUndefined(admissionAlerts) !== undefined ? { admissionAlerts } : {}),
        ...(boolOrUndefined(blogAlerts) !== undefined ? { blogAlerts } : {}),
        ...(boolOrUndefined(syllabusAlerts) !== undefined ? { syllabusAlerts } : {}),
        ...(boolOrUndefined(answerKeyAlerts) !== undefined ? { answerKeyAlerts } : {}),
        ...(boolOrUndefined(generalAlerts) !== undefined ? { generalAlerts } : {}),
      },
      create: {
        userId: session.user.id,
        jobAlerts: boolOrUndefined(jobAlerts) ?? true,
        resultAlerts: boolOrUndefined(resultAlerts) ?? true,
        admitCardAlerts: boolOrUndefined(admitCardAlerts) ?? false,
        privateJobAlerts: boolOrUndefined(privateJobAlerts) ?? true,
        admissionAlerts: boolOrUndefined(admissionAlerts) ?? true,
        blogAlerts: boolOrUndefined(blogAlerts) ?? true,
        syllabusAlerts: boolOrUndefined(syllabusAlerts) ?? true,
        answerKeyAlerts: boolOrUndefined(answerKeyAlerts) ?? true,
        generalAlerts: boolOrUndefined(generalAlerts) ?? true,
      },
    })

    return NextResponse.json({ success: true, data: prefs })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to save preferences" },
      { status: 500 }
    )
  }
}
