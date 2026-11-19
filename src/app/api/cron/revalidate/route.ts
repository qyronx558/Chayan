import { NextRequest } from "next/server"
import { z } from "zod"
import { requireSecret, parseBody } from "@/lib/ingest/auth"
import { CACHE_TAGS, noStoreResponse, revalidatePublicContent, revalidateTags, type ContentKind } from "@/lib/cache"

export const dynamic = "force-dynamic"

const KINDS = ["job", "private-job", "result", "admit-card", "admission", "answer-key", "syllabus", "blog", "featured"] as const
const TAGS = Object.values(CACHE_TAGS) as [string, ...string[]]

const schema = z.object({
  kind: z.enum(KINDS).optional(),
  slugs: z.array(z.string().min(1).max(200)).max(200).optional(),
  tags: z.array(z.enum(TAGS)).max(10).optional(),
})

export async function POST(request: NextRequest) {
  const denied = requireSecret(request, "CRON_SECRET")
  if (denied) return denied
  const parsed = await parseBody(request, schema)
  if ("response" in parsed) return parsed.response
  const { kind, slugs, tags } = parsed.data
  if (kind) {
    if (slugs?.length) for (const slug of slugs) revalidatePublicContent(kind as ContentKind, slug)
    else revalidatePublicContent(kind as ContentKind)
  }
  if (tags?.length) revalidateTags(tags)
  return noStoreResponse({ success: true, kind: kind ?? null, slugs: slugs?.length ?? 0, tags: tags ?? [] })
}
