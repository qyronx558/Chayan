/**
 * Bulk upload import engine (server-only).
 * Departments / categories are resolved FIRST per row (auto-created when
 * missing), then the content row is validated with the existing zod schemas
 * and inserted. Duplicates (same slug or title) are skipped - existing
 * records are never modified.
 */
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { findDistrictIdByName, validateJobLocation } from "@/lib/locations-server"
import {
  jobSchema,
  resultSchema,
  admitCardSchema,
  admissionSchema,
  syllabusSchema,
  answerKeySchema,
  categorySchema,
  departmentSchema,
} from "@/lib/validations"
import { Prisma } from "@prisma/client"
import type { BulkModuleId } from "./modules"

export interface BulkRowError {
  row: number
  message: string
}

export interface BulkCounters {
  newDepartments: number
  newCategories: number
}

export interface BulkImportOutcome {
  imported: number
  skipped: number
  errors: BulkRowError[]
}

export type ContentModule = Exclude<BulkModuleId, "categories" | "departments">

/** Per-row result, reported through `ImportContentOptions.onRow`. */
export type RowOutcome =
  | { status: "created"; id: string; slug: string }
  | { status: "duplicate" }
  | { status: "error"; message: string }

export interface ImportContentOptions {
  /**
   * Moderation state for created rows. Bulk upload (super admin) publishes
   * straight away; the ingest bot passes a per-row decision.
   */
  moderation?: "APPROVED" | "PENDING" | ((row: Record<string, unknown>, index: number) => "APPROVED" | "PENDING")
  /** Called once per input row with what happened to it. */
  onRow?: (index: number, outcome: RowOutcome) => void
}

export const REVALIDATE_KIND: Record<
  ContentModule,
  "job" | "result" | "admit-card" | "admission" | "answer-key" | "syllabus"
> = {
  jobs: "job",
  results: "result",
  "admit-cards": "admit-card",
  admissions: "admission",
  syllabus: "syllabus",
  "answer-keys": "answer-key",
}

export const ENTITY_LABEL: Record<BulkModuleId, string> = {
  jobs: "Job",
  results: "Result",
  "admit-cards": "AdmitCard",
  admissions: "Admission",
  syllabus: "Syllabus",
  "answer-keys": "AnswerKey",
  categories: "Category",
  departments: "Department",
}

// ─── cell normalizers ─────────────────────────────────────────────

function cellStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined
  if (v instanceof Date) return isNaN(v.getTime()) ? undefined : v.toISOString()
  const s = String(v).trim()
  return s === "" ? undefined : s
}

function cellDate(v: unknown): Date | undefined {
  if (v === null || v === undefined || v === "") return undefined
  // Raw numbers in a date column are almost certainly data entry mistakes
  // (real dates arrive as ISO strings - the client parses with cellDates).
  if (typeof v === "number") return undefined
  const d = v instanceof Date ? v : new Date(String(v).trim())
  return isNaN(d.getTime()) ? undefined : d
}

function cellInt(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, "").trim())
  return Number.isInteger(n) && n > 0 ? n : undefined
}

/** Content status: "Approved" (any case) means PUBLISHED, matching manual admin flow. */
function contentStatus(v: unknown): string | undefined {
  const s = cellStr(v)
  if (!s) return undefined
  return s.toLowerCase() === "approved" ? "PUBLISHED" : s
}

/** Important-dates map ({ "Exam Date": "2026-12-01" }) - only plain string values survive. */
function cellDates(v: unknown): Record<string, string> | null {
  if (!v || typeof v !== "object" || Array.isArray(v) || v instanceof Date) return null
  const out: Record<string, string> = {}
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    const label = k.trim().slice(0, 80)
    const value = cellStr(raw)
    if (label && value) out[label] = value.slice(0, 120)
  }
  return Object.keys(out).length ? out : null
}

function jobStatus(v: unknown): "ACTIVE" | "EXPIRED" | "UPCOMING" {
  const s = cellStr(v)?.toUpperCase()
  return s === "ACTIVE" || s === "EXPIRED" || s === "UPCOMING" ? s : "ACTIVE"
}

