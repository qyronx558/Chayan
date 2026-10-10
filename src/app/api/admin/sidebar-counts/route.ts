import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const adminOnly = { createdBy: { role: "ADMIN" as const } };
    const delegates = [
      "job",
      "privateJob",
      "result",
      "admitCard",
      "answerKey",
      "admission",
      "syllabus",
      "blogPost",
    ] as const;
    const db = prisma as unknown as Record<string, { count: (a: unknown) => Promise<number> }>;
    const [queue, scamReports] = await Promise.all([
      Promise.all(
        delegates.map((d) => db[d].count({ where: { moderation: "PENDING", ...adminOnly } }).catch(() => 0))
      ).then((ns) => ns.reduce((s, n) => s + n, 0)),
      prisma.jobReport.count({ where: { status: "PENDING" } }).catch(() => 0),
    ]);
    return NextResponse.json({ success: true, data: { scamReports, needsReview: queue } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load counts" },
      { status: 500 }
    );
  }
}
