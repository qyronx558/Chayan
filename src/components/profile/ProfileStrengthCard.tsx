"use client"

import { CheckCircle2, Circle } from "lucide-react"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { StrengthStep } from "@/lib/profile"

interface ProfileStrengthCardProps {
  pct: number
  done: number
  total: number
  steps: StrengthStep[]
  onJump: (step: StrengthStep) => void
}

export function ProfileStrengthCard({ pct, done, total, steps, onJump }: ProfileStrengthCardProps) {
  return (
    <DataCard title="Profile strength" subtitle={`${done} of ${total} complete`}>
      <div id="profile-strength" className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold tabular-nums text-slate-900 dark:text-slate-50">{pct}%</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {done}/{total} steps
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile strength">
          <div className="h-full rounded-full bg-teal-700 transition-all dark:bg-teal-500" style={{ width: `${pct}%` }} />
        </div>
        <ul className="space-y-1.5">
          {steps.map((s) => (
            <li key={s.key} className="flex items-center gap-2 text-sm">
              {s.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" aria-label="Done" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" aria-label="Not done" />
              )}
              <span className={cn("min-w-0 flex-1 truncate", s.done ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400")}>
                {s.label}
              </span>
              {!s.done && s.actionLabel ? (
                <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs text-teal-700 hover:text-teal-800 dark:text-teal-300" onClick={() => onJump(s)}>
                  {s.actionLabel}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </DataCard>
  )
}
