export function isUnknownArgumentError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /Unknown argument/i.test(msg)
}

export function isMissingColumnError(error: unknown): boolean {
  const code = (error as { code?: string })?.code
  const msg = error instanceof Error ? error.message : String(error)
  return code === "P2022" || /column .* does not exist|no such column/i.test(msg)
}

export function isMissingTableError(error: unknown): boolean {
  const code = (error as { code?: string })?.code
  const msg = error instanceof Error ? error.message : String(error)
  return code === "P2021" || /does not exist|no such table/i.test(msg)
}

export function isSchemaMismatchError(error: unknown): boolean {
  return isUnknownArgumentError(error) || isMissingColumnError(error) || isMissingTableError(error)
}

export const MIGRATION_REQUIRED_MESSAGE =
  "This feature needs the latest database migration. Run prisma migrate dev, then restart the server."
