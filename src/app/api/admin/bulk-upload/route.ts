import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { writeAuditLog } from "@/lib/moderation"
import { revalidatePublicContent } from "@/lib/cache"
import { BULK_MAX_ROWS, isBulkModuleId } from "@/lib/bulk-upload/modules"
import {
  ENTITY_LABEL,
  REVALIDATE_KIND,
  importContent,
  importTaxonomy,
  type BulkRowError,
} from "@/lib/bulk-upload/import"

async function checkSuperAdmin(): Promise<NextResponse | null> {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  return null
}

export async function POST(req: NextRequest) {
  const unauthorized = await checkSuperAdmin()
  if (unauthorized) return unauthorized
  const session = (await auth())!

  const body = (await req.json().catch(() => null)) as {
    module?: unknown
    rows?: unknown
  } | null
  if (!body || !isBulkModuleId(body.module) || !Array.isArray(body.rows)) {
    return NextResponse.json({ success: false, error: "Invalid payload. Send { module, rows }." }, { status: 400 })
  }
  const moduleId = body.module
  const rows = body.rows as Record<string, unknown>[]
  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: "No data rows found in the file." }, { status: 400 })
  }
  if (rows.length > BULK_MAX_ROWS) {
    return NextResponse.json(
      { success: false, error: `Too many rows (${rows.length}). Maximum ${BULK_MAX_ROWS} per upload.` },
      { status: 400 }
    )
  }

  let imported = 0
  let skipped = 0
  const errors: BulkRowError[] = []
  const counters = { newDepartments: 0, newCategories: 0 }

  try {
    if (moduleId === "categories" || moduleId === "departments") {
      const out = await importTaxonomy(moduleId, rows)
      imported = out.imported
      skipped = out.skipped
      errors.push(...out.errors)
    } else {
      const out = await importContent(moduleId, rows, session.user.id, counters)
      imported = out.imported
      skipped = out.skipped
      errors.push(...out.errors)
    }

    await writeAuditLog({
      action: "BULK_CREATE",
      entity: ENTITY_LABEL[moduleId],
      entityId: "bulk-upload",
      userId: session.user.id,
      details: `Bulk upload ${moduleId}: imported=${imported} skipped=${skipped} errors=${errors.length} newDepartments=${counters.newDepartments} newCategories=${counters.newCategories} by ${session.user.email}`,
    })

    if (moduleId !== "categories" && moduleId !== "departments") {
      try {
        revalidatePublicContent(REVALIDATE_KIND[moduleId])
      } catch {
        // revalidation is best-effort
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        module: moduleId,
        total: rows.length,
        imported,
        skipped,
        newDepartments: counters.newDepartments,
        newCategories: counters.newCategories,
        errors: errors.slice(0, 50),
      },
    })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Bulk import failed" },
      { status: 500 }
    )
  }
}
