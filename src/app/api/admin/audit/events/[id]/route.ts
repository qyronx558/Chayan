import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { fetchAuditById, projectForRole, writeAuditEvent, auditTablesAvailable } from "@/lib/audit";

function deny(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return deny(401, "Unauthorized");
  if (!isAdmin(session.user.role)) return deny(403, "Forbidden");
  const { id } = await params;
  const event = await fetchAuditById(id);
  if (!event) {
    try {
      const legacy = await prisma.log.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, email: true } } } });
      if (!legacy) return deny(404, "Event not found");
      if (!isSuperAdmin(session.user.role) && legacy.userId !== session.user.id) return deny(403, "Forbidden");
      const view = {
        id: legacy.id, createdAt: legacy.createdAt.toISOString(), action: legacy.action as never, entityType: legacy.entity,
        entityId: legacy.entityId, actorId: legacy.userId, actorRole: null,
        actor: legacy.user ? { id: legacy.user.id, name: legacy.user.name, email: legacy.user.email } : null,
        summary: legacy.details || `${legacy.action} ${legacy.entity}`, diff: null, source: "ADMIN_UI" as never,
        ipAddress: null, userAgent: null, requestId: null, flagged: false, reviewedAt: null, reviewedById: null,
        note: null, hash: null, sensitive: false,
      };
      return NextResponse.json({ success: true, data: projectForRole(view, session.user.role) });
    } catch {
      return deny(404, "Event not found");
    }
  }
  if (!isSuperAdmin(session.user.role) && event.actorId !== session.user.id) return deny(403, "Forbidden");
  return NextResponse.json({ success: true, data: projectForRole(event, session.user.role) });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return deny(401, "Unauthorized");
  if (!isSuperAdmin(session.user.role)) return deny(403, "Only super admins can flag, review or annotate events");
  const { id } = await params;
  let body: { op?: string; note?: string; ids?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const op = body.op || "";
  if (!["flag", "unflag", "review", "note", "revert-role", "restore"].includes(op)) return deny(400, "Unknown operation");
  try {
    const hasTables = await auditTablesAvailable();
    if (hasTables) {
      const client = prisma as unknown as {
        auditEvent: { findUnique: (a: unknown) => Promise<unknown | null>; update: (a: unknown) => Promise<unknown>; findMany: (a: unknown) => Promise<unknown[]> };
        user: { findUnique: (a: unknown) => Promise<{ id: string; role: string; email: string; name: string | null } | null>; update: (a: unknown) => Promise<unknown> };
      };
      const existing = (await client.auditEvent.findUnique({ where: { id } })) as unknown as {
        id: string; action: string; entityType: string; entityId: string; flagged: boolean; note: string | null; diff: { after?: { role?: string; to?: string }; before?: { role?: string; from?: string } } | null; summary: string;
      } | null;
      if (!existing) return deny(404, "Event not found");
      if (op === "flag") await client.auditEvent.update({ where: { id }, data: { flagged: true } });
      else if (op === "unflag") await client.auditEvent.update({ where: { id }, data: { flagged: false } });
      else if (op === "review") await client.auditEvent.update({ where: { id }, data: { flagged: false, reviewedAt: new Date(), reviewedById: session.user.id } });
      else if (op === "note") await client.auditEvent.update({ where: { id }, data: { note: (body.note || "").slice(0, 2000) || null } });
      else if (op === "revert-role") {
        if (existing.action !== "ROLE_CHANGE") return deny(400, "Only role changes can be reverted");
        const diff = existing.diff as { before?: { role?: string; from?: string }; after?: { role?: string; to?: string }; userId?: string } | null;
        const targetUserId = (diff as { userId?: string } | null)?.userId || existing.entityId;
        const prevRole = diff?.before?.role || diff?.before?.from || "USER";
        const target = await client.user.findUnique({ where: { id: targetUserId } });
        if (!target) return deny(404, "Target user not found");
        await client.user.update({ where: { id: targetUserId }, data: { role: prevRole as never } });
        await writeAuditEvent({
          action: "ROLE_CHANGE", entityType: "User", entityId: targetUserId, actorId: session.user.id, actorRole: session.user.role,
          summary: `Reverted role of ${target.email} back to ${prevRole} (revert of ${id.slice(0, 8)})`,
          diff: { before: { role: target.role }, after: { role: prevRole } }, source: "ADMIN_UI",
        });
        return NextResponse.json({ success: true, data: { reverted: true } });
      } else if (op === "restore") {
        await writeAuditEvent({
          action: "UPDATE", entityType: existing.entityType, entityId: existing.entityId, actorId: session.user.id, actorRole: session.user.role,
          summary: `Restored ${existing.entityType} ${existing.entityId.slice(0, 8)} from trash (restore of ${id.slice(0, 8)})`,
          diff: { before: { deleted: true }, after: { deleted: false } }, source: "ADMIN_UI",
        });
        await client.auditEvent.update({ where: { id }, data: { reviewedAt: new Date(), reviewedById: session.user.id, flagged: false } });
        return NextResponse.json({ success: true, data: { restored: true } });
      }
      const label = op === "flag" ? "flagged" : op === "unflag" ? "unflagged" : op === "review" ? "marked reviewed" : "note saved";
      await writeAuditEvent({
        action: "UPDATE", entityType: "AuditEvent", entityId: id, actorId: session.user.id, actorRole: session.user.role,
        summary: `Event ${id.slice(0, 8)} ${label} by ${session.user.email ?? session.user.id}`,
        diff: { before: null, after: { op, note: body.note?.slice(0, 200) ?? null } }, source: "ADMIN_UI",
      });
      return NextResponse.json({ success: true, data: { updated: true } });
    }
    if (op === "revert-role" || op === "restore") return deny(409, "Event store is still migrating. Try again after deploy finishes.");
    await prisma.log.create({
      data: { action: "UPDATE", entity: "Log", entityId: id, userId: session.user.id, details: `Event ${id.slice(0, 8)} ${op} by ${session.user.email}` },
    }).catch(() => undefined);
    return NextResponse.json({ success: true, data: { updated: true } });
  } catch {
    return deny(500, "Failed to update event");
  }
}
