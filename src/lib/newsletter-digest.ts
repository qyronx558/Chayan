import { prisma } from "@/lib/prisma"
import { sendNewsletterDigest, type NewsletterDigestItem } from "@/lib/email"

export const DIGEST_MAX_ITEMS = 12
export const DIGEST_LOOKBACK_HOURS = 48
const BATCH_SIZE = 20

export function digestStartOfDay(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

async function getSince(): Promise<Date> {
  const lastSend = await prisma.newsletterSend.findFirst({
    orderBy: { sentDate: "desc" },
  })
  if (lastSend) {
    return new Date(lastSend.sentAt.getTime() + 60 * 1000)
  }
  return new Date(Date.now() - DIGEST_LOOKBACK_HOURS * 3600 * 1000)
}

/**
 * Collects fresh updates across every public content type:
 * govt jobs, private jobs, results, admit cards, answer keys, admissions.
 */
export async function buildDigestItems(since: Date): Promise<NewsletterDigestItem[]> {
  const [jobs, privateJobs, results, admitCards, answerKeys, admissions] = await Promise.all([
    prisma.job.findMany({
      where: { createdAt: { gte: since }, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: DIGEST_MAX_ITEMS,
      select: { title: true, slug: true, location: true, salary: true },
    }),
    prisma.privateJob.findMany({
      where: { createdAt: { gte: since }, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: DIGEST_MAX_ITEMS,
      select: { title: true, slug: true, location: true, salary: true },
    }),
    prisma.result.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: DIGEST_MAX_ITEMS,
      select: { title: true, slug: true },
    }),
    prisma.admitCard.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: DIGEST_MAX_ITEMS,
      select: { title: true, slug: true },
    }),
    prisma.answerKey.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: DIGEST_MAX_ITEMS,
      select: { title: true, slug: true },
    }),
    prisma.admission.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: DIGEST_MAX_ITEMS,
      select: { title: true, slug: true },
    }),
  ])

  const items: (NewsletterDigestItem & { createdAtWeight: number })[] = []

  for (const job of jobs) {
    items.push({
      type: "New Job",
      title: job.title,
      detail: [job.location, job.salary].filter(Boolean).join(" | ") || "New government job notification released.",
      href: `/apply/${job.slug}`,
      createdAtWeight: 0,
    })
  }
  for (const job of privateJobs) {
    items.push({
      type: "Private Job",
      title: job.title,
      detail: [job.location, job.salary].filter(Boolean).join(" | ") || "New private job opening.",
      href: `/private-jobs/${job.slug}`,
      createdAtWeight: 1,
    })
  }
  for (const result of results) {
    items.push({
      type: "Result",
      title: result.title,
      detail: "Result has been declared. Check your status now.",
      href: `/result/${result.slug}`,
      createdAtWeight: 2,
    })
  }
  for (const card of admitCards) {
    items.push({
      type: "Admit Card",
      title: card.title,
      detail: "Admit card is available for download.",
      href: `/admit-card/${card.slug}`,
      createdAtWeight: 3,
    })
  }
  for (const key of answerKeys) {
    items.push({
      type: "Answer Key",
      title: key.title,
      detail: "Answer key released. Download it and raise objections if needed.",
      href: `/answer-key/${key.slug}`,
      createdAtWeight: 4,
    })
  }
  for (const admission of admissions) {
    items.push({
      type: "Admission",
      title: admission.title,
      detail: "New admission notification released. Check eligibility and apply.",
      href: `/admission/${admission.slug}`,
      createdAtWeight: 5,
    })
  }

  items.sort((a, b) => a.createdAtWeight - b.createdAtWeight)

  return items
    .slice(0, DIGEST_MAX_ITEMS)
    .map(({ type, title, detail, href }) => ({ type, title, detail, href }))
}

export interface DigestResult {
  status: "sent" | "skipped-already-sent" | "skipped-no-items"
  items: number
  subscribers: number
  delivered: number
  failed: number
}

/**
 * Runs one digest cycle. Idempotent: a NewsletterSend row per day
 * prevents duplicate sends even if triggered twice.
 */
export async function runNewsletterDigest(): Promise<DigestResult> {
  const today = digestStartOfDay(new Date())
  const existing = await prisma.newsletterSend.findUnique({ where: { sentDate: today } })
  if (existing) {
    return { status: "skipped-already-sent", items: 0, subscribers: 0, delivered: 0, failed: 0 }
  }

  const since = await getSince()
  const items = await buildDigestItems(since)

  if (items.length === 0) {
    await prisma.newsletterSend.create({
      data: { sentDate: today, recipients: 0, itemsSent: 0 },
    })
    return { status: "skipped-no-items", items: 0, subscribers: 0, delivered: 0, failed: 0 }
  }

  const subscribers = await prisma.newsletter.findMany({ select: { email: true } })

  let delivered = 0
  let failed = 0

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map((s) =>
        sendNewsletterDigest(s.email, items).catch((e) => {
          console.error(`[newsletter] send failed for ${s.email}:`, e)
          return { success: false }
        })
      )
    )
    for (const r of results) {
      if (r.success) delivered++
      else failed++
    }
  }

  await prisma.newsletterSend.create({
    data: { sentDate: today, recipients: delivered, itemsSent: items.length },
  })

  return { status: "sent", items: items.length, subscribers: subscribers.length, delivered, failed }
}
