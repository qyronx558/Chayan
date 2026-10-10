import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, isSuperAdmin } from "@/lib/roles";
import { REVIEWABLE_META, defaultModerationForRole, writeAuditLog, type ReviewableEntity } from "@/lib/moderation";
import { revalidatePublicContent } from "@/lib/cache";

/**
 * Generic clone/duplicate for all reviewable modules.
 * POST { module, id } -> creates a copy with unique slug, PENDING for ADMIN, APPROVED for SUPER_ADMIN.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const { module, id } = body as { module?: string; id?: string };
    if (!module || !id) {
      return NextResponse.json({ success: false, error: "module and id required" }, { status: 400 });
    }
    const valid = (Object.keys(REVIEWABLE_META) as string[]).includes(module);
    if (!valid) return NextResponse.json({ success: false, error: "Invalid module" }, { status: 400 });

    const entity = module as ReviewableEntity;
    const meta = REVIEWABLE_META[entity];
    const delegate = (prisma as unknown as Record<string, {
      findUnique: (a: unknown) => Promise<Record<string, unknown> | null>;
      create: (a: unknown) => Promise<Record<string, unknown>>;
      findUniqueSlug: (a: unknown) => Promise<unknown>;
    }>)[meta.delegate];
    if (!delegate) return NextResponse.json({ success: false, error: "Unsupported module" }, { status: 400 });

    const existing = await delegate.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: `${meta.label} not found` }, { status: 404 });

    // Ownership: ADMIN can only clone own content.
    if (!isSuperAdmin(session.user.role) && (existing.createdById as string | undefined) !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const baseSlug = String(existing.slug ?? `copy-${Date.now()}`);
    let slug = `${baseSlug}-copy`;
    let n = 2;
    // Ensure unique slug (bounded loop for SaaS safety).
    for (let i = 0; i < 20; i++) {
      const clash = await (prisma as unknown as Record<string, { findUnique: (a: unknown) => Promise<unknown> }>)[
        meta.delegate
      ].findUnique({ where: { slug }, select: { id: true } }).catch(() => null);
      if (!clash) break;
      slug = `${baseSlug}-copy-${n++}`;
    }

    const { id: _omit, createdAt: _c, updatedAt: _u, reviewedById: _r, reviewedAt: _ra, ...rest } = existing;
    void _omit; void _c; void _u; void _r; void _ra;

    const created = (await delegate.create({
      data: {
        ...rest,
        title: `${String(existing.title ?? "Untitled")} (Copy)`,
        slug,
        moderation: defaultModerationForRole(session.user.role),
        createdById: session.user.id,
        reviewNote: null,
      },
    })) as { slug?: string; id?: string };

    await writeAuditLog({
      action: "CLONE",
      entity,
      entityId: String((created as { id?: string }).id ?? slug),
      userId: session.user.id,
      details: `Cloned ${entity} ${id} -> ${slug} by ${session.user.email}`,
    });
    try { if (created.slug) revalidatePublicContent(meta.revalidateKey, created.slug); } catch { /* best-effort */ }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Clone failed" },
      { status: 500 }
    );
  }
}
