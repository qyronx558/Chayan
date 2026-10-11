import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";

const delegates = ["job", "result", "admitCard", "answerKey", "admission", "syllabus"] as const;

const MIX_KEYS = ["job", "result", "admitCard", "answerKey", "admission", "syllabus"] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const rangeRaw = searchParams.get("range") || "30D";
    const days = rangeRaw === "7D" ? 7 : rangeRaw === "90D" ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    const rows = await Promise.all(
      admins.map(async (a) => {
        const counts = await Promise.all(
          delegates.map((d) =>
            (prisma as unknown as Record<string, { count: (a: unknown) => Promise<number> }>)[d]
              .count({ where: { createdById: a.id, createdAt: { gte: since } } })
              .catch(() => 0)
          )
        );
        const pending = await Promise.all(
          delegates.map((d) =>
            (prisma as unknown as Record<string, { count: (a: unknown) => Promise<number> }>)[d]
              .count({ where: { createdById: a.id, moderation: "PENDING" } })
              .catch(() => 0)
          )
        );
        const total = counts.reduce((s, n) => s + n, 0);
        const pendingTotal = pending.reduce((s, n) => s + n, 0);
        return { ...a, total, pendingTotal, byType: Object.fromEntries(delegates.map((d, i) => [d, counts[i]])) };
      })
    );

    rows.sort((x, y) => y.total - x.total);
    const totals = rows.reduce((s, r) => s + r.total, 0);
    const pending = rows.reduce((s, r) => s + r.pendingTotal, 0);
    return NextResponse.json({
      success: true,
      data: rows,
      meta: { range: rangeRaw, days, modules: MIX_KEYS.length, employees: rows.length, totalUploads: totals, pending },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load team performance" },
      { status: 500 }
    );
  }
}
