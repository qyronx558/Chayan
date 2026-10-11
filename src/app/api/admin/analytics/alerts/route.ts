import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/analytics/guards";

export const dynamic = "force-dynamic";

const METRICS = new Set(["error_rate", "latency_p95", "bot_share", "views_drop", "open_issues"]);

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const store = prisma as unknown as { alertRule: { findMany: (a: unknown) => Promise<unknown> } };
  const rules = await store.alertRule.findMany({ orderBy: { createdAt: "asc" } }).catch(() => []);
  return NextResponse.json({ success: true, data: rules });
}

export async function POST(request: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const body = (await request.json().catch(() => ({}))) as { metric?: string; threshold?: number; channels?: string[]; enabled?: boolean };
  if (!body.metric || !METRICS.has(body.metric)) {
    return NextResponse.json({ success: false, error: "Invalid metric" }, { status: 400 });
  }
  if (typeof body.threshold !== "number" || !isFinite(body.threshold)) {
    return NextResponse.json({ success: false, error: "Invalid threshold" }, { status: 400 });
  }
  const channels = (Array.isArray(body.channels) ? body.channels : []).filter((c) => c === "Email" || c === "Telegram");
  const store = prisma as unknown as { alertRule: { create: (a: unknown) => Promise<unknown> } };
  const rule = await store.alertRule.create({
    data: { metric: body.metric, threshold: body.threshold, channels, enabled: body.enabled !== false },
  }).catch(() => null);
  if (!rule) return NextResponse.json({ success: false, error: "Database not migrated yet" }, { status: 503 });
  return NextResponse.json({ success: true, data: rule }, { status: 201 });
}
