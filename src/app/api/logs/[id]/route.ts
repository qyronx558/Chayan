import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/roles";
import { fetchAuditById, projectForRole } from "@/lib/audit";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const event = await fetchAuditById(id);
  if (!event) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (!isSuperAdmin(session.user.role) && event.actorId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ success: true, data: projectForRole(event, session.user.role) });
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: "Audit events cannot be deleted." }, { status: 410 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, error: "Audit events cannot be edited." }, { status: 403 });
}

export async function PUT() {
  return NextResponse.json({ success: false, error: "Audit events cannot be edited." }, { status: 403 });
}
