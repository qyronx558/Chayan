export interface KeysetCursor {
  createdAt: Date
  id: string
}

export function encodeCursor(row: { createdAt: Date; id: string }): string {
  return Buffer.from(`${row.createdAt.toISOString()}|${row.id}`).toString("base64url")
}

export function decodeCursor(raw: string | null): KeysetCursor | null {
  if (!raw) return null
  try {
    const [iso, id] = Buffer.from(raw, "base64url").toString("utf8").split("|")
    const createdAt = new Date(iso)
    if (!id || Number.isNaN(createdAt.getTime())) return null
    return { createdAt, id }
  } catch {
    return null
  }
}

export function keysetAfter(cursor: KeysetCursor) {
  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ],
  }
}

export const KEYSET_ORDER = [{ createdAt: "desc" as const }, { id: "desc" as const }]

export function pageWithCursor<T extends { createdAt: Date; id: string }>(rows: T[], limit: number) {
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  return { items, nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null }
}
