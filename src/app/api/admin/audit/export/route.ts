import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/roles";
import { fetchAuditEvents, projectForRole, toCsv } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const superAdmin = isSuperAdmin(session.user.role);
  const sp = new URL(request.url).searchParams;
  const format = (sp.get("format") || "CSV").toUpperCase() === "JSON" ? "JSON" : "CSV";
  const ids = (sp.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 500);
  try {
    const result = await fetchAuditEvents({
      q: sp.get("q") || "",
      action: sp.get("action") || "",
      entity: sp.get("entity") || "",
      actor: superAdmin ? sp.get("actor") || "" : "",
      from: sp.get("from") || "",
      to: sp.get("to") || "",
      page: 1,
      limit: 100,
      actorId: session.user.id,
      forceMine: !superAdmin,
    });
    let events = superAdmin ? result.events : result.events.map((e) => projectForRole(e, session.user.role));
    if (ids.length > 0) {
      const set = new Set(ids);
      events = events.filter((e) => set.has(e.id));
    } else {
      events = events.slice(0, 1000);
    }
    if (format === "JSON") {
      return NextResponse.json({ success: true, data: events, count: events.length });
    }
    const csv = toCsv(events, !superAdmin);
    return new NextResponse(csv, {
      status: 200,
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="audit-events-${new Date().toISOString().slice(0, 10)}.csv"` },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Export failed" }, { status: 500 });
  }
}
