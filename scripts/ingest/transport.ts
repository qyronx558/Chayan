import type { BotRuntimeConfig } from "../../src/lib/ingest/control"
import type { IngestPost } from "../../src/lib/ingest/schema"
import type { IngestKind } from "../../src/lib/ingest/types"

export interface IngestResultRow {
  sourceUrl: string
  status: string
  reason?: string
  moderation?: string
  entityId?: string
}

export interface RunReport {
  source: string
  startedAt: string
  imported: number
  errors: number
  detail: string
}

export interface Published {
  kind: IngestKind
  entityId: string
}

export interface IngestTransport {
  readonly mode: "direct" | "http"
  config(): Promise<BotRuntimeConfig>
  taxonomy(): Promise<{ categories: string[]; departments: string[] }>
  seen(urls: string[]): Promise<string[]>
  ingest(items: IngestPost[]): Promise<IngestResultRow[]>
  report(run: RunReport): Promise<void>
  close(): Promise<void>
}

type Api = <T>(method: "GET" | "POST", route: string, body?: unknown) => Promise<T>

export function httpTransport(api: Api): IngestTransport {
  return {
    mode: "http",
    config: () => api<BotRuntimeConfig>("GET", "/config"),
    taxonomy: () => api<{ categories: string[]; departments: string[] }>("GET", "/taxonomy"),
    seen: async (urls) => (await api<{ unseen: string[] }>("POST", "/seen", { urls })).unseen,
    ingest: async (items) => (await api<{ results: IngestResultRow[] }>("POST", "", { items })).results,
    report: async (run) => {
      await api("POST", "/run", run)
    },
    close: async () => {},
  }
}

export async function directTransport(): Promise<IngestTransport> {
  const [{ prisma }, service, settings] = await Promise.all([
    import("../../src/lib/prisma"),
    import("../../src/lib/ingest/service"),
    import("../../src/lib/ingest/settings"),
  ])
  return {
    mode: "direct",
    async config() {
      const [{ saved: _saved, updatedAt: _updatedAt, ...s }, sources] = await Promise.all([settings.getBotSettings(), settings.getSourceOverrides()])
      return { settings: s, sources }
    },
    async taxonomy() {
      const [categories, departments] = await Promise.all([
        prisma.category.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
        prisma.department.findMany({ select: { name: true }, orderBy: { name: "asc" }, take: 2000 }),
      ])
      return { categories: categories.map((c) => c.name), departments: departments.map((d) => d.name) }
    },
    seen: (urls) => service.filterUnseen(urls),
    ingest: (items) => service.ingestBatch(items),
    async report(run) {
      await prisma.crawlerRun.create({
        data: {
          source: `ingest:${run.source}`,
          startedAt: new Date(run.startedAt),
          finishedAt: new Date(),
          imported: run.imported,
          errors: run.errors,
          detail: run.detail,
        },
        select: { id: true },
      })
    },
    close: () => prisma.$disconnect(),
  }
}

export function wantsDirect(env: Record<string, string | undefined> = process.env): boolean {
  const mode = env.INGEST_TRANSPORT?.trim().toLowerCase()
  if (mode === "http") return false
  if (mode === "direct") return true
  return Boolean(env.DATABASE_URL?.trim())
}
