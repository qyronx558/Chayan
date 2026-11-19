import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["LCP", "INP", "CLS", "FCP", "TTFB", "time-on-page"]);

type Metric = { metric?: string; value?: number };

function validMetric(m: Metric): m is { metric: string; value: number } {
  return !!m.metric && ALLOWED.has(m.metric) && typeof m.value === "number" && isFinite(m.value);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Metric & { metrics?: Metric[]; path?: string; sessionId?: string };
    const metrics = (Array.isArray(body.metrics) ? body.metrics.slice(0, 10) : [body]).filter(validMetric);
    if (metrics.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid metric" }, { status: 400 });
    }
    const path = body.path?.slice(0, 500) ?? null;
    const sessionId = body.sessionId?.slice(0, 80) ?? null;
    const store = prisma as unknown as { webVitalEvent: { createMany: (a: unknown) => Promise<unknown> } };
    await store.webVitalEvent.createMany({
      data: metrics.map((m) => ({ metric: m.metric, value: Math.max(0, Math.min(3600000, m.value)), path, sessionId })),
    }).catch(() => null);
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
