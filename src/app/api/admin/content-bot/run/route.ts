import { NextRequest, NextResponse } from "next/server"
import { dispatchConfig, githubHeaders, requireBotAdmin, WORKFLOW_FILE } from "@/lib/ingest/admin"
import { runRequestSchema, workflowInputs } from "@/lib/ingest/control"
import { writeAuditLog } from "@/lib/moderation"

export const dynamic = "force-dynamic"

const NOT_CONFIGURED =
  "Run now is not set up: add INGEST_GITHUB_TOKEN (GitHub token with Actions read & write on this repo) to the site's environment variables. Locally, run `npm run ingest -- --tier=central` instead."

interface GhRun {
  id: number
  status: string
  conclusion: string | null
  event: string
  created_at: string
  updated_at: string
  html_url: string
  display_title?: string
}

/** GET → the latest runs of the content-ingest workflow (scheduled + manual). */
export async function GET() {
  const guard = await requireBotAdmin()
  if (!guard.ok) return guard.response
  const cfg = dispatchConfig()
  if (!cfg) return NextResponse.json({ success: true, configured: false, runs: [] })
  try {
    const res = await fetch(`https://api.github.com/repos/${cfg.repo}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=15`, {
      headers: githubHeaders(cfg.token),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      return NextResponse.json({ success: true, configured: true, runs: [], error: `GitHub answered HTTP ${res.status} - check the token's repository access and Actions permission` })
    }
    const json = (await res.json()) as { workflow_runs?: GhRun[] }
    return NextResponse.json({
      success: true,
      configured: true,
      target: cfg.target,
      runs: (json.workflow_runs ?? []).map((r) => ({
        id: r.id,
        status: r.status,
        conclusion: r.conclusion,
        event: r.event,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        url: r.html_url,
        title: r.display_title ?? "",
      })),
    })
  } catch {
    return NextResponse.json({ success: true, configured: true, runs: [], error: "Could not reach GitHub" })
  }
}

/** POST {tier|source, dryRun} → start the content-ingest workflow now. */
export async function POST(request: NextRequest) {
  const guard = await requireBotAdmin()
  if (!guard.ok) return guard.response
  const cfg = dispatchConfig()
  if (!cfg) return NextResponse.json({ success: false, error: NOT_CONFIGURED }, { status: 400 })
  const parsed = runRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 })

  const res = await fetch(`https://api.github.com/repos/${cfg.repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
    method: "POST",
    headers: { ...githubHeaders(cfg.token), "content-type": "application/json" },
    body: JSON.stringify({ ref: cfg.ref, inputs: workflowInputs(parsed.data, cfg.target) }),
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null)
  if (!res || res.status !== 204) {
    const detail = res ? `GitHub answered HTTP ${res.status}${res.status === 404 ? " (workflow not found on that branch, or the token cannot see the repo)" : res.status === 403 ? " (token lacks Actions: write)" : ""}` : "Could not reach GitHub"
    return NextResponse.json({ success: false, error: detail }, { status: 502 })
  }
  await writeAuditLog({
    action: "RUN",
    entity: "IngestRun",
    entityId: parsed.data.source ?? parsed.data.tier ?? "run",
    userId: guard.user.id,
    details: JSON.stringify({ ...parsed.data, target: cfg.target }),
  })
  return NextResponse.json({ success: true, target: cfg.target })
}
