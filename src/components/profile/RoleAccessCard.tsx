"use client"

import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { roleLabel } from "@/lib/profile"

interface RoleAccessCardProps {
  role: string
  sections: string[]
}

export function RoleAccessCard({ role, sections }: RoleAccessCardProps) {
  const admin = role === "ADMIN" || role === "SUPER_ADMIN"
  return (
    <DataCard title="Role and access" subtitle="What this account can manage">
      <div className="space-y-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            admin
              ? "border-teal-700/20 bg-teal-700/10 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300"
              : "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
          )}
        >
          {roleLabel(role)}
        </span>
        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Sections this admin can edit</p>
          <div className="flex flex-wrap gap-1.5">
            {sections.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Moderation and role changes need a super admin.
        </p>
      </div>
    </DataCard>
  )
}
