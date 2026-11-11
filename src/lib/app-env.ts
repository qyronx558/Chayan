/**
 * Which copy of the site is running.
 *
 * - local:      `npm run dev` on a developer's own machine
 * - dev:        the private team-only site, updated on every merge to main
 * - production: the public site, updated only by a manual release
 */
export type AppEnv = "local" | "dev" | "production"

export const APP_ENVS: readonly AppEnv[] = ["local", "dev", "production"]

function isAppEnv(value: unknown): value is AppEnv {
  return typeof value === "string" && (APP_ENVS as readonly string[]).includes(value)
}

export function getAppEnv(): AppEnv {
  // Set by the deploy workflows. Written out literally so Next.js inlines it
  // into browser code too.
  const explicit = process.env.NEXT_PUBLIC_APP_ENV
  if (isAppEnv(explicit)) return explicit

  // Vercel sets these on its own builds (e.g. preview deploys of a pull request).
  const vercel = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV
  if (vercel === "production") return "production"
  if (vercel === "preview") return "dev"
  if (vercel === "development") return "local"

  // Self-hosted builds (Docker, `next start`) count as production.
  return process.env.NODE_ENV === "production" ? "production" : "local"
}

export const isProduction = () => getAppEnv() === "production"

export const ENV_LABELS: Record<AppEnv, { name: string; note: string }> = {
  local: { name: "LOCAL", note: "Running on this computer only" },
  dev: { name: "DEV", note: "Team test site - not the live website. Data here is test data." },
  production: { name: "LIVE", note: "" },
}
