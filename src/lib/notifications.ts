import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type NotificationType =
  | "JOB"
  | "PRIVATE_JOB"
  | "RESULT"
  | "ADMIT_CARD"
  | "ADMISSION"
  | "SYLLABUS"
  | "ANSWER_KEY"
  | "BLOG"
  | "GENERAL"

function prefWhere(type: NotificationType): Prisma.NotificationPreferenceWhereInput {
  switch (type) {
    case "JOB":
      return { jobAlerts: true }
    case "PRIVATE_JOB":
      return { privateJobAlerts: true }
    case "RESULT":
      return { resultAlerts: true }
    case "ADMIT_CARD":
      return { admitCardAlerts: true }
    case "ADMISSION":
      return { admissionAlerts: true }
    case "SYLLABUS":
      return { syllabusAlerts: true }
    case "ANSWER_KEY":
      return { answerKeyAlerts: true }
    case "BLOG":
      return { blogAlerts: true }
    case "GENERAL":
      return { generalAlerts: true }
  }
}

export function notificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case "JOB":
      return "New Job"
    case "PRIVATE_JOB":
      return "New Private Job"
    case "RESULT":
      return "New Result"
    case "ADMIT_CARD":
      return "New Admit Card"
    case "ADMISSION":
      return "New Admission"
    case "SYLLABUS":
      return "New Syllabus"
    case "ANSWER_KEY":
      return "New Answer Key"
    case "BLOG":
      return "New Blog Post"
    case "GENERAL":
      return "Announcement"
  }
}

export function notificationHref(
  type: string | null | undefined,
  slug: string
): string | null {
  switch (type) {
    case "JOB":
      return `/apply/${slug}`
    case "PRIVATE_JOB":
      return `/private-jobs/${slug}`
    case "RESULT":
      return `/result/${slug}`
    case "ADMIT_CARD":
      return `/admit-card/${slug}`
    case "ADMISSION":
      return `/admission/${slug}`
    case "SYLLABUS":
      return `/syllabus/${slug}`
    case "ANSWER_KEY":
      return `/answer-key/${slug}`
    case "BLOG":
      return `/blog/${slug}`
    default:
      return null
  }
}

export async function existingNotificationHrefs(
  items: { type: string | null; slug: string }[]
): Promise<Map<string, string>> {
  const groups = new Map<string, string[]>()
  for (const item of items) {
    if (!item.type || !item.slug) continue
    if (!notificationHref(item.type, item.slug)) continue
    const arr = groups.get(item.type) || []
    arr.push(item.slug)
    groups.set(item.type, arr)
  }

  const result = new Map<string, string>()
  await Promise.all(
    Array.from(groups.entries()).map(async ([type, slugs]) => {
      let found: { slug: string }[] = []
      switch (type) {
        case "JOB":
          found = await prisma.job.findMany({ where: { slug: { in: slugs } }, select: { slug: true } })
          break
        case "PRIVATE_JOB":
          found = await prisma.privateJob.findMany({ where: { slug: { in: slugs } }, select: { slug: true } })
          break
        case "RESULT":
          found = await prisma.result.findMany({ where: { slug: { in: slugs } }, select: { slug: true } })
          break
        case "ADMIT_CARD":
          found = await prisma.admitCard.findMany({ where: { slug: { in: slugs } }, select: { slug: true } })
          break
        case "ADMISSION":
          found = await prisma.admission.findMany({ where: { slug: { in: slugs } }, select: { slug: true } })
          break
        case "SYLLABUS":
          found = await prisma.syllabus.findMany({ where: { slug: { in: slugs } }, select: { slug: true } })
          break
        case "ANSWER_KEY":
          found = await prisma.answerKey.findMany({ where: { slug: { in: slugs } }, select: { slug: true } })
          break
        case "BLOG":
          found = await prisma.blogPost.findMany({
            where: { slug: { in: slugs }, published: true },
            select: { slug: true },
          })
          break
      }
      const existing = new Set(found.map((f) => f.slug))
      for (const slug of slugs) {
        if (existing.has(slug)) {
          const href = notificationHref(type, slug)
          if (href) result.set(slug, href)
        }
      }
    })
  )
  return result
}

export async function notifyUsers(
  type: NotificationType,
  title: string,
  slug: string,
  message?: string
) {
  try {
    const users = await prisma.notificationPreference.findMany({
      where: prefWhere(type),
      select: { userId: true },
    })

    const text = message || `${notificationTypeLabel(type)} - ${title}`

    // Readers pick these up on their next poll of /api/user/notifications.
    if (users.length > 0) {
      await prisma.userNotification.createMany({
        data: users.map((u) => ({
          userId: u.userId,
          type,
          title,
          slug,
          message: text,
        })),
      })
    }
  } catch (error) {
    console.error("Failed to send notifications:", error)
  }
}