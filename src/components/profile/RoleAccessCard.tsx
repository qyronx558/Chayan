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
              ? "border-rule bg-paper-3 text-brick dark:border-rule dark:bg-paper-3 dark:text-brick"
              : "border-rule bg-paper-3 text-muted-foreground  dark:bg-background/10 dark:text-muted-foreground"
          )}
        >
          {roleLabel(role)}
        </span>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground dark:text-muted-foreground">Sections this admin can edit</p>
          <div className="flex flex-wrap gap-1.5">
            {sections.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
          Moderation and role changes need a super admin.
        </p>
      </div>
    </DataCard>
  )
}
