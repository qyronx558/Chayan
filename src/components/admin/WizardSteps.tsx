"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface WizardStepsProps {
  steps: string[]
  current: number
  onGo: (index: number) => void
}

export function WizardSteps({ steps, current, onGo }: WizardStepsProps) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onGo(i)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-rule bg-paper-3 text-paper "
                  : done
                    ? "border-rule bg-paper-3 text-brick dark:border-rule dark:bg-paper-3 dark:text-brick"
                    : "border-rule bg-background text-muted-foreground hover:border-rule dark:border-ink dark:bg-ink"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                  active ? "bg-background/20 text-paper" : done ? "bg-paper-3 text-paper" : "bg-paper-3 text-muted-foreground dark:bg-ink"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {label}
            </button>
            {i < steps.length - 1 && <span className="hidden h-px w-4 bg-paper-3 sm:block dark:bg-ink" />}
          </li>
        )
      })}
    </ol>
  )
}
