import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DataCardProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function DataCard({ title, subtitle, action, children, className }: DataCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-rule bg-background  ",
        className
      )}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground dark:text-paper">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground dark:text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">{children}</div>
    </section>
  )
}
