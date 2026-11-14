import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseBody, requireSecret } from "@/lib/ingest/auth"
import { runReportSchema } from "@/lib/ingest/schema"

export const dynamic = "force-dynamic"

/** POST a per-shard run summary → CrawlerRun row (shown in admin analytics health). */
export async function POST(request: NextRequest) {
  const denied = requireSecret(request)
  if (denied) return denied
  const body = await parseBody(request, runReportSchema)
  if ("response" in body) return body.response
  const run = await prisma.crawlerRun.create({
    data: {
      source: `ingest:${body.data.source}`,
      startedAt: new Date(body.data.startedAt),
      finishedAt: new Date(),
      imported: body.data.imported,
      errors: body.data.errors,
      detail: body.data.detail ?? null,
    },
    select: { id: true },
  })
  return NextResponse.json({ success: true, id: run.id })
}
