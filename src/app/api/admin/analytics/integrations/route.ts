import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/analytics/guards";

export const dynamic = "force-dynamic";

const KEYS = new Set(["gsc", "adsense", "telegram"]);

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const store = prisma as unknown as { integrationSetting: { findMany: (a: unknown) => Promise<unknown> } };
  const rows = await store.integrationSetting.findMany({}).catch(() => []);
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(request: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const body = (await request.json().catch(() => ({}))) as { key?: string; config?: Record<string, unknown> };
  if (!body.key || !KEYS.has(body.key)) {
    return NextResponse.json({ success: false, error: "Invalid key" }, { status: 400 });
  }
  const store = prisma as unknown as { integrationSetting: { upsert: (a: unknown) => Promise<unknown> } };
  const row = await store.integrationSetting.upsert({
    where: { key: body.key },
    create: { key: body.key, connected: true, config: body.config ?? {}, connectedAt: new Date() },
    update: { connected: true, config: body.config ?? {}, connectedAt: new Date() },
  }).catch(() => null);
  if (!row) return NextResponse.json({ success: false, error: "Database not migrated yet" }, { status: 503 });
  return NextResponse.json({ success: true, data: row });
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!KEYS.has(key)) return NextResponse.json({ success: false, error: "Invalid key" }, { status: 400 });
  const store = prisma as unknown as { integrationSetting: { upsert: (a: unknown) => Promise<unknown> } };
  const row = await store.integrationSetting.upsert({
    where: { key },
    create: { key, connected: false },
    update: { connected: false, config: {} },
  }).catch(() => null);
  return NextResponse.json({ success: true, data: row });
}
