import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { countOlderThan, getRetentionState, purgeOlderThan } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const days = Math.max(1, parseInt(new URL(request.url).searchParams.get("days") || "30", 10) || 30);
  const [affected, policy] = await Promise.all([countOlderThan(days), getRetentionState()]);
  return NextResponse.json({ success: true, data: { days, affected, legalHold: policy.legalHold } });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  let body: { days?: number; confirm?: string; archive?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const days = body.days === 7 || body.days === 30 || body.days === 90 ? body.days : 0;
  if (!days) return NextResponse.json({ success: false, error: "days must be 7, 30 or 90" }, { status: 400 });
  if (body.confirm !== "DELETE") return NextResponse.json({ success: false, error: "Type DELETE to confirm" }, { status: 400 });
  try {
    const policy = await getRetentionState();
    const data = await purgeOlderThan({
      days,
      actorId: session.user.id,
      actorEmail: session.user.email ?? null,
      actorRole: session.user.role,
      archive: body.archive ?? policy.archiveBeforeDelete,
    });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const status = (err as Error & { status?: number }).status ?? 500;
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Purge failed" }, { status });
  }
}
