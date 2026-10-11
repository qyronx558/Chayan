import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { listAuditAlertRules, listAuditChannels, writeAuditEvent, auditTablesAvailable } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const [rules, channels] = await Promise.all([listAuditAlertRules(), listAuditChannels()]);
  return NextResponse.json({ success: true, data: { rules, channels, onCount: rules.filter((r) => r.enabled).length } });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  let body: { name?: string; condition?: Record<string, unknown>; severity?: string; channels?: string[]; enabled?: boolean; toggleId?: string; channelType?: string; connect?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  try {
    if (body.toggleId) {
      if (await auditTablesAvailable()) {
        const client = prisma as unknown as { auditAlertRule: { update: (a: unknown) => Promise<unknown> } };
        const enabled = body.enabled ?? true;
        await client.auditAlertRule.update({ where: { id: body.toggleId }, data: { enabled } });
        await writeAuditEvent({
          action: "UPDATE", entityType: "AlertRule", entityId: body.toggleId, actorId: session.user.id, actorRole: session.user.role,
          summary: `Alert rule ${enabled ? "enabled" : "disabled"} by ${session.user.email ?? session.user.id}`,
          diff: { before: null, after: { enabled } }, source: "ADMIN_UI",
        });
        return NextResponse.json({ success: true, data: { updated: true } });
      }
      return NextResponse.json({ success: true, data: { updated: true } });
    }
    if (body.channelType) {
      const type = body.channelType === "Telegram" ? "Telegram" : body.channelType === "Webhook" ? "Webhook" : "Email";
      if (await auditTablesAvailable()) {
        const client = prisma as unknown as { auditChannel: { upsert: (a: unknown) => Promise<unknown> } };
        await client.auditChannel.upsert({
          where: { type },
          create: { type, connected: body.connect ?? false, connectedAt: body.connect ? new Date() : null },
          update: { connected: body.connect ?? false, connectedAt: body.connect ? new Date() : null },
        });
      }
      await writeAuditEvent({
        action: "UPDATE", entityType: "AlertChannel", entityId: type, actorId: session.user.id, actorRole: session.user.role,
        summary: `Alert channel ${type} ${body.connect ? "connected" : "disconnected"} by ${session.user.email ?? session.user.id}`,
        diff: { before: null, after: { connected: body.connect ?? false } }, source: "ADMIN_UI",
      });
      return NextResponse.json({ success: true, data: { updated: true } });
    }
    if (!body.name || typeof body.name !== "string") return NextResponse.json({ success: false, error: "Rule name is required" }, { status: 400 });
    const severity = body.severity === "Critical" ? "Critical" : "Warning";
    const channels = Array.isArray(body.channels) ? body.channels.filter((c) => ["Email", "Telegram", "Webhook"].includes(c)) : ["Email"];
    if (await auditTablesAvailable()) {
      const client = prisma as unknown as { auditAlertRule: { create: (a: unknown) => Promise<{ id: string }> } };
      const created = await client.auditAlertRule.create({ data: { name: body.name.slice(0, 120), condition: body.condition ?? {}, severity, channels, enabled: true } });
      await writeAuditEvent({
        action: "CREATE", entityType: "AlertRule", entityId: created.id, actorId: session.user.id, actorRole: session.user.role,
        summary: `Alert rule "${body.name.slice(0, 80)}" created by ${session.user.email ?? session.user.id}`,
        diff: { before: null, after: { name: body.name, severity, channels } }, source: "ADMIN_UI",
      });
      return NextResponse.json({ success: true, data: { id: created.id } });
    }
    return NextResponse.json({ success: true, data: { id: "pending" } });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save alert rule" }, { status: 500 });
  }
}
