import { readFileSync } from "node:fs"
import path from "node:path"
import type { PrismaClient, StateType } from "@prisma/client"
import { parseCsv, toSlug } from "@/lib/locations"

export const LOCATIONS_CSV = path.join(process.cwd(), "prisma", "data", "india_districts_statewise.csv")

export type LocationRow = { state: string; stateType: StateType; district: string }

export function readLocationsCsv(file = LOCATIONS_CSV): LocationRow[] {
  const rows = parseCsv(readFileSync(file, "utf8"))
  const [header, ...body] = rows
  const cols = header.map((h) => h.trim().toLowerCase())
  const si = cols.indexOf("state")
  const ti = cols.indexOf("state_type")
  const di = cols.indexOf("district")
  if (si < 0 || di < 0) throw new Error(`${file}: expected columns state, state_type, district`)
  return body.map((r, i) => {
    const state = r[si]?.trim()
    const district = r[di]?.trim()
    const rawType = (ti >= 0 ? r[ti] : "state")?.trim().toLowerCase()
    if (!state || !district) throw new Error(`${file}: row ${i + 2} is missing state or district`)
    const stateType: StateType = rawType === "union_territory" || rawType === "ut" ? "UNION_TERRITORY" : "STATE"
    return { state, stateType, district }
  })
}

/** Old / alternate spellings → canonical slug used in the CSV. */
const STATE_ALIASES: Record<string, string> = {
  orissa: "odisha",
  uttaranchal: "uttarakhand",
  pondicherry: "puducherry",
  "andaman-and-nicobar": "andaman-and-nicobar-islands",
  "nct-of-delhi": "delhi",
  "delhi-nct": "delhi",
  "national-capital-territory-of-delhi": "delhi",
}

export function canonicalStateSlug(name: string): string {
  const slug = toSlug(name)
  return STATE_ALIASES[slug] ?? slug
}

export type SeedSummary = {
  states: { created: number; updated: number; unchanged: number }
  districts: { created: number; updated: number; unchanged: number }
  /** States in the DB that are not in the CSV (reported, never deleted). */
  extraStates: string[]
}

/**
 * Idempotent upsert of every state/UT and district in the CSV.
 * States match by slug (so existing rows such as "Rajasthan" are reused),
 * districts by (stateId, slug). Nothing is ever deleted.
 */
export async function seedLocations(
  prisma: PrismaClient,
  opts: { file?: string; dryRun?: boolean; log?: (msg: string) => void } = {}
): Promise<SeedSummary> {
  const log = opts.log ?? (() => {})
  const rows = readLocationsCsv(opts.file)
  const summary: SeedSummary = {
    states: { created: 0, updated: 0, unchanged: 0 },
    districts: { created: 0, updated: 0, unchanged: 0 },
    extraStates: [],
  }

  const byState = new Map<string, { name: string; type: StateType; districts: string[] }>()
  for (const r of rows) {
    const slug = toSlug(r.state)
    const entry = byState.get(slug) ?? { name: r.state, type: r.stateType, districts: [] }
    entry.districts.push(r.district)
    byState.set(slug, entry)
  }

  const existingStates = await prisma.state.findMany({
    select: { id: true, name: true, slug: true, type: true, districts: { select: { id: true, name: true, slug: true } } },
  })
  const stateBySlug = new Map(existingStates.map((s) => [s.slug, s]))
  // Older rows may use another slug rule or spelling ("Jammu & Kashmir" /
  // jammu-kashmir, "Orissa"…): match on the canonical slug of their name too,
  // so the seed adopts them instead of creating duplicates.
  const stateByNameSlug = new Map<string, (typeof existingStates)[number]>()
  for (const s of existingStates) {
    const key = canonicalStateSlug(s.name)
    if (!stateByNameSlug.has(key)) stateByNameSlug.set(key, s)
  }
  const matched = new Set<string>()

  for (const [slug, entry] of byState) {
    const found = stateBySlug.get(slug) ?? stateByNameSlug.get(slug)
    if (found) matched.add(found.id)
    let stateId = found?.id
    if (!found) {
      summary.states.created++
      if (!opts.dryRun) stateId = (await prisma.state.create({ data: { name: entry.name, slug, type: entry.type } })).id
    } else if (found.name !== entry.name || found.slug !== slug || found.type !== entry.type) {
      summary.states.updated++
      if (!opts.dryRun) await prisma.state.update({ where: { id: found.id }, data: { name: entry.name, slug, type: entry.type } })
    } else summary.states.unchanged++

    const existingDistricts = found?.districts ?? []
    const dBySlug = new Map(existingDistricts.map((d) => [d.slug, d]))
    const toCreate: Array<{ name: string; slug: string; stateId: string }> = []
    for (const name of entry.districts) {
      const dSlug = toSlug(name)
      const d = dBySlug.get(dSlug)
      if (!d) {
        summary.districts.created++
        if (stateId) toCreate.push({ name, slug: dSlug, stateId })
      } else if (d.name !== name) {
        summary.districts.updated++
        if (!opts.dryRun) await prisma.district.update({ where: { id: d.id }, data: { name } })
      } else summary.districts.unchanged++
    }
    if (!opts.dryRun && toCreate.length) {
      await prisma.district.createMany({ data: toCreate, skipDuplicates: true })
    }
    log(`  ${entry.name}: ${entry.districts.length} districts`)
  }

  summary.extraStates = existingStates.filter((s) => !matched.has(s.id)).map((s) => s.name)
  return summary
}
