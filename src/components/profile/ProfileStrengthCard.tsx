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
          <span className="font-bold tabular-nums text-foreground dark:text-paper">{pct}%</span>
          <span className="text-xs text-muted-foreground dark:text-muted-foreground">
            {done}/{total} steps
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-paper-3 dark:bg-background/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile strength">
          <div className="h-full rounded-full bg-paper-3 transition-all dark:bg-paper-3" style={{ width: `${pct}%` }} />
        </div>
        <ul className="space-y-1.5">
          {steps.map((s) => (
            <li key={s.key} className="flex items-center gap-2 text-sm">
              {s.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brick dark:text-brick" aria-label="Done" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground dark:text-muted-foreground" aria-label="Not done" />
              )}
              <span className={cn("min-w-0 flex-1 truncate", s.done ? "text-foreground dark:text-muted-foreground" : "text-muted-foreground dark:text-muted-foreground")}>
                {s.label}
              </span>
              {!s.done && s.actionLabel ? (
                <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs text-brick hover:text-brick dark:text-brick" onClick={() => onJump(s)}>
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
