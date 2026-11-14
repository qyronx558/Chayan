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
