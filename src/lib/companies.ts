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
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase()
  }
}