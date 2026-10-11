import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/analytics/guards";
import { getAnalytics } from "@/lib/analytics/service";
import { parseRangeKey } from "@/lib/analytics/types";

export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const range = parseRangeKey(new URL(request.url).searchParams.get("range"));
  try {
    const a = await getAnalytics(range);
    const lines = ["section,label,value,extra"];
    for (const k of a.overview.kpis) lines.push(["kpi", k.label, k.value, k.sub].map(csvCell).join(","));
    for (const s of a.overview.statusDonut) lines.push(["jobs_by_status", s.label, s.value, ""].map(csvCell).join(","));
    for (const c of a.overview.categories) lines.push(["jobs_by_category", c.name, c.jobs, `${c.views} views`].map(csvCell).join(","));
    for (const p of a.overview.popular) lines.push(["popular_job", p.title, p.views, `${p.bookmarks} bookmarks`].map(csvCell).join(","));
    for (const k of a.audience.kpis) lines.push(["audience", k.label, k.display ?? k.value, k.sub].map(csvCell).join(","));
    for (const m of a.content.modules) lines.push(["module", m.label, m.views, `${m.items} items`].map(csvCell).join(","));
    for (const s of a.acquisition.sources) lines.push(["source", s.label, s.visitors, ""].map(csvCell).join(","));
    for (const h of a.monitoring.health) lines.push(["health", h.title, h.status, h.detail].map(csvCell).join(","));
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-${range.toLowerCase()}.csv"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 }
    );
  }
}
