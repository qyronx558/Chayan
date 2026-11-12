import { slugify } from "@/lib/utils"

/**
 * Three-tier job location model for government jobs.
 *
 * - central:  anyone in India can apply (SSC, UPSC, RRB, IBPS…)
 * - state:    only residents of one state (State PSC, State Police…)
 * - district: only residents of one district (Zilla Parishad, Anganwadi…)
 *
 * This file is client-safe (no Prisma import) so forms, cards and API routes
 * can share the same rules.
 */

export const JOB_LEVELS = ["CENTRAL", "STATE", "DISTRICT"] as const
export type JobLevelValue = (typeof JOB_LEVELS)[number]

/** URL / API spelling (`?level=state`) ↔ Prisma enum value (`STATE`). */
export const JOB_LEVEL_PARAM: Record<JobLevelValue, "central" | "state" | "district"> = {
  CENTRAL: "central",
  STATE: "state",
  DISTRICT: "district",
}

export const JOB_LEVEL_OPTIONS: Array<{ value: JobLevelValue; label: string; hint: string }> = [
  { value: "CENTRAL", label: "Central", hint: "Anyone from any state or district in India can apply" },
  { value: "STATE", label: "State", hint: "Only candidates from the selected state can apply" },
  { value: "DISTRICT", label: "District", hint: "Only candidates from the selected district can apply" },
]

/** Accepts `central`, `STATE`, ` District ` … and returns the enum value, or null. */
export function parseJobLevel(value: unknown): JobLevelValue | null {
  if (typeof value !== "string") return null
  const v = value.trim().toUpperCase()
  return (JOB_LEVELS as readonly string[]).includes(v) ? (v as JobLevelValue) : null
}

/** URL-safe slug: lowercase, `&` → `and`, accents stripped, spaces → hyphens. */
export function toSlug(name: string): string {
  return slugify(name.replace(/\./g, " ").trim())
}

export type JobLocationInput = {
  jobLevel?: unknown
  stateId?: string | null
  districtId?: string | null
}

export type ResolvedJobLocation = {
  jobLevel: JobLevelValue
  stateId: string | null
  districtId: string | null
}

/**
 * Normalises a level + state + district triple:
 * - no level given → derive it (district ⇒ DISTRICT, state ⇒ STATE, else CENTRAL)
 *   so legacy callers/importers that only send `stateId` keep working;
 * - drops fields the level does not use (central ⇒ no state/district, state ⇒ no district);
 * - returns an error message when a required field is missing.
 */
export function resolveJobLocation(
  input: JobLocationInput
): { ok: true; value: ResolvedJobLocation } | { ok: false; error: string; field: "stateId" | "districtId" | "jobLevel" } {
  const stateId = input.stateId || null
  const districtId = input.districtId || null
  const given = input.jobLevel === undefined || input.jobLevel === null || input.jobLevel === "" ? null : parseJobLevel(input.jobLevel)
  if (input.jobLevel !== undefined && input.jobLevel !== null && input.jobLevel !== "" && !given) {
    return { ok: false, error: "Job level must be Central, State or District", field: "jobLevel" }
  }
  const jobLevel: JobLevelValue = given ?? (districtId ? "DISTRICT" : stateId ? "STATE" : "CENTRAL")

  if (jobLevel === "CENTRAL") return { ok: true, value: { jobLevel, stateId: null, districtId: null } }
  if (!stateId) return { ok: false, error: "State is required for state and district level jobs", field: "stateId" }
  if (jobLevel === "STATE") return { ok: true, value: { jobLevel, stateId, districtId: null } }
  if (!districtId) return { ok: false, error: "District is required for district level jobs", field: "districtId" }
  return { ok: true, value: { jobLevel, stateId, districtId } }
}

type NamedRef = { name: string; slug?: string | null } | null | undefined

/** Badge text for a job card: "All India" | "Rajasthan" | "Jaipur, Rajasthan". */
export function jobLocationLabel(job: {
  jobLevel?: string | null
  state?: NamedRef
  district?: NamedRef
}): string {
  const level = parseJobLevel(job.jobLevel) ?? (job.district ? "DISTRICT" : job.state ? "STATE" : "CENTRAL")
  if (level === "DISTRICT" && job.district && job.state) return `${job.district.name}, ${job.state.name}`
  if ((level === "STATE" || level === "DISTRICT") && job.state) return job.state.name
  return "All India"
}

export const STATE_TYPE_LABEL: Record<string, string> = {
  STATE: "State",
  UNION_TERRITORY: "Union Territory",
}

export function statePagePath(stateSlug: string): string {
  return `/jobs/state/${stateSlug}`
}

export function districtPagePath(stateSlug: string, districtSlug: string): string {
  return `/jobs/district/${stateSlug}/${districtSlug}`
}

/** Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  const src = text.replace(/^﻿/, "")
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ",") {
      row.push(field)
      field = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++
      row.push(field)
      if (row.some((f) => f.trim() !== "")) rows.push(row)
      row = []
      field = ""
    } else field += c
  }
  row.push(field)
  if (row.some((f) => f.trim() !== "")) rows.push(row)
  return rows
}
