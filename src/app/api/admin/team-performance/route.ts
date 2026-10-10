import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";

/** Team performance: per-admin uploads, pending, approval rate - SUPER_ADMIN only. */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    const delegates = ["job", "result", "admitCard", "answerKey", "admission", "syllabus"] as const;
    const rows = await Promise.all(
      admins.map(async (a) => {
        const counts = await Promise.all(
          delegates.map((d) =>
            (prisma as unknown as Record<string, { count: (a: unknown) => Promise<number> }>)[d]
              .count({ where: { createdById: a.id } })
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
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load team performance" },
      { status: 500 }
    );
  }
}
