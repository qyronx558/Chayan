"use client"

import { cn } from "@/lib/utils"

interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn("rounded-xl border border-rule bg-background p-4  sm:p-5 dark:border-ink dark:bg-ink", className)}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-tight text-foreground dark:text-paper">{title}</h3>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
