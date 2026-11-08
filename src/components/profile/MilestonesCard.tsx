"use client"

import { Award, CheckCircle2, Lock } from "lucide-react"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Milestone } from "@/lib/profile"

interface MilestonesCardProps {
  milestones: Milestone[]
}

export function MilestonesCard({ milestones }: MilestonesCardProps) {
  const unlocked = milestones.filter((m) => m.unlocked).length
  return (
    <DataCard
      title="Milestones"
      subtitle={`${unlocked} of ${milestones.length} unlocked`}
      action={<Award className="h-4 w-4 text-brick dark:text-brick" aria-hidden="true" />}
    >
      <TooltipProvider>
        <ul className="space-y-2">
          {milestones.map((m) => (
            <li
              key={m.key}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm",
                m.unlocked
                  ? "border-rule bg-paper-3/[0.04] dark:border-rule dark:bg-paper-3/[0.06]"
                  : "border-rule bg-paper-2/60 opacity-80  dark:bg-background/[0.03]"
              )}
            >
              {m.unlocked ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brick dark:text-brick" aria-label={`${m.label} unlocked`} />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label={`${m.label} locked`} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-52 text-xs">{m.unlockHint}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <span className={cn("font-medium", m.unlocked ? "text-foreground dark:text-paper" : "text-muted-foreground dark:text-muted-foreground")}>
                {m.label}
              </span>
              {!m.unlocked ? <span className="ml-auto text-[11px] text-muted-foreground">Locked</span> : null}
            </li>
          ))}
        </ul>
      </TooltipProvider>
    </DataCard>
  )
}
