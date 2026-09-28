/**
 * Application Reminder Worker
 * ----------------------------
 * Scans Application records whose linked Job/Admission deadlines
 * (lastDate, Admit Card Date, Result Date) are near and sends
 * email + SMS reminders to the tracking user.
 *
 * Run manually:        npx tsx --env-file=.env scripts/application-reminders.ts
 * Run via Prefect:     see prefect/application_reminder_flow.py
 * Idempotent:          ReminderLog rows prevent duplicate sends.
 */

import { PrismaClient, ReminderType } from "@prisma/client"
import {
  sendApplicationReminderEmail,
  sendApplicationReminderSms,
  type ApplicationReminderItem,
} from "../src/lib/email"

const prisma = new PrismaClient()

const DAY = 86400000

interface ImportantDates {
  [key: string]: string
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const match = value.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/)
  if (!match) return null
  const [d, m, y] = match[0].split(/[-/]/).map(Number)
  const date = new Date(y < 100 ? 2000 + y : y, m - 1, d)
  return isNaN(date.getTime()) ? null : date
}

function datesFrom(importantDates: ImportantDates | null | undefined): {
  lastDate: Date | null
  admitCardDate: Date | null
  resultDate: Date | null
} {
  const i = importantDates || {}
  return {
    lastDate: parseDate(i["Last Date"] || i["Application Last Date"]),
    admitCardDate: parseDate(i["Admit Card Date"] || i["Admit Card Release Date"]),
    resultDate: parseDate(i["Result Date"] || i["Final Result Date"]),
  }
}

function inReminderWindow(date: Date | null, now: number): boolean {
  if (!date) return false
  const t = date.getTime()
  return t >= now - DAY && t <= now + 3 * DAY
}