function uniqueSlug(base: string): string {
  const s = slugify(base).slice(0, 120)
  return s || `item-${Date.now().toString(36)}`
}

// ─── department / category resolution (created first, then reused) ──

interface RefCache {
  byName: Map<string, string> // lower-cased name -> id
  slugs: Set<string>
}

async function ensureDepartment(
  name: string,
  cache: RefCache,
  userId: string,
  counters: BulkCounters
): Promise<string> {
  const hit = cache.byName.get(name.toLowerCase())
  if (hit) return hit
  const want = uniqueSlug(name)
  const bySlug = await prisma.department.findUnique({ where: { slug: want } })
  if (bySlug) {
    cache.byName.set(name.toLowerCase(), bySlug.id)
    return bySlug.id
  }
  try {
    const created = await prisma.department.create({
      data: {
        name,
        slug: want,
        description: `${name} - results and updates`,
        createdBy: { connect: { id: userId } },
      },
    })
    cache.byName.set(name.toLowerCase(), created.id)
    cache.slugs.add(want)
    counters.newDepartments++
    return created.id
  } catch (e) {
    // Race-safe: another row created the same slug concurrently.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const again = await prisma.department.findUnique({ where: { slug: want } })
      if (again) {
        cache.byName.set(name.toLowerCase(), again.id)
        return again.id
      }
    }
    throw e
  }
}

async function ensureCategory(name: string, cache: RefCache, counters: BulkCounters): Promise<string> {
  const hit = cache.byName.get(name.toLowerCase())
  if (hit) return hit
  const want = uniqueSlug(name)
  const bySlug = await prisma.category.findUnique({ where: { slug: want } })
  if (bySlug) {
    cache.byName.set(name.toLowerCase(), bySlug.id)
    return bySlug.id
  }
  try {
    const created = await prisma.category.create({
      data: { name, slug: want, description: `${name} Jobs in India` },
    })
    cache.byName.set(name.toLowerCase(), created.id)
    cache.slugs.add(want)
    counters.newCategories++
    return created.id
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const again = await prisma.category.findUnique({ where: { slug: want } })
      if (again) {
        cache.byName.set(name.toLowerCase(), again.id)
        return again.id
      }
    }
    throw e
  }
}

// ─── taxonomy (categories / departments) ──────────────────────────

export async function importTaxonomy(
  moduleId: "categories" | "departments",
  rows: Record<string, unknown>[]
): Promise<BulkImportOutcome> {
  const schema = moduleId === "categories" ? categorySchema : departmentSchema
  const existing =
    moduleId === "categories"
      ? await prisma.category.findMany({ select: { slug: true, name: true } })
      : await prisma.department.findMany({ select: { slug: true, name: true } })
  const seenSlugs = new Set(existing.map((r) => r.slug))
  const seenNames = new Set(existing.map((r) => r.name.trim().toLowerCase()))
  const fileSlugs = new Set<string>()
  const fileNames = new Set<string>()

  let imported = 0
  let skipped = 0
  const errors: BulkRowError[] = []

  for (let i = 0; i < rows.length; i++) {
    const excelRow = i + 2
    const r = rows[i]
    const name = cellStr(r.name)
    if (!name) {
      errors.push({ row: excelRow, message: "Name is required." })
      continue
    }
    const slug = uniqueSlug(cellStr(r.slug) || name)
    const key = name.toLowerCase()
    if (seenSlugs.has(slug) || seenNames.has(key) || fileSlugs.has(slug) || fileNames.has(key)) {
      skipped++
      continue
    }
    const validation = schema.safeParse({ name, slug, description: cellStr(r.description) ?? null })
    if (!validation.success) {
      errors.push({ row: excelRow, message: validation.error.issues[0].message })
      continue
    }
    try {
      if (moduleId === "categories") {
        await prisma.category.create({ data: validation.data })
      } else {
        await prisma.department.create({ data: validation.data })
      }
      seenSlugs.add(slug)
      seenNames.add(key)
      fileSlugs.add(slug)
      fileNames.add(key)
      imported++
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") skipped++
      else errors.push({ row: excelRow, message: e instanceof Error ? e.message : "Insert failed." })
    }
  }
  return { imported, skipped, errors }
}

