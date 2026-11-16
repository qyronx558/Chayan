import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"

export async function findOrCreateCompany(name: string, website?: string | null) {
  const trimmed = name.trim()
  const baseSlug = slugify(trimmed) || `company-${Date.now().toString(36)}`
  const existing = await prisma.company.findUnique({ where: { slug: baseSlug } })
  const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug
  const cleanWebsite = website?.trim() ? normalizeWebsite(website.trim()) : undefined
  return prisma.company.upsert({
    where: { name: trimmed },
    update: cleanWebsite ? { website: cleanWebsite } : {},
    create: { name: trimmed, slug, website: cleanWebsite },
  })
}

export function normalizeWebsite(raw: string): string {
  let v = raw.trim()
  if (!v) return v
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`
  try {
    const u = new URL(v)
    return `${u.protocol}//${u.hostname.replace(/^www\./, "")}`
  } catch {
    return v
  }
}

export function domainOf(raw?: string | null): string {
  if (!raw) return ""
  try {
    const v = raw.trim().startsWith("http") ? raw.trim() : `https://${raw.trim()}`
    return new URL(v).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return raw.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].toLowerCase()
  }
}
/**
 * Batch version of findOrCreateCompany for bulk imports (hundreds of boards at
 * once): a few queries instead of a round trip per company. Returns name → id.
 */
export async function findOrCreateCompanies(entries: { name: string; website?: string | null }[]): Promise<Map<string, string>> {
  const wanted = new Map<string, string | undefined>()
  for (const e of entries) {
    const name = e.name.trim()
    if (name && !wanted.has(name)) wanted.set(name, e.website?.trim() ? normalizeWebsite(e.website.trim()) : undefined)
  }
  const names = [...wanted.keys()]
  const ids = new Map<string, string>()
  if (!names.length) return ids
  const existing = await prisma.company.findMany({ where: { name: { in: names } }, select: { id: true, name: true } })
  for (const c of existing) ids.set(c.name, c.id)
  const missing = names.filter((n) => !ids.has(n))
  if (missing.length) {
    const takenSlugs = new Set(
      (await prisma.company.findMany({ where: { slug: { in: missing.map((n) => slugify(n)).filter(Boolean) } }, select: { slug: true } })).map((c) => c.slug)
    )
    const suffix = Date.now().toString(36)
    await prisma.company.createMany({
      data: missing.map((name, i) => {
        const base = slugify(name) || `company-${suffix}-${i}`
        const slug = takenSlugs.has(base) ? `${base}-${suffix}${i}` : base
        takenSlugs.add(slug)
        return { name, slug, website: wanted.get(name) }
      }),
      skipDuplicates: true,
    })
    const created = await prisma.company.findMany({ where: { name: { in: missing } }, select: { id: true, name: true } })
    for (const c of created) ids.set(c.name, c.id)
  }
  return ids
}
