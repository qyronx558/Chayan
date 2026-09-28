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
                  ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                  : done
                    ? "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-300"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                  active ? "bg-white/20 text-white" : done ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {label}
            </button>
            {i < steps.length - 1 && <span className="hidden h-px w-4 bg-gray-200 sm:block dark:bg-gray-700" />}
          </li>
        )
      })}
    </ol>
  )
}
