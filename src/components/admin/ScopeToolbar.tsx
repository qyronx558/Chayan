"use client"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isSuperAdmin } from "@/lib/roles"

interface ScopeToolbarProps {
  role?: string | null
  scope: "mine" | "all"
  onScopeChange: (s: "mine" | "all") => void
  moderation: string
  onModerationChange: (m: string) => void
  adminId: string
  onAdminIdChange: (v: string) => void
}

/**
 * Super-admin verification toolbar: All/Mine scope, moderation filter,
 * and unique Admin ID (cuid) filter. Renders scope toggle only for super-admins.
 */
export function ScopeToolbar({
  role,
  scope,
  onScopeChange,
  moderation,
  onModerationChange,
  adminId,
  onAdminIdChange,
}: ScopeToolbarProps) {
  if (!isSuperAdmin(role)) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={scope} onValueChange={(v) => onScopeChange(v as "mine" | "all")}>
        <SelectTrigger className="w-[170px]" title="Content scope">
          <SelectValue placeholder="Scope" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mine">My uploads</SelectItem>
          <SelectItem value="all">Admin uploads (verify)</SelectItem>
        </SelectContent>
      </Select>
      <Select value={moderation || "all"} onValueChange={(v) => onModerationChange(v === "all" ? "" : v)}>
        <SelectTrigger className="w-[170px]" title="Moderation filter">
          <SelectValue placeholder="Moderation" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="PENDING">Pending review</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
        </SelectContent>
      </Select>
      {scope === "all" && (
        <Input
          className="w-[240px] font-mono text-xs"
          placeholder="Filter by Admin ID (cuid)…"
          value={adminId}
          onChange={(e) => onAdminIdChange(e.target.value.trim())}
          title="Paste a full or partial unique Admin ID"
        />
      )}
    </div>
  )
}
