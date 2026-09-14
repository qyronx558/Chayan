/**
 * Newsletter Digest Worker
 * ------------------------
 * Builds a digest of recent Jobs, Private Jobs, Results, Admit Cards,
 * Answer Keys and Admissions and emails it to every Newsletter subscriber.
 *
 * Run manually:        npx tsx --env-file=.env scripts/newsletter-digest.ts
 * Run via Prefect:     see prefect/newsletter_digest_flow.py
 * Run via cron route:  GET /api/cron/newsletter (Bearer $CRON_SECRET)
 * Idempotent:          NewsletterSend rows prevent duplicate sends per day.
 */

import { prisma } from "../src/lib/prisma"
import { runNewsletterDigest } from "../src/lib/newsletter-digest"

async function main() {
  console.log(`[newsletter] started ${new Date().toISOString()}`)

  const result = await runNewsletterDigest()

  if (result.status === "skipped-already-sent") {
    console.log("[newsletter] digest already sent today — skipping")
  } else if (result.status === "skipped-no-items") {
    console.log("[newsletter] no new items since last send — nothing to send")
  } else {
    console.log(
      `[newsletter] done — ${result.items} item(s) to ${result.subscribers} subscriber(s): ${result.delivered} delivered, ${result.failed} failed`
    )
  }
}

main()
  .catch((e) => {
    console.error("[newsletter] failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect().then(() => process.exit(0)))
