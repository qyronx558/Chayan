import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { computeInsights } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const daysRaw = new URL(request.url).searchParams.get("days") || "30";
  const days = daysRaw === "14" ? 14 : daysRaw === "90" ? 90 : 30;
  try {
    const data = await computeInsights(days);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to compute insights" }, { status: 500 });
  }
}