// ─── content modules (jobs / results / admit-cards / admissions / syllabus / answer-keys) ──

export async function importContent(
  moduleId: ContentModule,
  rows: Record<string, unknown>[],
  userId: string,
  counters: BulkCounters,
  opts: ImportContentOptions = {}
): Promise<BulkImportOutcome> {
  const moderationFor = (row: Record<string, unknown>, index: number) =>
    typeof opts.moderation === "function" ? opts.moderation(row, index) : (opts.moderation ?? "APPROVED")
  const report = (index: number, outcome: RowOutcome) => opts.onRow?.(index, outcome)
  const [departments, categories, states] = await Promise.all([
    prisma.department.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    moduleId === "jobs" ? prisma.state.findMany({ select: { id: true, name: true } }) : Promise.resolve([]),
  ])
  const deptCache: RefCache = {
    byName: new Map(departments.map((d) => [d.name.trim().toLowerCase(), d.id])),
    slugs: new Set(),
  }
  const catCache: RefCache = {
    byName: new Map(categories.map((c) => [c.name.trim().toLowerCase(), c.id])),
    slugs: new Set(),
  }
  const stateByName = new Map(states.map((s) => [s.name.trim().toLowerCase(), s.id]))

  // Preload existing slugs + titles for duplicate detection (one query, not per row).
  const selectSlugTitle = { select: { slug: true, title: true } } as const
  const existing =
    moduleId === "jobs"
      ? await prisma.job.findMany(selectSlugTitle)
      : moduleId === "results"
        ? await prisma.result.findMany(selectSlugTitle)
        : moduleId === "admit-cards"
          ? await prisma.admitCard.findMany(selectSlugTitle)
          : moduleId === "admissions"
            ? await prisma.admission.findMany(selectSlugTitle)
            : moduleId === "syllabus"
              ? await prisma.syllabus.findMany(selectSlugTitle)
              : await prisma.answerKey.findMany(selectSlugTitle)
  const seenSlugs = new Set(existing.map((r) => r.slug))
  const seenTitles = new Set(existing.map((r) => r.title.trim().toLowerCase()))

  let imported = 0
  let skipped = 0
  const errors: BulkRowError[] = []

  for (let i = 0; i < rows.length; i++) {
    const excelRow = i + 2
    const r = rows[i]
    try {
      const title = cellStr(r.title)
      if (!title) {
        errors.push({ row: excelRow, message: "Title is required." })
        report(i, { status: "error", message: "Title is required." })
        continue
      }
      const slug = uniqueSlug(cellStr(r.slug) || title)
      if (seenSlugs.has(slug) || seenTitles.has(title.toLowerCase())) {
        skipped++ // duplicate - leave existing record untouched
        report(i, { status: "duplicate" })
        continue
      }

      const deptName = cellStr(r.department)
      const catName = cellStr(r.category)
      if (!deptName || !catName) {
        errors.push({ row: excelRow, message: "Department and Category are required." })
        report(i, { status: "error", message: "Department and Category are required." })
        continue
      }

      // Departments / categories first so FK connects can never fail.
      const departmentId = await ensureDepartment(deptName, deptCache, userId, counters)
      const categoryId = await ensureCategory(catName, catCache, counters)

      const created = await createContentRow(moduleId, r, {
        title,
        slug,
        departmentId,
        categoryId,
        userId,
        stateByName,
        moderation: moderationFor(r, i),
      })
      if (typeof created === "string") {
        errors.push({ row: excelRow, message: created })
        report(i, { status: "error", message: created })
        continue
      }
      seenSlugs.add(slug)
      seenTitles.add(title.toLowerCase())
      imported++
      report(i, { status: "created", id: created.id, slug })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        skipped++
        report(i, { status: "duplicate" })
      } else {
        const message = e instanceof Error ? e.message : "Insert failed."
        errors.push({ row: excelRow, message })
        report(i, { status: "error", message })
      }
    }
  }
  return { imported, skipped, errors }
}

