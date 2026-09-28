"use client"

import { Pencil, ExternalLink, Copy, Trash2, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"

interface RowActionsProps {
  onEdit: () => void
  viewHref?: string
  onCopy?: () => void
  copied?: boolean
  toggleLabel?: string
  onToggleStatus?: () => void
  toggling?: boolean
  onDelete: () => void
}

function IconBtn({ title, onClick, children, danger, href }: { title: string; onClick?: () => void; children: React.ReactNode; danger?: boolean; href?: string }) {
  const cls = cn(
    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
    danger && "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
  )
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" title={title} className={cls}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" title={title} onClick={onClick} className={cls}>
      {children}
    </button>
  )
}

export function RowActions({ onEdit, viewHref, onCopy, copied, toggleLabel, onToggleStatus, toggling, onDelete }: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <IconBtn title="Edit" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </IconBtn>
      {onToggleStatus && (
        <IconBtn title={toggleLabel ?? "Toggle status"} onClick={onToggleStatus}>
          <Repeat className={cn("h-4 w-4 text-teal-600", toggling && "animate-spin")} />
        </IconBtn>
      )}
      {viewHref && (
        <IconBtn title="View public page" href={viewHref}>
          <ExternalLink className="h-4 w-4" />
        </IconBtn>
      )}
      {onCopy && (
        <IconBtn title={copied ? "Copied!" : "Copy public link"} onClick={onCopy}>
          <Copy className={cn("h-4 w-4", copied && "text-green-600")} />
        </IconBtn>
      )}
      <IconBtn title="Delete" danger onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </IconBtn>
    </div>
  )
}
