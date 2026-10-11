import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/roles";
import { fetchAuditEvents, projectForRole } from "@/lib/audit";
import { viewToActions } from "@/components/admin/audit/types";
import type { AuditSavedView } from "@/components/admin/audit/types";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const superAdmin = isSuperAdmin(session.user.role);
  const sp = new URL(request.url).searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "20", 10) || 20));
  const view = (sp.get("view") || "all") as AuditSavedView;
  const actionParam = sp.get("action") || "";
  let action = actionParam;
  if (!superAdmin && sp.get("actor")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  if (view !== "all" && view !== "needs-review" && view !== "flagged" && view !== "sensitive") {
    const mapped = viewToActions(view);
    if (mapped.length > 0 && !action) action = mapped.join(",");
  }
  const actions = action.split(",").map((s) => s.trim()).filter(Boolean);
  try {
    if (actions.length > 1) {
      let combined: unknown[] = [];
      let total = 0;
      for (const a of actions) {
        const r = await fetchAuditEvents({
          q: sp.get("q") || "",
          action: a,
          entity: sp.get("entity") || "",
          actor: superAdmin ? sp.get("actor") || "" : "",
          from: sp.get("from") || "",
          to: sp.get("to") || "",
          page: 1,
          limit: 200,
          actorId: session.user.id,
          forceMine: !superAdmin,
        });
        combined = [...combined, ...r.events];
        total += r.total;
      }
      combined.sort((x, y) => +new Date((y as { createdAt: string }).createdAt) - +new Date((x as { createdAt: string }).createdAt));
      const start = (page - 1) * limit;
      const slice = combined.slice(start, start + limit);
      const data = superAdmin ? slice : (slice as { actorId: string | null }[]).map((e) => projectForRole(e as never, session.user.role));
      return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, role: superAdmin ? "SUPER_ADMIN" : "ADMIN" });
    }
    const result = await fetchAuditEvents({
      q: sp.get("q") || "",
      action: actions[0] || "",
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
    const needsReviewTotal = result.total;
    const data = superAdmin ? result.events : result.events.map((e) => projectForRole(e, session.user.role));
    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / limit)) },
      role: superAdmin ? "SUPER_ADMIN" : "ADMIN",
      needsReviewTotal,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch events" }, { status: 500 });
  }
}
