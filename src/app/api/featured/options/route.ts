import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"

interface Option {
  value: string
  label: string
  url: string
  org?: string
  dateText?: string
  info?: string
}

export async function GET(request: NextRequest) {
  try {
    const type = (request.nextUrl.searchParams.get("type") || "JOB").toUpperCase()
    let options: Option[] = []

    if (type === "JOB") {
      const jobs = await prisma.job.findMany({
        where: { status: "ACTIVE" },
        include: { department: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      })
      options = jobs.map((j) => ({
        value: `/apply/${j.slug}`,
        label: j.title,
        url: `/apply/${j.slug}`,
        org: j.department?.name || undefined,
        info: j.totalVacancies ? `${j.totalVacancies.toLocaleString()} Vacancies` : undefined,
        dateText: j.lastDate ? `Last Date: ${formatDate(j.lastDate)}` : undefined,
      }))
    } else if (type === "PRIVATE_JOB") {
      const jobs = await prisma.privateJob.findMany({
        where: { status: "ACTIVE" },
        include: { company: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      })
      options = jobs.map((j) => ({
        value: `/private-jobs/${j.slug}`,
        label: j.title,
        url: `/private-jobs/${j.slug}`,
        org: j.company?.name || undefined,
        info: j.salary || j.location || undefined,
        dateText: j.lastDate ? `Last Date: ${formatDate(j.lastDate)}` : undefined,
      }))
    } else if (type === "RESULT") {
      const results = await prisma.result.findMany({
        include: { department: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      })
      options = results.map((r) => ({
        value: `/result/${r.slug}`,
        label: r.title,
        url: `/result/${r.slug}`,
        org: r.department?.name || undefined,
        dateText: r.resultDate ? `Result Date: ${formatDate(r.resultDate)}` : undefined,
      }))
    } else if (type === "ADMIT_CARD") {
      const items = await prisma.admitCard.findMany({
        include: { department: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      })
      options = items.map((a) => ({
        value: `/admit-card/${a.slug}`,
        label: a.title,
        url: `/admit-card/${a.slug}`,
        org: a.department?.name || undefined,
        dateText: a.examDate ? `Exam Date: ${formatDate(a.examDate)}` : undefined,
      }))
    } else if (type === "ANSWER_KEY") {
      const items = await prisma.answerKey.findMany({
        include: { department: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      })
      options = items.map((a) => ({
        value: `/answer-key/${a.slug}`,
        label: a.title,
        url: `/answer-key/${a.slug}`,
        org: a.department?.name || undefined,
      }))
    } else if (type === "ADMISSION") {
      const items = await prisma.admission.findMany({
        include: { department: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      })
      options = items.map((a) => ({
        value: `/admission/${a.slug}`,
        label: a.title,
        url: `/admission/${a.slug}`,
        org: a.department?.name || undefined,
        dateText: a.lastDate ? `Last Date: ${formatDate(a.lastDate)}` : undefined,
      }))
    } else if (type === "NOTIFICATION") {
      const items = await prisma.notification.findMany({
        include: { category: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      })
      options = items.map((n) => ({
        value: "/notifications",
        label: n.title,
        url: "/notifications",
        org: n.category?.name || undefined,
      }))
    }

    return NextResponse.json({ success: true, data: options })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch options" },
      { status: 500 }
    )
  }
}