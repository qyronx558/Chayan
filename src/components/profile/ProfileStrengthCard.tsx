"use client"

import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"
import { DrawingPin, HandTick } from "@/components/desk/DeskKit"
import type { StrengthStep } from "@/lib/profile"

interface ProfileStrengthCardProps {
  pct: number
  done: number
  total: number
  steps: StrengthStep[]
  onJump: (step: StrengthStep) => void
}

export function ProfileStrengthCard({ done, total, steps, onJump }: ProfileStrengthCardProps) {
  const left = total - done
  const ordered = [...steps.filter((s) => !s.done), ...steps.filter((s) => s.done)]
  return (
    <section
      id="profile-strength"
      aria-label="Still to do"
      className="relative rotate-[0.6deg] rounded-[2px] px-5 pb-5 pt-7"
      style={{ background: "color-mix(in oklch, var(--hs-marigold) 30%, var(--hs-paper-slip))", boxShadow: "0 1px 1px rgb(60 40 10 / .1), 0 14px 20px -16px rgb(60 40 10 / .55)" }}
    >
      <DrawingPin className="left-1/2 top-2 -translate-x-1/2" hue={150} />
      <h2 className={cn(handFont.className, "text-2xl text-foreground")}>{left ? "Still to do" : "All done!"}</h2>
      <p className={cn(handFont.className, "text-[15px] text-foreground/70")}>
        {left ? `${left} small thing${left > 1 ? "s" : ""}, then your file is complete.` : "Your file is complete. Nice work."}
      </p>
      <ul className="mt-3 space-y-1.5">
        {ordered.map((s) => (
          <li key={s.key} className="flex items-start gap-2">
            <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-current text-foreground/50" aria-hidden>
              {s.done ? <HandTick className="h-5 w-5 -translate-y-0.5 text-[oklch(48%_0.12_150)]" draw={false} /> : null}
            </span>
            {s.done ? (
              <span className={cn(handFont.className, "text-[16px] text-foreground/55 line-through decoration-foreground/40")}>
                {s.label}
                <span className="sr-only"> (done)</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onJump(s)}
                className={cn(handFont.className, "text-left text-[16px] text-foreground underline decoration-dotted decoration-foreground/40 underline-offset-4 hover:decoration-solid focus-visible:outline-none focus-visible:decoration-solid")}
              >
                {s.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
