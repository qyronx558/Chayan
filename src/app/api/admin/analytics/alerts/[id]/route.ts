import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/analytics/guards";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as { enabled?: boolean; threshold?: number; channels?: string[] };
  const data: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body.threshold === "number" && isFinite(body.threshold)) data.threshold = body.threshold;
  if (Array.isArray(body.channels)) data.channels = body.channels.filter((c) => c === "Email" || c === "Telegram");
  const store = prisma as unknown as { alertRule: { update: (a: unknown) => Promise<unknown> } };
  const rule = await store.alertRule.update({ where: { id }, data }).catch(() => null);
  if (!rule) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: rule });
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const { id } = await ctx.params;
  const store = prisma as unknown as { alertRule: { delete: (a: unknown) => Promise<unknown> } };
  await store.alertRule.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ success: true });
}
