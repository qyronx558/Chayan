"use client"

import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { paperShadow, seeded } from "@/components/desk/DeskKit"
import type { Milestone } from "@/lib/profile"

const INKS = ["oklch(50% 0.12 150)", "var(--hs-pvt)", "var(--hs-gov)", "oklch(50% 0.11 300)", "var(--hs-trust)"]

export function MilestonesCard({ milestones }: { milestones: Milestone[] }) {
  const earned = milestones.filter((m) => m.unlocked).length
  return (
    <section aria-label="Stamps earned" className="rounded-[4px] bg-[var(--hs-paper-slip)] px-5 pb-5 pt-4" style={{ boxShadow: paperShadow }}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={cn(typeFont.className, "text-[11px] font-bold tracking-[0.16em] text-muted-foreground")}>STAMPS EARNED</h2>
        <span className={cn(handFont.className, "text-[15px] text-muted-foreground")}>
          {earned} of {milestones.length}
        </span>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4">
        {milestones.map((m, i) => {
          const angle = Math.round((seeded(m.key) - 0.5) * 16)
          const ink = INKS[i % INKS.length]
          return (
            <li key={m.key} className="flex min-h-[3.25rem] items-center justify-center text-center">
              {m.unlocked ? (
                <span
                  className={cn(typeFont.className, "inline-block rounded-[5px] border-[2.5px] px-2 py-1 text-[11px] font-bold leading-tight opacity-85")}
                  style={{ color: ink, borderColor: ink, transform: `rotate(${angle}deg)` }}
                >
                  {m.label.toUpperCase()}
                </span>
              ) : (
                <span
                  className="inline-flex flex-col items-center rounded-[5px] border-[1.5px] border-dashed border-[var(--hs-border-strong)] px-2 py-1"
                  title={m.unlockHint}
                >
                  <span className={cn(typeFont.className, "text-[10.5px] font-bold leading-tight text-muted-foreground/70")}>{m.label.toUpperCase()}</span>
                  <span className={cn(handFont.className, "mt-0.5 text-[12.5px] leading-tight text-muted-foreground")}>{m.unlockHint.replace(/ to unlock\.$/, "")}</span>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