async function main() {
  const now = Date.now()
  console.log(`[reminders] started ${new Date(now).toISOString()}`)

  const applications = await prisma.application.findMany({
    include: { user: { select: { id: true, email: true, name: true, phone: true } } },
  })

  const jobIds = applications.filter((a) => a.type === "job").map((a) => a.jobId)
  const admissionIds = applications.filter((a) => a.type === "admission").map((a) => a.jobId)

  const [jobs, admissions] = await Promise.all([
    jobIds.length ? prisma.job.findMany({ where: { id: { in: jobIds } } }) : Promise.resolve([]),
    admissionIds.length ? prisma.admission.findMany({ where: { id: { in: admissionIds } } }) : Promise.resolve([]),
  ])

  const jobMap = new Map(jobs.map((j) => [j.id, j]))
  const admissionMap = new Map(admissions.map((a) => [a.id, a]))

  type Pending = { user: typeof applications[number]["user"]; reminder: ApplicationReminderItem; reminderType: ReminderType; targetDate: Date; jobId: string }

  const pending: Pending[] = []

  for (const app of applications) {
    const user = app.user
    const job = app.type === "job" ? jobMap.get(app.jobId) : null
    const admission = app.type === "admission" ? admissionMap.get(app.jobId) : null

    if (!job && !admission) continue

    let lastDate: Date | null = null
    let admitCardDate: Date | null = null
    let resultDate: Date | null = null
    const title = job?.title || admission?.title || "Application"
    const href = job ? `/apply/${job.slug}` : `/admission/${admission!.slug}`

    if (job) {
      lastDate = job.lastDate || datesFrom(job.importantDates as ImportantDates | null).lastDate
      const d = datesFrom(job.importantDates as ImportantDates | null)
      admitCardDate = d.admitCardDate
      resultDate = d.resultDate
    } else if (admission) {
      lastDate = admission.lastDate
    }

    if (inReminderWindow(lastDate, now) && (app.status === "interested" || app.status === "applied")) {
      const overdue = lastDate!.getTime() < now
      pending.push({
        user,
        jobId: app.jobId,
        reminderType: ReminderType.application_deadline,
        targetDate: lastDate!,
        reminder: {
          type: "Application Deadline",
          title,
          detail: overdue
            ? `The application window closed on ${lastDate!.toLocaleDateString("en-IN")}. Check if late application is still possible.`
            : `Apply before ${lastDate!.toLocaleDateString("en-IN")} (${Math.ceil((lastDate!.getTime() - now) / DAY)} day${lastDate!.getTime() - now >= 2 * DAY ? "s" : ""} left).`,
          date: lastDate!.toISOString(),
          href,
        },
      })
    }

    if (inReminderWindow(admitCardDate, now) && (app.status === "applied" || app.status === "admit_card")) {
      pending.push({
        user,
        jobId: app.jobId,
        reminderType: ReminderType.admit_card,
        targetDate: admitCardDate!,
        reminder: {
          type: "Admit Card",
          title,
          detail: `The admit card for this exam is expected by ${admitCardDate!.toLocaleDateString("en-IN")}. Check the official site and download it in time.`,
          date: admitCardDate!.toISOString(),
          href,
        },
      })
    }

    if (inReminderWindow(resultDate, now) && (app.status === "applied" || app.status === "admit_card" || app.status === "exam_done")) {
      pending.push({
        user,
        jobId: app.jobId,
        reminderType: ReminderType.result,
        targetDate: resultDate!,
        reminder: {
          type: "Result",
          title,
          detail: `The result for this exam is expected by ${resultDate!.toLocaleDateString("en-IN")}. Keep an eye on the official site.`,
          date: resultDate!.toISOString(),
          href,
        },
      })
    }
  }

  console.log(`[reminders] ${pending.length} candidate reminder(s) found`)

  const alreadySent = await prisma.reminderLog.findMany({
    where: {
      OR: pending.map((p) => ({
        userId: p.user.id,
        jobId: p.jobId,
        type: p.reminderType,
        targetDate: p.targetDate,
      })),
    },
    select: { userId: true, jobId: true, type: true, targetDate: true },
  })
  const sentKeys = new Set(
    alreadySent.map((l) => `${l.userId}:${l.jobId}:${l.type}:${l.targetDate.getTime()}`)
  )

  const fresh = pending.filter(
    (p) => !sentKeys.has(`${p.user.id}:${p.jobId}:${p.reminderType}:${p.targetDate.getTime()}`)
  )

  const byUser = new Map<string, Pending[]>()
  for (const item of fresh) {
    const arr = byUser.get(item.user.id) || []
    arr.push(item)
    byUser.set(item.user.id, arr)
  }

  let sentCount = 0
  for (const [userId, items] of byUser) {
    const user = items[0].user
    const results: { reminderType: ReminderType; targetDate: Date; jobId: string; channel: string; ok: boolean }[] = []

    if (user.email) {
      const emailRes = await sendApplicationReminderEmail(
        user.email,
        user.name || "there",
        items.map((i) => i.reminder)
      )
      for (const item of items) {
        results.push({ reminderType: item.reminderType, targetDate: item.targetDate, jobId: item.jobId, channel: "email", ok: emailRes.success })
      }
    }

    if (user.phone) {
      for (const item of items) {
        const smsRes = await sendApplicationReminderSms(user.phone, smsText(item.reminder))
        results.push({ reminderType: item.reminderType, targetDate: item.targetDate, jobId: item.jobId, channel: "sms", ok: smsRes.success })
      }
    }

    if (!user.email && !user.phone) {
      console.warn(`[reminders] user ${userId} has no email/phone - skipped`)
    }

    for (const r of results) {
      if (!r.ok) continue
      await prisma.reminderLog
        .create({
          data: {
            userId,
            jobId: r.jobId,
            type: r.reminderType,
            targetDate: r.targetDate,
            channel: r.channel,
          },
        })
        .catch(() => {})
      sentCount++
    }
  }

  console.log(`[reminders] done - ${sentCount} reminder(s) sent, ${fresh.length - sentCount} skipped/failed`)
}

function smsText(r: ApplicationReminderItem): string {
  return `Chayan Jobs: ${r.type} reminder - ${r.title}. ${r.detail} Open: ${process.env.NEXT_PUBLIC_APP_URL || "https://chayanjobs.com"}${r.href}`
}

main()
  .catch((e) => {
    console.error("[reminders] failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())