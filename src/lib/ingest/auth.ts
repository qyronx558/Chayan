import { timingSafeEqual } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Bearer-token guard for the ingest bot. INGEST_SECRET is separate from
 * CRON_SECRET so a leaked scraper token can only add pending posts - it can
 * never trigger newsletters or other crons.
 */
export function requireSecret(request: NextRequest, envName: "INGEST_SECRET" | "CRON_SECRET" = "INGEST_SECRET"): NextResponse | null {
  const configured = process.env[envName]
  if (!configured) {
    return NextResponse.json({ success: false, error: `${envName} is not configured` }, { status: 500 })
  }
  const header = request.headers.get("authorization") ?? ""
  const given = header.startsWith("Bearer ") ? header.slice(7) : ""
  const a = Buffer.from(given)
  const b = Buffer.from(configured)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  return null
}

/** Parses a JSON body against a zod-like schema; returns a 400 response on failure. */
export async function parseBody<T>(
  request: NextRequest,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } },
): Promise<{ data: T } | { response: NextResponse }> {
  const raw = await request.json().catch(() => undefined)
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      response: NextResponse.json(
        { success: false, error: `Invalid payload: ${issue ? `${issue.path.map(String).join(".")} ${issue.message}` : "bad JSON"}` },
        { status: 400 },
      ),
    }
  }
  return { data: parsed.data }
}
