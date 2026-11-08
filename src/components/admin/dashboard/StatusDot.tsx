import { cn } from "@/lib/utils"

const TONES: Record<string, string> = {
  APPROVED: "bg-paper-3",
  PUBLISHED: "bg-paper-3",
  ACTIVE: "bg-paper-3",
  PENDING: "bg-paper-2",
  NEEDS: "bg-paper-2",
  REJECTED: "bg-paper-2",
  EXPIRED: "bg-paper-3 dark:bg-ink-2",
  UPCOMING: "bg-paper-3",
  DRAFT: "bg-paper-3",
}

const LABELS: Record<string, string> = {
  APPROVED: "Published",
  PUBLISHED: "Published",
  ACTIVE: "Active",
  PENDING: "Pending",
  NEEDS: "Pending",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  UPCOMING: "Upcoming",
  DRAFT: "Draft",
}

export function StatusDot({ value, className }: { value: string; className?: string }) {
  const key = value.toUpperCase()
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground dark:text-muted-foreground",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", TONES[key] ?? "bg-paper-3 dark:bg-ink-2")} />
      {LABELS[key] ?? value}
    </span>
  )
}
