import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { getExportSchedule, saveExportSchedule } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ success: true, data: await getExportSchedule() });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  let body: { enabled?: boolean; frequency?: string; format?: string; recipients?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const format = body.format === "JSON" ? "JSON" : "CSV";
  const recipients = Array.isArray(body.recipients) ? body.recipients.filter((r) => typeof r === "string" && r.includes("@")).slice(0, 10) : [];
  const data = await saveExportSchedule({
    enabled: body.enabled ?? false,
    frequency: body.frequency === "DAILY" ? "DAILY" : "WEEKLY",
    format: format as "CSV" | "JSON",
    recipients,
    actorId: session.user.id,
    actorRole: session.user.role,
  });
  return NextResponse.json({ success: true, data });
}
