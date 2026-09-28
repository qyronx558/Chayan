"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

interface AdminPageHeaderProps {
  title: string
  subtitle: string
  total?: number
  totalLabel?: string
  actionLabel: string
  onAction: () => void
}

export function AdminPageHeader({ title, subtitle, total, totalLabel = "total", actionLabel, onAction }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-50">{title}</h1>
          {typeof total === "number" && (
            <Badge variant="secondary" className="rounded-full tabular-nums">
              {total} {totalLabel}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      <Button onClick={onAction} className="shrink-0 shadow-sm">
        <Plus className="mr-1.5 h-4 w-4" /> {actionLabel}
      </Button>
    </div>
  )
}
