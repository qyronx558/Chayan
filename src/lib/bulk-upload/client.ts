/**
 * Client-side bulk upload helpers: template download + Excel/CSV parsing.
 * Parsing happens in the browser; rows are sent to the server as JSON
 * (the server re-validates everything and never trusts client data).
 */
"use client"

import * as XLSX from "xlsx"
import type { BulkModuleDef } from "./modules"

/** Downloads a ready-to-fill .xlsx template for the module (headers + example row). */
export function downloadTemplate(mod: BulkModuleDef) {
  const headers = mod.columns.map((c) => (c.required ? `${c.header} *` : c.header))
  const ws = XLSX.utils.aoa_to_sheet([headers, mod.example])
  ws["!cols"] = mod.columns.map((c) => ({ wch: Math.max(c.header.length + 4, 22) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, mod.label.slice(0, 28))
  XLSX.writeFile(wb, `${mod.id}-template.xlsx`)
}

export interface ParsedUpload {
  /** Row objects keyed by normalized column key (title, slug, department, ...). */
  rows: Record<string, unknown>[]
  /** Headers found in the file (raw). */
  headers: string[]
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s*\*\s*$/, "").replace(/[^a-z0-9]+/g, "")
}

/**
 * Parses an .xlsx/.xls/.csv File into rows keyed by the module's column keys.
 * Matches file headers to the template headers (case/space-insensitive,
 * ignores the " *" required marker). Throws on unreadable files or when
 * none of the module's headers are found.
 */
export async function parseUploadFile(file: File, mod: BulkModuleDef): Promise<ParsedUpload> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: "array", cellDates: true })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) throw new Error("No worksheet found in the file.")
  const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, defval: "", raw: true })
  if (grid.length < 2) throw new Error("The file has no data rows. Download the template and fill at least one row.")

  const fileHeaders = (grid[0] as unknown[]).map((h) => String(h ?? ""))
  const keyByIndex: (string | null)[] = fileHeaders.map((h) => {
    const n = normalizeHeader(h)
    const col = mod.columns.find((c) => normalizeHeader(c.header) === n)
    return col ? col.key : null
  })

  const matched = keyByIndex.filter(Boolean).length
  if (matched === 0) {
    throw new Error(
      `Columns don't match the ${mod.label} template. Download the template and paste your data into it.`
    )
  }

  const rows: Record<string, unknown>[] = []
  for (let i = 1; i < grid.length; i++) {
    const cells = grid[i] as unknown[]
    const row: Record<string, unknown> = {}
    let hasAny = false
    keyByIndex.forEach((key, idx) => {
      if (!key) return
      const v = cells[idx]
      row[key] = v
      if (v !== "" && v !== null && v !== undefined) hasAny = true
    })
    if (hasAny) rows.push(row) // skip fully-empty rows
  }
  if (rows.length === 0) throw new Error("The file has no data rows. Download the template and fill at least one row.")
  return { rows, headers: fileHeaders }
}