interface ResolvedRefs {
  title: string
  slug: string
  departmentId: string
  categoryId: string
  userId: string
  stateByName: Map<string, string>
  moderation: "APPROVED" | "PENDING"
}

/** Returns the created id on success, or an error message for the row. */
async function createContentRow(
  moduleId: ContentModule,
  r: Record<string, unknown>,
  refs: ResolvedRefs
): Promise<{ id: string } | string> {
  const { title, slug, departmentId, categoryId, userId } = refs
  // Approved rows count as reviewed by the uploader; pending rows wait for a reviewer.
  const review =
    refs.moderation === "APPROVED"
      ? { moderation: "APPROVED" as const, reviewedById: userId, reviewedAt: new Date() }
      : { moderation: "PENDING" as const }
  const base = {
    title,
    slug,
    department: { connect: { id: departmentId } },
    category: { connect: { id: categoryId } },
    createdBy: { connect: { id: userId } },
  } as const

  switch (moduleId) {
    case "jobs": {
      const stateName = cellStr(r.state)
      const stateId = stateName ? refs.stateByName.get(stateName.toLowerCase()) : undefined
      const districtName = cellStr(r.district)
      const districtId = districtName && stateId ? await findDistrictIdByName(stateId, districtName) : null
      if (districtName && !districtId) return `District "${districtName}" not found in ${stateName ?? "the selected state"}`
      const loc = await validateJobLocation({ jobLevel: cellStr(r.jobLevel) ?? cellStr(r.level), stateId: stateId ?? null, districtId })
      if (!loc.ok) return loc.error
      const validation = jobSchema.safeParse({
        title,
        slug,
        departmentId,
        categoryId,
        stateId: stateId ?? null,
        advertisementNo: cellStr(r.advertisementNo) ?? null,
        totalVacancies: cellInt(r.totalVacancies) ?? null,
        salary: cellStr(r.salary) ?? null,
        location: cellStr(r.location) ?? null,
        ageLimit: cellStr(r.ageLimit) ?? null,
        ageRelaxation: cellStr(r.ageRelaxation) ?? null,
        education: cellStr(r.education) ?? null,
        selectionProcess: cellStr(r.selectionProcess) ?? null,
        applicationFee: cellStr(r.applicationFee) ?? null,
        documentsRequired: cellStr(r.documentsRequired) ?? null,
        howToApply: cellStr(r.howToApply) ?? null,
        officialNotification: cellStr(r.officialNotification) ?? null,
        officialWebsite: cellStr(r.officialWebsite) ?? null,
        applyLink: cellStr(r.applyLink) ?? null,
        status: jobStatus(r.status),
        experience: cellStr(r.experience) ?? null,
        importantDates: cellDates(r.importantDates),
        startDate: cellDate(r.startDate) ?? null,
        lastDate: cellDate(r.lastDate) ?? null,
      })
      if (!validation.success) return validation.error.issues[0].message
      const v = validation.data
      const row = await prisma.job.create({
        select: { id: true },
        data: {
          ...base,
          jobLevel: loc.value.jobLevel,
          ...(loc.value.stateId ? { state: { connect: { id: loc.value.stateId } } } : {}),
          ...(loc.value.districtId ? { district: { connect: { id: loc.value.districtId } } } : {}),
          advertisementNo: v.advertisementNo,
          totalVacancies: v.totalVacancies,
          salary: v.salary,
          location: v.location,
          ageLimit: v.ageLimit,
          ageRelaxation: v.ageRelaxation,
          education: v.education,
          selectionProcess: v.selectionProcess,
          applicationFee: v.applicationFee,
          documentsRequired: v.documentsRequired,
          howToApply: v.howToApply,
          officialNotification: v.officialNotification,
          officialWebsite: v.officialWebsite,
          applyLink: v.applyLink,
          status: v.status,
          experience: v.experience,
          ...(v.importantDates ? { importantDates: v.importantDates as Prisma.InputJsonValue } : {}),
          ...(cellStr(r.summary) ? { summary: cellStr(r.summary) } : {}),
          startDate: v.startDate,
          lastDate: v.lastDate,
          ...review,
        },
      })
      return row
    }
    case "results": {
      const validation = resultSchema.safeParse({
        title,
        slug,
        departmentId,
        categoryId,
        description: cellStr(r.description) ?? null,
        pdfUrl: cellStr(r.pdfUrl) ?? null,
        resultDate: cellDate(r.resultDate) ?? null,
        status: contentStatus(r.status) ?? null,
      })
      if (!validation.success) return validation.error.issues[0].message
      const v = validation.data
      const row = await prisma.result.create({
        select: { id: true },
        data: {
          ...base,
          description: v.description,
          pdfUrl: v.pdfUrl,
          resultDate: v.resultDate,
          status: v.status,
          ...review,
        },
      })
      return row
    }
    case "admit-cards": {
      const validation = admitCardSchema.safeParse({
        title,
        slug,
        departmentId,
        categoryId,
        description: cellStr(r.description) ?? null,
        downloadUrl: cellStr(r.downloadUrl) ?? null,
        examDate: cellDate(r.examDate) ?? null,
        status: contentStatus(r.status) ?? null,
      })
      if (!validation.success) return validation.error.issues[0].message
      const v = validation.data
      const row = await prisma.admitCard.create({
        select: { id: true },
        data: {
          ...base,
          description: v.description,
          downloadUrl: v.downloadUrl,
          examDate: v.examDate,
          status: v.status,
          ...review,
        },
      })
      return row
    }
    case "admissions": {
      const validation = admissionSchema.safeParse({
        title,
        slug,
        departmentId,
        categoryId,
        description: cellStr(r.description) ?? null,
        applicationFee: cellStr(r.applicationFee) ?? null,
        startDate: cellDate(r.startDate) ?? null,
        lastDate: cellDate(r.lastDate) ?? null,
        pdfUrl: cellStr(r.pdfUrl) ?? null,
        status: contentStatus(r.status) ?? null,
      })
      if (!validation.success) return validation.error.issues[0].message
      const v = validation.data
      const row = await prisma.admission.create({
        select: { id: true },
        data: {
          ...base,
          description: v.description,
          applicationFee: v.applicationFee,
          startDate: v.startDate,
          lastDate: v.lastDate,
          pdfUrl: v.pdfUrl,
          status: v.status,
          ...review,
        },
      })
      return row
    }
    case "syllabus": {
      const validation = syllabusSchema.safeParse({
        title,
        slug,
        departmentId,
        categoryId,
        description: cellStr(r.description) ?? null,
        subjects: cellStr(r.subjects) ?? null,
        pdfUrl: cellStr(r.pdfUrl) ?? null,
        status: contentStatus(r.status) ?? null,
      })
      if (!validation.success) return validation.error.issues[0].message
      const v = validation.data
      const row = await prisma.syllabus.create({
        select: { id: true },
        data: {
          ...base,
          description: v.description,
          subjects: v.subjects,
          pdfUrl: v.pdfUrl,
          status: v.status,
          ...review,
        },
      })
      return row
    }
    case "answer-keys": {
      const validation = answerKeySchema.safeParse({
        title,
        slug,
        departmentId,
        categoryId,
        description: cellStr(r.description) ?? null,
        pdfUrl: cellStr(r.pdfUrl) ?? null,
        status: contentStatus(r.status) ?? null,
      })
      if (!validation.success) return validation.error.issues[0].message
      const v = validation.data
      const row = await prisma.answerKey.create({
        select: { id: true },
        data: {
          ...base,
          description: v.description,
          pdfUrl: v.pdfUrl,
          status: v.status,
          ...review,
        },
      })
      return row
    }
  }
}
