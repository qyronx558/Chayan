import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { parseJobLevel, resolveJobLocation, toSlug, type JobLocationInput, type ResolvedJobLocation } from "@/lib/locations"

/** Bulk-import helper: resolves a district typed by name/slug within a state. */
export async function findDistrictIdByName(stateId: string, name: string): Promise<string | null> {
  const n = name.trim()
  if (!n) return null
  const d = await prisma.district.findFirst({
    where: { stateId, OR: [{ name: { equals: n, mode: "insensitive" } }, { slug: toSlug(n) }, { id: n }] },
    select: { id: true },
  })
  return d?.id ?? null
}

/**
 * Resolves + validates a job's location against the database:
 * the state must exist and the district must belong to that state.
 * Applies to ADMIN and SUPER_ADMIN alike.
 */
export async function validateJobLocation(
  input: JobLocationInput
): Promise<{ ok: true; value: ResolvedJobLocation } | { ok: false; error: string }> {
  const resolved = resolveJobLocation(input)
  if (!resolved.ok) return { ok: false, error: resolved.error }
  const { stateId, districtId } = resolved.value

  if (stateId) {
    const state = await prisma.state.findUnique({ where: { id: stateId }, select: { id: true } })
    if (!state) return { ok: false, error: "Selected State no longer exists. Please refresh and select again." }
  }
  if (districtId) {
    const district = await prisma.district.findUnique({ where: { id: districtId }, select: { stateId: true } })
    if (!district) return { ok: false, error: "Selected District no longer exists. Please refresh and select again." }
    if (district.stateId !== stateId) return { ok: false, error: "Selected District does not belong to the selected State." }
  }
  return resolved
}

/**
 * Location filters for the government-jobs listing.
 *
 * Exact filters (listing page dropdowns):
 *   level=central|state|district, state=<slug>, district=<slug>
 * Eligibility filters (state / district SEO pages): everything a resident can apply for
 *   eligibleState=<slug>                       → central + that state's state-level jobs
 *   eligibleState=<slug>&eligibleDistrict=<slug> → … + that district's district-level jobs
 */
export function buildJobLocationWhere(params: URLSearchParams): Prisma.JobWhereInput[] {
  const and: Prisma.JobWhereInput[] = []
  const level = parseJobLevel(params.get("level"))
  const state = params.get("state")?.trim()
  const district = params.get("district")?.trim()
  if (level) and.push({ jobLevel: level })
  if (state) and.push({ state: { slug: state } })
  if (district) and.push({ district: state ? { slug: district, state: { slug: state } } : { slug: district } })

  const eligibleState = params.get("eligibleState")?.trim()
  const eligibleDistrict = params.get("eligibleDistrict")?.trim()
  if (eligibleState) {
    const or: Prisma.JobWhereInput[] = [
      { jobLevel: "CENTRAL" },
      { jobLevel: "STATE", state: { slug: eligibleState } },
    ]
    if (eligibleDistrict) {
      or.push({ jobLevel: "DISTRICT", district: { slug: eligibleDistrict, state: { slug: eligibleState } } })
    }
    and.push({ OR: or })
  }
  return and
}

/** Finds a state by slug, falling back to id (admin pickers pass ids). */
export function findStateBySlugOrId(slugOrId: string) {
  return prisma.state.findFirst({
    where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    select: { id: true, name: true, slug: true, type: true },
  })
}
