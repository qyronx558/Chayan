"use client"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { shortAdminId } from "@/lib/roles"
import { Check, Copy } from "lucide-react"

/** Unique Admin ID badge - the canonical User.id (cuid), truncated with copy. */
export function AdminIdBadge({ id, className = "" }: { id?: string | null; className?: string }) {
  const [copied, setCopied] = useState(false)
  if (!id) return <span className="text-gray-400">-</span>
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Badge variant="outline" className="font-mono text-[11px]" title={id}>
        {shortAdminId(id)}
      </Badge>
      <button
        type="button"
        aria-label="Copy admin ID"
        title="Copy full Admin ID"
        className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        onClick={async (e) => {
          e.stopPropagation()
          try {
            await navigator.clipboard.writeText(id)
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
          } catch {
            // clipboard unavailable - no-op
          }
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  )
}
