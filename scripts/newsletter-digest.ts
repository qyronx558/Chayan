/**
 * Newsletter Digest Worker
 * ------------------------
 * Builds a digest of recent Jobs, Results and Admit Cards and emails it
 * to every Newsletter subscriber.
 *
 * Run manually:        npx tsx --env-file=.env scripts/newsletter-digest.ts
 * Run via Prefect:     see prefect/newsletter_digest_flow.py
 * Idempotent:          NewsletterSend rows prevent duplicate sends per day.
 */

import { PrismaClient } from "@prisma/client"
import { sendNewsletterDigest, type NewsletterDigestItem } from "../src/lib/email"

const prisma = new PrismaClient()

const MAX_ITEMS = 12
const DEFAULT_LOOKBACK_HOURS = 48
const BATCH_SIZE = 20

function startOfDay(date: Date): Date {
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
  return new Date(Date.now() - DEFAULT_LOOKBACK_HOURS * 3600 * 1000)
}

async function buildItems(since: Date): Promise<NewsletterDigestItem[]> {
  const [jobs, results, admitCards] = await Promise.all([
    prisma.job.findMany({
      where: { createdAt: { gte: since }, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { title: true, slug: true, departmentId: true, location: true, salary: true },
    }),
    prisma.result.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { title: true, slug: true },
    }),
    prisma.admitCard.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
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
  for (const result of results) {
    items.push({
      type: "Result",
      title: result.title,
      detail: "Result has been declared. Check your status now.",
      href: `/result/${result.slug}`,
      createdAtWeight: 1,
    })
  }
  for (const card of admitCards) {
    items.push({
      type: "Admit Card",
      title: card.title,
      detail: "Admit card is available for download.",
      href: `/admit-card/${card.slug}`,
      createdAtWeight: 2,
    })
  }

  items.sort((a, b) => a.createdAtWeight - b.createdAtWeight)

  return items.slice(0, MAX_ITEMS).map(({ type, title, detail, href }) => ({ type, title, detail, href }))
}

async function main() {
  console.log(`[newsletter] started ${new Date().toISOString()}`)

  const today = startOfDay(new Date())
  const existing = await prisma.newsletterSend.findUnique({ where: { sentDate: today } })
  if (existing) {
    console.log(`[newsletter] digest already sent on ${today.toISOString()} — skipping`)
    return
  }

  const since = await getSince()
  const items = await buildItems(since)

  if (items.length === 0) {
    console.log("[newsletter] no new items since last send — nothing to send")
    await prisma.newsletterSend.create({
      data: { sentDate: today, recipients: 0, itemsSent: 0 },
    })
    return
  }

  const subscribers = await prisma.newsletter.findMany({ select: { email: true } })
  console.log(`[newsletter] ${items.length} item(s) queued for ${subscribers.length} subscriber(s)`)

  let sent = 0
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
      if (r.success) sent++
      else failed++
    }
  }

  await prisma.newsletterSend.create({
    data: { sentDate: today, recipients: sent, itemsSent: items.length },
  })

  console.log(`[newsletter] done — ${sent} delivered, ${failed} failed`)
}

main()
  .catch((e) => {
    console.error("[newsletter] failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
