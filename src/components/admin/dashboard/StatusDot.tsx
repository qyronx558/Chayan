import { cn } from "@/lib/utils"

const TONES: Record<string, string> = {
  APPROVED: "bg-emerald-500",
  PUBLISHED: "bg-emerald-500",
  ACTIVE: "bg-emerald-500",
  PENDING: "bg-amber-400",
  NEEDS: "bg-amber-400",
  REJECTED: "bg-rose-500",
  EXPIRED: "bg-slate-300 dark:bg-slate-600",
  UPCOMING: "bg-sky-400",
  DRAFT: "bg-sky-400",
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
        "inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", TONES[key] ?? "bg-slate-300 dark:bg-slate-600")} />
      {LABELS[key] ?? value}
    </span>
  )
}
