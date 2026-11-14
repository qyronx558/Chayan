/**
 * Server helpers for Admin → Content bot (super admin only).
 */
import { requireSuperAdmin } from "@/lib/location-api"

export const requireBotAdmin = () => requireSuperAdmin("Only super admins can control the content bot")

export { dispatchConfig, githubHeaders, WORKFLOW_FILE, type DispatchConfig } from "./dispatch"

/** Prisma P2021 = table missing → the new migration has not been applied. */
export function migrationHint(e: unknown): string | null {
  return (e as { code?: string })?.code === "P2021" ? "Database is not migrated yet - run `npx prisma migrate deploy` first." : null
}
