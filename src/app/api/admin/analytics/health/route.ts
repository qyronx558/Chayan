import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/analytics/guards";
import { getAnalytics } from "@/lib/analytics/service";
import { parseRangeKey } from "@/lib/analytics/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const store = prisma as unknown as { healthCheckResult: { findMany: (a: unknown) => Promise<unknown> } };
  const rows = await store.healthCheckResult.findMany({ orderBy: { key: "asc" } }).catch(() => []);
  return NextResponse.json({ success: true, data: rows });
}

export async function POST() {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  try {
    const payload = await getAnalytics(parseRangeKey("30D"));
    const store = prisma as unknown as { healthCheckResult: { upsert: (a: unknown) => Promise<unknown> } };
    await Promise.all(
      payload.monitoring.health.map((h) =>
        store.healthCheckResult.upsert({
          where: { key: h.key },
          create: { key: h.key, status: h.status, detail: h.detail, checkedAt: new Date() },
          update: { status: h.status, detail: h.detail, checkedAt: new Date() },
        }).catch(() => null)
      )
    );
    return NextResponse.json({ success: true, data: payload.monitoring.health });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Health run failed" },
      { status: 500 }
    );
  }
}
