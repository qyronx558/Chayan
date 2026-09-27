"use client"

export function exportToCsv<T extends Record<string, unknown>>(rows: T[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return ""
    const s = typeof v === "object" ? JSON.stringify(v) : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function flattenForCsv(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      const nested = v as Record<string, unknown>
      if ("name" in nested) out[k] = nested.name
      else out[k] = JSON.stringify(v)
    } else if (v instanceof Date) {
      out[k] = v.toISOString()
    } else {
      out[k] = v as unknown
    }
  }
  return out
}
