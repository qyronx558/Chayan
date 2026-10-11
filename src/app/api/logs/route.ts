import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/roles";
import { fetchAuditEvents, projectForRole } from "@/lib/audit";
import { viewToActions } from "@/components/admin/audit/types";
import type { AuditSavedView } from "@/components/admin/audit/types";

function bad(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return bad(401, "Unauthorized");
  if (!isAdmin(session.user.role)) return bad(403, "Forbidden");
  const superAdmin = isSuperAdmin(session.user.role);
  const sp = new URL(request.url).searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "20", 10) || 20));
  const view = (sp.get("view") || "all") as AuditSavedView;
  let action = sp.get("action") || "";
  if (view && view !== "all") {
    if (view === "needs-review") {
    } else if (view === "flagged") {
    } else {
      const mapped = viewToActions(view);
      if (mapped.length > 0 && !action) action = mapped[0];
    }
  }
  try {
    const result = await fetchAuditEvents({
      q: sp.get("search") || sp.get("q") || "",
      action,
      entity: sp.get("entity") || "",
      actor: superAdmin ? sp.get("actor") || "" : "",
      from: sp.get("from") || "",
      to: sp.get("to") || "",
      flaggedOnly: view === "flagged",
      needsReview: view === "needs-review",
      sensitiveOnly: view === "sensitive",
      page,
      limit,
      actorId: session.user.id,
      forceMine: !superAdmin,
    });
    const data = superAdmin ? result.events : result.events.map((e) => projectForRole(e, session.user.role));
    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / limit)) },
      role: superAdmin ? "SUPER_ADMIN" : "ADMIN",
    });
  } catch {
    return bad(500, "Failed to fetch audit events");
  }
}

export async function DELETE() {
  return bad(403, "Audit events are append-only and cannot be cleared. Use the guarded purge in Retention.");
}

export async function PATCH() {
  return bad(403, "Audit events are append-only and cannot be edited.");
}

export async function PUT() {
  return bad(403, "Audit events are append-only and cannot be edited.");
}
