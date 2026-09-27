import { prisma } from "@/lib/prisma"

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "VIEW" | "IMPORT" | "STATUS"

export async function logAction(params: {
  action: AuditAction | string
  entity: string
  entityId: string
  userId?: string | null
  details?: string | null
}): Promise<void> {
  try {
    await prisma.log.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId ?? undefined,
        details: params.details ?? undefined,
      },
    })
  } catch (error) {
    // Audit logging must never break the main request
    console.error("Audit log failed:", error)
  }
}

export function auditDetails(title: string, extra?: Record<string, unknown>): string {
  if (!extra || Object.keys(extra).length === 0) return title
  try {
    const flat = Object.entries(extra)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join("; ")
    return flat ? `${title} | ${flat}` : title
  } catch {
    return title
  }
}
