import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REVIEWABLE_META, type ReviewableEntity } from "@/lib/moderation";

const MODULES = Object.keys(REVIEWABLE_META) as ReviewableEntity[];

const MODULE_LABELS: Record<ReviewableEntity, string> = {
  Job: "Gov Jobs",
  PrivateJob: "Private Jobs",
  Result: "Results",
  AdmitCard: "Admit Cards",
  AnswerKey: "Answer Keys",
  Admission: "Admissions",
  Syllabus: "Syllabus",
  Blog: "Blog",
};

type QueueRow = {
  id: string;
  title: string;
  slug: string;
  moderation: string | null;
  reviewNote: string | null;
  createdAt: Date;
  createdById: string | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  module: ReviewableEntity;
  moduleLabel: string;
};

function parseRange(v: string | null): number | null {
  if (!v) return null;
  const n = parseInt(v, 10);
  if (Number.isFinite(n) && n > 0 && n <= 365) return n;
  return null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const moderation = searchParams.get("moderation") || "";
  const moduleParam = searchParams.get("module") || "";
  const createdById = searchParams.get("createdById") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10) || 25));
  const days = parseRange(searchParams.get("days"));

  if (moderation && !["PENDING", "APPROVED", "REJECTED"].includes(moderation)) {
    return NextResponse.json({ success: false, error: "Invalid moderation" }, { status: 400 });
  }
  if (moduleParam && !(MODULES as string[]).includes(moduleParam)) {
    return NextResponse.json({ success: false, error: "Invalid module" }, { status: 400 });
  }

  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;
  const targetModules = moduleParam ? [moduleParam as ReviewableEntity] : MODULES;

  const searchOR = search
    ? [{ title: { contains: search, mode: "insensitive" as const } }, { slug: { contains: search, mode: "insensitive" as const } }]
    : null;

  const buildWhere = (mod: string | null): Record<string, unknown> => {
    const w: Record<string, unknown> = { createdBy: { role: "ADMIN" as const } };
    if (mod) w.moderation = mod;
    if (createdById) w.createdById = createdById;
    if (since) w.createdAt = { gte: since };
    if (searchOR) w.OR = searchOR;
    return w;
  };

  const countsByStatus: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  const countsByModule: Record<string, number> = {};
  const allRows: QueueRow[] = [];

  await Promise.all(
    MODULES.map(async (m) => {
      const meta = REVIEWABLE_META[m];
      const delegate = (prisma as unknown as Record<string, {
        groupBy: (a: unknown) => Promise<{ moderation: string; _count: number }[]>;
        findMany: (a: unknown) => Promise<Omit<QueueRow, "module" | "moduleLabel">[]>;
        count: (a: unknown) => Promise<number>;
      }>)[meta.delegate];
      if (!delegate) return;
      const baseWhere = buildWhere(null);
      const groups = await delegate.groupBy({ by: ["moderation"], where: baseWhere, _count: true }).catch(() => []);
      for (const g of groups) {
        if (g.moderation in countsByStatus) countsByStatus[g.moderation] += g._count;
      }
      if (!moduleParam || moduleParam === m) {
        const modWhere = buildWhere(moderation || null);
        const modCount = await delegate.count({ where: modWhere }).catch(() => 0);
        if (modCount > 0) countsByModule[m] = modCount;
        if (targetModules.includes(m)) {
          const rows = await delegate
            .findMany({
              where: modWhere,
              select: {
                id: true,
                title: true,
                slug: true,
                moderation: true,
                reviewNote: true,
                createdAt: true,
                createdById: true,
                createdBy: { select: { id: true, name: true, email: true } },
              },
              orderBy: { createdAt: "desc" },
              take: 600,
            })
            .catch(() => []);
          for (const r of rows) allRows.push({ ...r, module: m, moduleLabel: MODULE_LABELS[m] });
        }
      }
    })
  );

  allRows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total = allRows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const data = allRows.slice(start, start + limit);

  const modules = targetModules.length === 1
    ? Object.entries(countsByModule).map(([key, count]) => ({ key, label: MODULE_LABELS[key as ReviewableEntity], count }))
    : MODULES.filter((m) => (countsByModule[m] ?? 0) > 0).map((m) => ({
        key: m,
        label: MODULE_LABELS[m],
        count: countsByModule[m] ?? 0,
      }));

  return NextResponse.json({
    success: true,
    data,
    pagination: { page: safePage, limit, total, totalPages },
    counts: { pending: countsByStatus.PENDING, approved: countsByStatus.APPROVED, rejected: countsByStatus.REJECTED },
    modules,
  });
}
