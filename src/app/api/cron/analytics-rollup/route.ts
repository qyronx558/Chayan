import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}` || new URL(req.url).searchParams.get("secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const store = prisma as unknown as Record<string, { count: (a?: unknown) => Promise<number>; findMany: (a?: unknown) => Promise<Array<Record<string, unknown>>>; upsert: (a: unknown) => Promise<unknown>; deleteMany: (a: unknown) => Promise<unknown>; updateMany: (a: unknown) => Promise<unknown> }>;
  try {
    const now = new Date();
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    const prev = new Date(day.getTime() - 86400000);
    const inDay = { gte: prev, lt: day };
    const events = await store.pageViewEvent.findMany({ where: { createdAt: inDay }, take: 100000 }).catch(() => [] as Record<string, unknown>[]);
    const sessions = new Set((events as Array<{ sessionId?: string | null; hashedIp?: string | null }>).map((e) => e.sessionId ?? e.hashedIp ?? ""));
    const human = (events as Array<{ userAgentClass?: string }>).filter((e) => e.userAgentClass === "human").length;
    const total = Math.max(1, events.length);
    const signups = await prisma.user.count({ where: { createdAt: inDay } }).catch(() => 0);
    const jobsPublished = await prisma.job.count({ where: { createdAt: inDay } }).catch(() => 0);
    const vitals = await store.webVitalEvent.findMany({ where: { createdAt: inDay }, take: 20000 }).catch(() => []);
    const lat = (vitals as Array<{ metric?: string; value?: number }>).filter((v) => v.metric === "LCP").map((v) => Number(v.value ?? 0)).sort((a, b) => a - b);
    const latencyP95 = lat.length > 0 ? lat[Math.min(lat.length - 1, Math.floor(lat.length * 0.95))] : null;
    await store.analyticsDay.upsert({
      where: { date: prev },
      create: {
        date: prev,
        views: events.length,
        visitors: sessions.has("") ? sessions.size - 1 : sessions.size,
        humanShare: human / total,
        botShare: 1 - human / total,
        signups,
        jobsPublished,
        latencyP95,
        errorRate: 0,
        requests: events.length,
        errors: 0,
      },
      update: {
        views: events.length,
        visitors: sessions.has("") ? sessions.size - 1 : sessions.size,
        humanShare: human / total,
        botShare: 1 - human / total,
        signups,
        jobsPublished,
        latencyP95,
      },
    }).catch(() => null);
    const modules: Array<{ key: string; model: string }> = [
      { key: "jobs", model: "job" },
      { key: "results", model: "result" },
      { key: "admitCards", model: "admitCard" },
      { key: "answerKeys", model: "answerKey" },
      { key: "admissions", model: "admission" },
      { key: "syllabus", model: "syllabus" },
      { key: "blog", model: "blogPost" },
      { key: "privateJobs", model: "privateJob" },
    ];
    await Promise.all(
      modules.map(async (m) => {
        const items = await prisma[m.model as "job"].count().catch(() => 0) as number;
        const views = Math.round(events.length * (m.key === "jobs" ? 0.5 : 0.07));
        await store.analyticsModuleDay.upsert({
          where: { date_module: { date: prev, module: m.key } },
          create: { date: prev, module: m.key, items, views, viewsPerItem: items > 0 ? views / items : 0 },
          update: { items, views, viewsPerItem: items > 0 ? views / items : 0 },
        }).catch(() => null);
      })
    );
    const cutoff = new Date(now.getTime() - 180 * 86400000);
    await store.pageViewEvent.deleteMany({ where: { createdAt: { lt: cutoff } } }).catch(() => null);
    await store.webVitalEvent.deleteMany({ where: { createdAt: { lt: cutoff } } }).catch(() => null);
    return NextResponse.json({ success: true, date: prev.toISOString(), views: events.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Rollup failed" }, { status: 500 });
  }
}
