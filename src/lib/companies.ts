import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"

export async function findOrCreateCompany(name: string) {
  const trimmed = name.trim()
  const baseSlug = slugify(trimmed) || `company-${Date.now().toString(36)}`
  const existing = await prisma.company.findUnique({ where: { slug: baseSlug } })
  const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug
  return prisma.company.upsert({
    where: { name: trimmed },
    update: {},
    create: { name: trimmed, slug },
  })
}