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
    <section className={cn("rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-800 dark:bg-gray-900", className)}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">{title}</h3>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
