import { prisma } from "@/lib/prisma"
import { revalidateLocationPages, revalidatePublicContent, type ContentKind, type RevalidateScope } from "@/lib/cache"

const JOB_SCOPE_SELECT = {
  slug: true,
  category: { select: { slug: true } },
  state: { select: { slug: true } },
  district: { select: { slug: true } },
} as const

export async function getJobScope(id: string): Promise<{ slug: string; scope: RevalidateScope } | null> {
  const job = await prisma.job.findUnique({ where: { id }, select: JOB_SCOPE_SELECT })
  if (!job) return null
  return {
    slug: job.slug,
    scope: { categorySlugs: [job.category?.slug], stateSlug: job.state?.slug, districtSlug: job.district?.slug },
  }
}

export async function getPrivateJobScope(id: string): Promise<{ slug: string; scope: RevalidateScope } | null> {
  const job = await prisma.privateJob.findUnique({ where: { id }, select: { slug: true, company: { select: { slug: true } } } })
  if (!job) return null
  return { slug: job.slug, scope: { companySlug: job.company?.slug } }
}

function mergeScopes(a?: RevalidateScope, b?: RevalidateScope): RevalidateScope {
  return {
    categorySlugs: [...(a?.categorySlugs ?? []), ...(b?.categorySlugs ?? [])],
    stateSlug: b?.stateSlug ?? a?.stateSlug,
    districtSlug: b?.districtSlug ?? a?.districtSlug,
    companySlug: b?.companySlug ?? a?.companySlug,
  }
}

export function revalidateScoped(
  kind: ContentKind,
  current: { slug: string; scope: RevalidateScope } | null,
  previous?: { slug: string; scope: RevalidateScope } | null
) {
  if (previous && current && (previous.scope.stateSlug !== current.scope.stateSlug || previous.scope.districtSlug !== current.scope.districtSlug)) {
    revalidatePublicContent(kind, previous.slug, previous.scope)
    revalidatePublicContent(kind, current.slug, current.scope)
    return
  }
  if (previous && current && previous.slug !== current.slug) revalidatePublicContent(kind, previous.slug)
  const target = current ?? previous
  if (!target) return revalidatePublicContent(kind)
  revalidatePublicContent(kind, target.slug, mergeScopes(previous?.scope, current?.scope))
}

export async function revalidateJobById(id: string, previous?: { slug: string; scope: RevalidateScope } | null) {
  revalidateScoped("job", await getJobScope(id), previous)
}

export async function revalidatePrivateJobById(id: string, previous?: { slug: string; scope: RevalidateScope } | null) {
  revalidateScoped("private-job", await getPrivateJobScope(id), previous)
}

export async function getScopeFor(kind: ContentKind, id: string): Promise<RevalidateScope> {
  if (kind === "job") return (await getJobScope(id))?.scope ?? {}
  if (kind === "private-job") return (await getPrivateJobScope(id))?.scope ?? {}
  return {}
}

export async function revalidateJobsByIds(ids: string[]) {
  if (ids.length === 0) return revalidatePublicContent("job")
  const jobs = await prisma.job.findMany({ where: { id: { in: ids } }, select: JOB_SCOPE_SELECT })
  revalidatePublicContent("job", null, { categorySlugs: [...new Set(jobs.map((j) => j.category?.slug))] })
  const places = new Set(jobs.filter((j) => j.state?.slug).map((j) => `${j.state!.slug}|${j.district?.slug ?? ""}`))
  for (const place of places) {
    const [stateSlug, districtSlug] = place.split("|")
    revalidateLocationPages(stateSlug, districtSlug || null)
  }
}
