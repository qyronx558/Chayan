import { NextRequest, NextResponse } from "next/server";
import { getAnalytics } from "@/lib/analytics/service";
import { cacheHeaders, cached, requireSuperAdmin } from "@/lib/analytics/guards";
import { parseRangeKey } from "@/lib/analytics/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;
  const range = parseRangeKey(new URL(request.url).searchParams.get("range"));
  try {
    const data = await cached(`analytics:${range}`, 60_000, () => getAnalytics(range));
    return NextResponse.json({ success: true, data }, { headers: cacheHeaders() });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to load analytics" },
      { status: 500 }
    );
  }
}
