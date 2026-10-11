import { NextRequest, NextResponse } from "next/server";
import { getMine } from "@/lib/analytics/service";
import { cacheHeaders, cached, requireStaff } from "@/lib/analytics/guards";
import { parseRangeKey } from "@/lib/analytics/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { error, session } = await requireStaff();
  if (error || !session) return error ?? NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const range = parseRangeKey(new URL(request.url).searchParams.get("range"));
  try {
    const data = await cached(`analytics:mine:${session.user.id}:${range}`, 60_000, () => getMine(session.user.id, range));
    return NextResponse.json({ success: true, data }, { headers: cacheHeaders() });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 }
    );
  }
}
