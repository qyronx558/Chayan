"use client"
import { Badge } from "@/components/ui/badge"
import { AdminIdBadge } from "@/components/admin/AdminIdBadge"
import { cn } from "@/lib/utils"

interface UploaderCellProps {
  name?: string | null
  email?: string | null
  id?: string | null
  role?: string | null
  compact?: boolean
}

/**
 * "Uploaded by" table cell — uploader name + SUPER/ADMIN role badge + Admin ID.
 * Bulk-uploaded rows show the super-admin account with a SUPER badge.
 */
export function UploaderCell({ name, email, id, role, compact = false }: UploaderCellProps) {
  const label = name || email || "-"
  const isSuper = role === "SUPER_ADMIN"
  return (
    <div>
      <p className={cn("whitespace-nowrap text-gray-600 dark:text-gray-400", compact ? "text-sm" : "text-xs")}>
        {label}
      </p>
      <span className="mt-0.5 flex flex-wrap items-center gap-1">
        {role ? (
          <Badge
            variant="secondary"
            title={role === "SUPER_ADMIN" ? "Uploaded by Super Admin" : "Uploaded by Admin"}
            className={cn(
              "border-0 px-1.5 py-0 text-[10px] font-bold uppercase tracking-wide",
              isSuper ? "bg-teal-100 text-teal-700" : "bg-slate-200/80 text-slate-600"
            )}
          >
            {isSuper ? "Super" : "Admin"}
          </Badge>
        ) : null}
        <AdminIdBadge id={id} />
      </span>
    </div>
  )
}
