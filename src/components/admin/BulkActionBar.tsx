"use client"

import { Button } from "@/components/ui/button"
import { X, Trash2, Download } from "lucide-react"

interface BulkActionBarProps {
  selectedCount: number
  onClear: () => void
  onDelete: () => void
  onExport: () => void
  deleting?: boolean
}

export function BulkActionBar({ selectedCount, onClear, onDelete, onExport, deleting }: BulkActionBarProps) {
  if (selectedCount === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm dark:border-teal-900 dark:bg-teal-950/60">
      <span className="font-medium text-teal-800 dark:text-teal-200">
        {selectedCount} selected
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button type="button" size="sm" variant="outline" onClick={onExport} className="h-7 bg-white text-xs dark:bg-gray-900">
          <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
        </Button>
        <Button type="button" size="sm" variant="destructive" onClick={onDelete} disabled={deleting} className="h-7 text-xs">
          <Trash2 className="mr-1 h-3.5 w-3.5" /> {deleting ? "Deleting..." : "Delete"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClear} className="h-7 text-xs">
          <X className="mr-1 h-3.5 w-3.5" /> Clear
        </Button>
      </div>
    </div>
  )
}
