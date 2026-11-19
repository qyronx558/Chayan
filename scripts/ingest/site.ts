import type { IngestKind } from "../../src/lib/ingest/types"
import type { Published } from "./transport"

export const PAGE_KIND: Record<IngestKind, "job" | "result" | "admit-card" | "answer-key" | "admission" | "syllabus"> = {
  jobs: "job",
  results: "result",
  "admit-cards": "admit-card",
  "answer-keys": "answer-key",
  admissions: "admission",
  syllabus: "syllabus",
}

export type Revalidation = { kind: (typeof PAGE_KIND)[IngestKind] | "private-job"; slugs: string[] }

export function groupPublished(published: Published[]): Map<IngestKind, string[]> {
  const byKind = new Map<IngestKind, string[]>()
  for (const p of published) byKind.set(p.kind, [...(byKind.get(p.kind) ?? []), p.entityId])
  return byKind
}

export async function slugsFor(published: Published[]): Promise<Revalidation[]> {
  if (!published.length) return []
  const { prisma } = await import("../../src/lib/prisma")
  const lookups: Record<IngestKind, (ids: string[]) => Promise<{ slug: string }[]>> = {
    jobs: (ids) => prisma.job.findMany({ where: { id: { in: ids } }, select: { slug: true } }),
    results: (ids) => prisma.result.findMany({ where: { id: { in: ids } }, select: { slug: true } }),
    "admit-cards": (ids) => prisma.admitCard.findMany({ where: { id: { in: ids } }, select: { slug: true } }),
    "answer-keys": (ids) => prisma.answerKey.findMany({ where: { id: { in: ids } }, select: { slug: true } }),
    admissions: (ids) => prisma.admission.findMany({ where: { id: { in: ids } }, select: { slug: true } }),
    syllabus: (ids) => prisma.syllabus.findMany({ where: { id: { in: ids } }, select: { slug: true } }),
  }
  const out: Revalidation[] = []
  for (const [kind, ids] of groupPublished(published)) {
    const rows = await lookups[kind](ids)
    out.push({ kind: PAGE_KIND[kind], slugs: rows.map((r) => r.slug) })
  }
  return out
}

export async function siteOrigin(base: string, fetchFn: typeof fetch = fetch): Promise<string> {
  const res = await fetchFn(`${base.replace(/\/+$/, "")}/`, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(30_000) })
  return new URL(res.url).origin
}

export async function revalidateSite(
  changes: Revalidation[],
  log: (m: string) => void,
  env: Record<string, string | undefined> = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  if (!changes.length) return
  const base = (env.APP_URL || env.INGEST_PUBLIC_URL || env.INGEST_API_URL || "").trim()
  const secret = env.CRON_SECRET?.trim()
  if (!base || !secret) {
    log("  APP_URL or CRON_SECRET missing: pages refresh on their normal ISR schedule instead")
    return
  }
  const origin = await siteOrigin(base, fetchFn)
  for (const { kind, slugs } of changes) {
    for (let i = 0; i < Math.max(slugs.length, 1); i += 200) {
      const body = slugs.length ? { kind, slugs: slugs.slice(i, i + 200) } : { kind }
      const res = await fetchFn(`${origin}/api/cron/revalidate`, {
        method: "POST",
        headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
        body: JSON.stringify(body),
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      }).catch((e: unknown) => {
        log(`  ! revalidate ${kind}: ${e instanceof Error ? e.message : e}`)
        return null
      })
      if (res) log(`  revalidate ${kind} (${slugs.length || "hubs"}): HTTP ${res.status}`)
    }
  }
}
