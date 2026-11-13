import { z } from "zod"

const text = (max: number) =>
  z.preprocess((v) => (typeof v === "string" ? v.trim() || null : v ?? null), z.string().max(max).nullable())
const isoDate = z.preprocess(
  (v) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 10) : null),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
)
const url = z.preprocess((v) => (typeof v === "string" && /^https?:\/\//i.test(v.trim()) ? v.trim() : null), z.url({ protocol: /^https?$/ }).max(1000).nullable())
const positiveInt = z.preprocess((v) => {
  if (v === null || v === undefined || v === "") return null
  const n = typeof v === "number" ? v : Number(String(v).replace(/[,\s]/g, ""))
  return Number.isInteger(n) && n > 0 ? n : null
}, z.number().int().positive().max(1_000_000).nullable())

/**
 * What the LLM must return for one notice. Every factual field has a matching
 * `evidence` entry: a short verbatim quote from the notice. Grounding drops any
 * field whose quote (or value) cannot be found in the source text.
 */
export const llmExtractionSchema = z.object({
  kind: z.enum(["jobs", "results", "admit-cards", "answer-keys", "admissions", "syllabus", "irrelevant"]),
  title: text(200),
  department: text(150),
  category: text(80),
  summary: text(1200),
  advertisementNo: text(120),
  totalVacancies: positiveInt,
  salary: text(300),
  ageLimit: text(300),
  ageRelaxation: text(600),
  education: text(1200),
  experience: text(600),
  selectionProcess: text(800),
  applicationFee: text(600),
  documentsRequired: text(1200),
  howToApply: text(1500),
  startDate: isoDate,
  lastDate: isoDate,
  examDate: isoDate,
  resultDate: isoDate,
  importantDates: z
    .array(z.object({ label: z.string().trim().min(2).max(80), date: z.string().trim().min(4).max(60) }))
    .max(12)
    .nullable()
    .catch(null),
  applyLink: url,
  officialWebsite: url,
  evidence: z.record(z.string(), z.string().max(400)).catch({}),
  confidence: z.preprocess((v) => (typeof v === "number" ? Math.min(1, Math.max(0, v)) : 0.5), z.number()),
})
export type LlmExtraction = z.infer<typeof llmExtractionSchema>

/** One post sent from the scraper to POST /api/cron/ingest. */
export const ingestPostSchema = z.object({
  sourceId: z.string().min(1).max(120),
  sourceUrl: z.url({ protocol: /^https?$/ }).max(1000),
  /** Official PDF / notice the post is built from. */
  officialNotification: z.url({ protocol: /^https?$/ }).max(1000),
  level: z.enum(["CENTRAL", "STATE", "DISTRICT"]),
  state: z.string().max(100).nullable().optional(),
  district: z.string().max(100).nullable().optional(),
  allowHosts: z.array(z.string().max(120)).max(20).optional(),
  /**
   * Machine-readable text of the notice (PDF text layer / HTML). Empty for
   * scanned PDFs. The server re-runs grounding + quality on it, so the
   * scraper's own checks are never trusted blindly.
   */
  sourceText: z.string().max(40_000).default(""),
  links: z.array(z.object({ url: z.string().max(1000), label: z.string().max(300) })).max(60).default([]),
  extraction: llmExtractionSchema,
})
export type IngestPost = z.infer<typeof ingestPostSchema>

export const ingestBatchSchema = z.object({
  items: z.array(ingestPostSchema).min(1).max(25),
})

export const seenRequestSchema = z.object({
  urls: z.array(z.string().min(1).max(1000)).min(1).max(500),
})

export const runReportSchema = z.object({
  source: z.string().min(1).max(120),
  startedAt: z.iso.datetime(),
  imported: z.number().int().min(0),
  errors: z.number().int().min(0),
  detail: z.string().max(4000).optional(),
})
