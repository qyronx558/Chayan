import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { getRetentionState, saveRetentionState } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ success: true, data: await getRetentionState() });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  let body: { keepDays?: number | null; archiveBeforeDelete?: boolean; legalHold?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const allowed: (number | null)[] = [30, 90, 365, null];
  const keepDays = body.keepDays === undefined ? 90 : body.keepDays;
  if (!allowed.includes(keepDays)) return NextResponse.json({ success: false, error: "keepDays must be 30, 90, 365 or null" }, { status: 400 });
  const data = await saveRetentionState({
    keepDays,
    archiveBeforeDelete: body.archiveBeforeDelete ?? true,
    legalHold: body.legalHold ?? false,
    actorId: session.user.id,
    actorRole: session.user.role,
  });
  return NextResponse.json({ success: true, data });
}
