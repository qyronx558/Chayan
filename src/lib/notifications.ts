import { prisma } from "@/lib/prisma"
import { broadcastNotification } from "@/lib/notification-stream"
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

    let broadcast: {
      id?: string
      type: NotificationType
      title: string
      slug: string
      message: string | null
      read: boolean
      createdAt: string
    } = {
      type,
      title,
      slug,
      message: text,
      read: false,
      createdAt: new Date().toISOString(),
    }

    if (users.length > 0) {
      const created = await prisma.userNotification.createManyAndReturn({
        data: users.map((u) => ({
          userId: u.userId,
          type,
          title,
          slug,
          message: text,
        })),
        select: { id: true, type: true, title: true, slug: true, message: true, read: true, createdAt: true },
      })
      if (created[0]) {
        broadcast = {
          id: created[0].id,
          type: created[0].type as NotificationType,
          title: created[0].title,
          slug: created[0].slug,
          message: created[0].message,
          read: created[0].read,
          createdAt: created[0].createdAt.toISOString(),
        }
      }
    }

    broadcastNotification(broadcast)
  } catch (error) {
    console.error("Failed to send notifications:", error)
  }
}