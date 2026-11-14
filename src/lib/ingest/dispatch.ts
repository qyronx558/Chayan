/** "Run now": start the content-ingest GitHub workflow (no server imports - unit-testable). */

/** GitHub workflow that runs the bot. */
export const WORKFLOW_FILE = "content-ingest.yml"

export interface DispatchConfig {
  token: string
  repo: string
  ref: string
  target: "dev" | "production"
}

/**
 * "Run now" needs a GitHub token that may start the content-ingest workflow
 * (fine-grained PAT, repository access to this repo, permission Actions: read & write).
 */
export function dispatchConfig(env: Record<string, string | undefined> = process.env): DispatchConfig | null {
  const token = env.INGEST_GITHUB_TOKEN?.trim()
  const repo = env.INGEST_GITHUB_REPO?.trim() || "qyronx558/Chayan"
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return null
  const explicit = env.INGEST_DISPATCH_TARGET
  const target = explicit === "dev" || explicit === "production" ? explicit : env.NEXT_PUBLIC_APP_ENV === "production" ? "production" : "dev"
  return { token, repo, ref: env.INGEST_GITHUB_REF?.trim() || "main", target }
}

export function githubHeaders(token: string): Record<string, string> {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "x-github-api-version": "2022-11-28",
    "user-agent": "ChayanJobs-admin",
  }
}

/** Starts content-ingest.yml with the given inputs. GitHub answers 204 on success. */
export async function dispatchWorkflow(
  cfg: DispatchConfig,
  inputs: Record<string, string>,
  fetchFn: typeof fetch = fetch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetchFn(`https://api.github.com/repos/${cfg.repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
    method: "POST",
    headers: { ...githubHeaders(cfg.token), "content-type": "application/json" },
    body: JSON.stringify({ ref: cfg.ref, inputs }),
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null)
  if (res?.status === 204) return { ok: true }
  if (!res) return { ok: false, error: "Could not reach GitHub" }
  const why: Record<number, string> = {
    401: " (the token is invalid or expired - create a new one)",
    403: " (the token lacks Actions: Read and write)",
    404: " (workflow not found on that branch, or the token cannot see the repository)",
    422: ` (the workflow on '${cfg.ref}' does not accept these inputs - merge the latest workflow file)`,
  }
  return { ok: false, error: `GitHub answered HTTP ${res.status}${why[res.status] ?? ""}` }
}

/** Precise schedule slots (called by an external cron, see /api/cron/ingest/trigger). */
export const SCHEDULE_SLOTS = {
  /** central + state boards - every 4 hours */
  frequent: { tier: "frequent" },
  /** all district portals - daily 06:00 IST */
  district: { tier: "district" },
} as const
export type ScheduleSlot = keyof typeof SCHEDULE_SLOTS

export function scheduledInputs(slot: ScheduleSlot, target: "dev" | "production"): Record<string, string> {
  return { target, tier: SCHEDULE_SLOTS[slot].tier, source: "", dry_run: "false", scheduled: "true" }
}
