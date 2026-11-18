import Link from "next/link"
import { Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"
import type { JourneyStage } from "@/lib/doc-journey"

/**
 * "Where is this recruitment now?" - every stage that is out is one tap away,
 * every stage that is not is shown honestly as pending.
 */
export function DocumentJourney({ stages, className }: { stages: JourneyStage[]; className?: string }) {
 const outCount = stages.filter((s) => s.href).length
 return (
  <nav aria-label="Recruitment journey" className={cn("relative rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] px-5 pb-5 pt-4 sm:px-7", className)} style={{ boxShadow: "0 1px 2px rgb(60 40 10 / .08), 0 16px 28px -22px rgb(60 40 10 / .55)" }}>
   <div className="flex flex-wrap items-baseline justify-between gap-2">
    <h2 className="font-display text-[1.15rem] font-black text-foreground">Recruitment journey</h2>
    <span className={cn(handFont.className, "text-[1rem] text-muted-foreground")}>
     {outCount} of {stages.length} stations reached
    </span>
   </div>
   {/* a railway route: stations on one line */}
   <ol className="relative mt-5 grid grid-cols-1 gap-y-1 sm:grid-cols-5 sm:gap-y-0">
    <span aria-hidden className="absolute bottom-3 left-[11px] top-3 w-[3px] rounded-full sm:bottom-auto sm:left-[10%] sm:right-[10%] sm:top-[10px] sm:h-[3px] sm:w-auto" style={{ background: "repeating-linear-gradient(90deg, var(--hs-border-strong) 0 10px, transparent 10px 14px)" }} />
    {stages.map((s) => {
     const out = Boolean(s.href)
     const body = (
      <>
       <span
        className={cn(
         "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[2.5px] bg-[var(--hs-paper-slip)]",
         s.current ? "border-[var(--color-brick)]" : out ? "border-foreground" : "border-[var(--hs-border-strong)] border-dashed",
        )}
       >
        {s.current ? <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-brick)]" /> : out ? <Check className="h-3 w-3 text-foreground" strokeWidth={3} /> : <Clock className="h-2.5 w-2.5 text-muted-foreground" />}
       </span>
       <span className="min-w-0 sm:mt-2 sm:text-center">
        <span className={cn("block text-[13.5px] font-semibold leading-tight", out || s.current ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
        <span className={cn(handFont.className, "block text-[0.95rem] leading-tight", s.current ? "text-[var(--color-brick)]" : "text-muted-foreground")}>
         {s.current ? "you are here" : out ? "out · open it" : "not yet"}
        </span>
       </span>
      </>
     )
     const cell = "flex items-center gap-3 rounded-[6px] px-0 py-1.5 sm:flex-col sm:items-center sm:gap-0 sm:px-1 sm:py-0"
     return (
      <li key={s.key} className="contents">
       {out && !s.current ? (
        <Link href={s.href!} title={s.title ?? undefined} className={cn(cell, "transition-colors hover:[&_span.block:first-child]:underline")}>
         {body}
        </Link>
       ) : (
        <div className={cell} aria-current={s.current ? "step" : undefined}>
         {body}
        </div>
       )}
      </li>
     )
    })}
   </ol>
  </nav>
 )
}
