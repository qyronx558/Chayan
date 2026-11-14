import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireBotAdmin } from "@/lib/ingest/admin"
import { parseListing } from "@/lib/ingest/adapters"
import { FILE_SOURCES } from "@/lib/ingest/catalog"
import { triageNotice } from "@/lib/ingest/classify"
import { applySourceOverrides, customSourceSchema } from "@/lib/ingest/control"
import { isOfficialUrl } from "@/lib/ingest/normalize"
import { getSourceOverrides } from "@/lib/ingest/settings"
import type { SourceDef } from "@/lib/ingest/types"

export const dynamic = "force-dynamic"
export const maxDuration = 30

const MAX_BYTES = 3_000_000
const UA = `ChayanJobsBot/1.0 (+${(process.env.NEXT_PUBLIC_APP_URL || "https://chayanjobs.in").replace(/\/+$/, "")}/editorial-policy)`

const bodySchema = z.union([z.object({ id: z.string().min(1).max(120) }).strict(), z.object({ def: z.unknown() }).strict()])

/**
 * POST {id} | {def} → fetch the source's listing page once and show which notices
 * the bot would pick up (no AI call, nothing saved). Lets an admin check a new
 * board's link pattern before saving it.
 */
export async function POST(request: NextRequest) {
  const guard = await requireBotAdmin()
  if (!guard.ok) return guard.response
  const body = bodySchema.safeParse(await request.json().catch(() => null))
  if (!body.success) return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 })

  let src: SourceDef
  if ("id" in body.data) {
    const id = body.data.id
    const found = applySourceOverrides(FILE_SOURCES, await getSourceOverrides()).find((s) => s.id === id)
    if (!found) return NextResponse.json({ success: false, error: "Unknown source" }, { status: 404 })
    src = found
  } else {
    const def = customSourceSchema.safeParse(body.data.def)
    if (!def.success) return NextResponse.json({ success: false, error: def.error.issues[0]?.message ?? "Invalid source" }, { status: 400 })
    src = { ...def.data, id: "preview" }
  }

  let html: string
  let finalUrl: string
  try {
    const res = await fetch(src.url, {
      headers: { "user-agent": UA, accept: "text/html,*/*;q=0.5", "accept-language": "en-IN,en;q=0.9,hi;q=0.8" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    })
    finalUrl = res.url || src.url
    if (!res.ok) return NextResponse.json({ success: false, error: `The site answered HTTP ${res.status}` }, { status: 502 })
    if (!isOfficialUrl(finalUrl, src.allowHosts)) {
      return NextResponse.json({ success: false, error: `The page redirected to a non-official site (${new URL(finalUrl).host})` }, { status: 400 })
    }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > MAX_BYTES) return NextResponse.json({ success: false, error: "Listing page is too large" }, { status: 400 })
    html = buf.toString("utf8")
  } catch (e) {
    const cause = (e as { cause?: { code?: string } }).cause?.code ?? ""
    const msg = /CERT|SSL|TLS/i.test(cause)
      ? "The site's security certificate is broken. The scheduled bot can still read it (it retries leniently), but this preview cannot."
      : `Could not open the page (${e instanceof Error && e.name === "TimeoutError" ? "timed out" : cause || "network error"})`
    return NextResponse.json({ success: false, error: msg }, { status: 502 })
  }

  const parsed = parseListing(src, html, finalUrl)
  const items = parsed.items.map((it) => ({
    title: it.title,
    url: it.url,
    date: it.endDate ?? it.startDate ?? null,
    triage: triageNotice(it.title, it.description),
  }))
  return NextResponse.json({
    success: true,
    found: items.length,
    relevant: items.filter((i) => i.triage.relevant).length,
    empty: parsed.empty,
    nextPage: parsed.nextPage,
    items: items.slice(0, 40),
  })
}
