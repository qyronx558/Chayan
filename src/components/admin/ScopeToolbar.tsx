"use client"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { isSuperAdmin } from "@/lib/roles"

interface ScopeToolbarProps {
  role?: string | null
  scope: "mine" | "all"
  onScopeChange: (s: "mine" | "all") => void
  moderation: string
  onModerationChange: (m: string) => void
  adminId: string
  onAdminIdChange: (v: string) => void
  queueOnly: boolean
  onQueueOnlyChange: (v: boolean) => void
}

/**
 * Super-admin listing toolbar: All/My uploads scope, moderation filter,
 * unique Admin ID (cuid) filter, and a verification-queue toggle.
 * Renders only for super-admins. Super-admin uploads (manual + bulk)
 * are listed in the main views; the queue toggle narrows to admin
 * uploads awaiting review.
 */
export function ScopeToolbar({
  role,
  scope,
  onScopeChange,
  moderation,
  onModerationChange,
  adminId,
  onAdminIdChange,
  queueOnly,
  onQueueOnlyChange,
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
          <SelectItem value="all">All uploads</SelectItem>
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
      <label
        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-rule bg-background px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-rule hover:text-brick dark:border-ink dark:bg-ink dark:text-muted-foreground"
        title="Show only admin uploads awaiting review (hides super-admin uploads)"
      >
        <Checkbox checked={queueOnly} onCheckedChange={(v) => onQueueOnlyChange(v === true)} />
        Verification queue
      </label>
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
