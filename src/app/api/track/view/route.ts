import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyAgent, deviceFromUa, hashIp } from "@/lib/analytics/parse";

export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function bumpEntityCounter(entityType: string | undefined, entityId: string | undefined) {
  if (!entityType || !entityId) return;
  const date = startOfDay();
  if (entityType === "JOB") {
    await prisma.jobView.upsert({
      where: { jobId_date: { jobId: entityId, date } },
      update: { views: { increment: 1 } },
      create: { jobId: entityId, date, views: 1 },
    });
  } else if (entityType === "PRIVATE_JOB") {
    await prisma.$transaction([
      prisma.privateJob.update({ where: { id: entityId }, data: { views: { increment: 1 } } }),
      prisma.privateJobView.upsert({
        where: { privateJobId_date: { privateJobId: entityId, date } },
        update: { views: { increment: 1 } },
        create: { privateJobId: entityId, date, views: 1 },
      }),
    ]);
  } else if (entityType === "BLOG") {
    await prisma.blogPost.update({ where: { id: entityId }, data: { views: { increment: 1 } } });
  }
}

type ViewBody = {
  path?: string;
  entityType?: string;
  entityId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  state?: string;
  sessionId?: string;
  userId?: string;
  durationMs?: number;
};

type Metric = { metric?: string; value?: number };
type VitalsBody = { metrics?: Metric[]; path?: string; sessionId?: string };

const MAX_VIEWS = 50;
const MAX_VITALS = 30;
const ALLOWED_METRICS = new Set(["LCP", "INP", "CLS", "FCP", "TTFB", "time-on-page"]);

function validMetric(m: Metric): m is { metric: string; value: number } {
  return !!m.metric && ALLOWED_METRICS.has(m.metric) && typeof m.value === "number" && isFinite(m.value);
}

/**
 * Page views (and sampled web vitals) arrive as one batch per visit:
 * { views: ViewBody[], vitals: VitalsBody[] }. A single ViewBody is still
 * accepted from pages loaded before batching shipped.
 */
export async function POST(req: NextRequest) {
  try {
    if (req.headers.get("dnt") === "1") return new NextResponse(null, { status: 204 });
    const raw = (await req.json().catch(() => ({}))) as ViewBody & { views?: ViewBody[]; vitals?: VitalsBody[] };
    const batched = Array.isArray(raw.views) || Array.isArray(raw.vitals);
    const views = (batched ? (Array.isArray(raw.views) ? raw.views : []) : [raw]).slice(0, MAX_VIEWS);
    const vitals = batched && Array.isArray(raw.vitals) ? raw.vitals.slice(0, MAX_VITALS) : [];

    const ua = req.headers.get("user-agent");
    const agentClass = classifyAgent(ua);
    const refererHeader = req.headers.get("referer");
    const url = new URL(req.url);
    const get = (k: string) => url.searchParams.get(k) ?? undefined;
    const deviceType = deviceFromUa(ua);
    const hashedIp = hashIp(clientIp(req));
    const store = prisma as unknown as {
      pageViewEvent: { createMany: (a: unknown) => Promise<unknown> };
      webVitalEvent: { createMany: (a: unknown) => Promise<unknown> };
    };

    const rows = views
      .filter((body) => body && typeof body === "object")
      .map((body) => ({
        path: typeof body.path === "string" && body.path.startsWith("/") ? body.path.slice(0, 500) : "/",
        entityType: body.entityType?.slice(0, 40) ?? null,
        entityId: body.entityId?.slice(0, 80) ?? null,
        referrer: (body.referrer ?? refererHeader)?.slice(0, 500) ?? null,
        utmSource: (body.utmSource ?? get("utm_source"))?.slice(0, 120) ?? null,
        utmMedium: (body.utmMedium ?? get("utm_medium"))?.slice(0, 120) ?? null,
        utmCampaign: (body.utmCampaign ?? get("utm_campaign"))?.slice(0, 120) ?? null,
        deviceType,
        state: body.state?.slice(0, 80) ?? null,
        userAgent: ua?.slice(0, 500) ?? null,
        userAgentClass: agentClass,
        hashedIp,
        sessionId: body.sessionId?.slice(0, 80) ?? null,
        userId: body.userId?.slice(0, 40) ?? null,
        durationMs: typeof body.durationMs === "number" ? Math.min(3600000, Math.max(0, Math.round(body.durationMs))) : null,
      }));

    const vitalRows = vitals.flatMap((v) => {
      if (!v || typeof v !== "object" || !Array.isArray(v.metrics)) return [];
      const path = v.path?.slice(0, 500) ?? null;
      const sessionId = v.sessionId?.slice(0, 80) ?? null;
      return v.metrics.slice(0, 10).filter(validMetric).map((m) => ({
        metric: m.metric,
        value: Math.max(0, Math.min(3600000, m.value)),
        path,
        sessionId,
      }));
    });

    const work: Promise<unknown>[] = [];
    if (rows.length) work.push(store.pageViewEvent.createMany({ data: rows }).catch(() => null));
    if (vitalRows.length) work.push(store.webVitalEvent.createMany({ data: vitalRows }).catch(() => null));
    if (agentClass === "human") {
      for (const r of rows) {
        work.push(bumpEntityCounter(r.entityType ?? undefined, r.entityId ?? undefined).catch(() => null));
      }
    }
    await Promise.all(work);
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
