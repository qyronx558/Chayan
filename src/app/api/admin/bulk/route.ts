import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, isSuperAdmin } from "@/lib/roles";
import { REVIEWABLE_META, staffAudit, type ReviewableEntity } from "@/lib/moderation";
import { can } from "@/lib/admin/access";
import { revalidatePublicContent } from "@/lib/cache";

const MODULES = Object.keys(REVIEWABLE_META) as ReviewableEntity[];

const POLICY_MODULES: ReviewableEntity[] = ["Job", "Result", "AdmitCard", "AnswerKey", "Admission", "Syllabus", "Blog"];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const { module, ids, action, note, data } = body as {
      module?: string;
      ids?: string[];
      action?: string;
      note?: string;
      data?: Record<string, unknown>;
    };

    if (!module || !MODULES.includes(module as ReviewableEntity)) {
      return NextResponse.json({ success: false, error: "Invalid module" }, { status: 400 });
    }
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200) {
      return NextResponse.json({ success: false, error: "Provide 1-200 ids" }, { status: 400 });
    }
    const entity = module as ReviewableEntity;
    const meta = REVIEWABLE_META[entity];
    const delegate = (prisma as unknown as Record<string, {
      findMany: (a: unknown) => Promise<{ id: string; createdById?: string | null; slug?: string }[]>;
      updateMany: (a: unknown) => Promise<{ count: number }>;
      deleteMany: (a: unknown) => Promise<{ count: number }>;
    }>)[meta.delegate];
    if (!delegate) return NextResponse.json({ success: false, error: "Unsupported module" }, { status: 400 });

    const superAdmin = isSuperAdmin(session.user.role);

    // Ownership scope: ADMIN can only touch own rows.
    const rows = await delegate.findMany({
      where: { id: { in: ids } },
      select: { id: true, createdById: true, slug: true },
    });
    const allowed = superAdmin ? rows : rows.filter((r) => r.createdById === session.user.id);
    if (allowed.length === 0) {
      return NextResponse.json({ success: false, error: "No permitted rows in selection" }, { status: 403 });
    }
    const allowedIds = allowed.map((r) => r.id);

    if (action === "approve" || action === "reject") {
      if (POLICY_MODULES.includes(entity)) {
        if (!can(session.user.role, entity, action === "approve" ? "verify" : "reject")) {
          return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }
      } else if (!superAdmin) {
        return NextResponse.json({ success: false, error: "Only super admins can approve/reject" }, { status: 403 });
      }
      if (action === "reject" && !note?.trim()) {
        return NextResponse.json({ success: false, error: "Rejection requires a note" }, { status: 400 });
      }
      const moderation = action === "approve" ? "APPROVED" : "REJECTED";
      const res = await delegate.updateMany({
        where: { id: { in: allowedIds } },
        data: {
          moderation,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNote: note?.trim() ? note.trim().slice(0, 2000) : null,
        },
      });
      await staffAudit({
        action: action === "approve" ? "BULK_APPROVE" : "BULK_REJECT",
        entity,
        entityId: `${res.count} items`,
        user: session.user,
        note: `${moderation} ${res.count} ${entity}${note ? `: ${note.slice(0, 300)}` : ""}`,
      });
      try { revalidatePublicContent(meta.revalidateKey); } catch { /* best-effort */ }
      return NextResponse.json({ success: true, data: { updated: res.count } });
    }

    if (action === "submit") {
      if (!POLICY_MODULES.includes(entity)) {
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
      }
      if (!can(session.user.role, entity, "submit")) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
      const res = await delegate.updateMany({
        where: { id: { in: allowedIds } },
        data: {
          moderation: "PENDING",
          reviewedById: null,
          reviewedAt: null,
          reviewNote: null,
        },
      });
      await staffAudit({
        action: "BULK_SUBMIT",
        entity,
        entityId: `${res.count} items`,
        user: session.user,
        note: `Submitted ${res.count} ${entity} for review`,
      });
      try { revalidatePublicContent(meta.revalidateKey); } catch { /* best-effort */ }
      return NextResponse.json({ success: true, data: { updated: res.count } });
    }

    if (action === "delete") {
      if (POLICY_MODULES.includes(entity) && !can(session.user.role, entity, "delete")) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
      // Clear dependents first: several relations (Bookmark, JobView, optional
      // job links) have no onDelete cascade, so a raw deleteMany would fail
      // with a foreign-key violation. Mirrors the single-delete routes.
      const cleanup: unknown[] = [];
      const db = prisma as unknown as Record<string, { deleteMany: (a: unknown) => unknown; updateMany: (a: unknown) => unknown }>;
      if (entity === "Job") {
        cleanup.push(
          db.jobView.deleteMany({ where: { jobId: { in: allowedIds } } }),
          db.bookmark.deleteMany({ where: { jobId: { in: allowedIds } } }),
          db.result.updateMany({ where: { jobId: { in: allowedIds } }, data: { jobId: null } }),
          db.admitCard.updateMany({ where: { jobId: { in: allowedIds } }, data: { jobId: null } }),
          db.answerKey.updateMany({ where: { jobId: { in: allowedIds } }, data: { jobId: null } }),
          db.syllabus.updateMany({ where: { jobId: { in: allowedIds } }, data: { jobId: null } }),
        );
      } else if (entity === "PrivateJob") {
        cleanup.push(db.bookmark.deleteMany({ where: { privateJobId: { in: allowedIds } } }));
      } else if (entity === "Result") {
        cleanup.push(db.bookmark.deleteMany({ where: { resultId: { in: allowedIds } } }));
      } else if (entity === "AdmitCard") {
        cleanup.push(db.bookmark.deleteMany({ where: { admitCardId: { in: allowedIds } } }));
      } else if (entity === "Syllabus") {
        cleanup.push(db.bookmark.deleteMany({ where: { syllabusId: { in: allowedIds } } }));
      }
      // AnswerKey / Admission / Blog have no dependents - direct delete.
      try {
        if (cleanup.length > 0) {
          await (prisma.$transaction as (ops: unknown[]) => Promise<unknown[]>)(cleanup);
        }
        const res = await delegate.deleteMany({ where: { id: { in: allowedIds } } });
        await staffAudit({
          action: "BULK_DELETE",
          entity,
          entityId: `${res.count} items`,
          user: session.user,
          note: `Bulk deleted ${res.count} ${entity}`,
        });
        try { revalidatePublicContent(meta.revalidateKey); } catch { /* best-effort */ }
        return NextResponse.json({ success: true, data: { deleted: res.count } });
      } catch (e) {
        const code = (e as { code?: string })?.code;
        if (code === "P2003") {
          return NextResponse.json(
            { success: false, error: "Cannot delete: some items are still linked elsewhere" },
            { status: 409 }
          );
        }
        throw e;
      }
    }

    // Status bulk edit - only models with a `status` column support this.
    const statusMap: Record<string, string> = {
      publish: "ACTIVE",
      expire: "EXPIRED",
      upcoming: "UPCOMING",
    };
    if (action && action in statusMap) {
      const status = statusMap[action];
      // AnswerKey/Result/AdmitCard/Admission/Syllabus use free-text status; Job/PrivateJob enums.
      // Prisma updateMany with unknown enum value throws - guard Job/PrivateJob vs others.
      const res = await delegate.updateMany({
        where: { id: { in: allowedIds } },
        data: { status, ...(data ?? {}) },
      });
      await staffAudit({
        action: "BULK_UPDATE",
        entity,
        entityId: `${res.count} items`,
        user: session.user,
        note: `Bulk ${action} (${status}) ${res.count} ${entity}`,
      });
      try { revalidatePublicContent(meta.revalidateKey); } catch { /* best-effort */ }
      return NextResponse.json({ success: true, data: { updated: res.count } });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Bulk action failed" },
      { status: 500 }
    );
  }
}
