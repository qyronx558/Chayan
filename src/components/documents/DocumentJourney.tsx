import Link from "next/link"
import { Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { JourneyStage } from "@/lib/doc-journey"

/**
 * "Where is this recruitment now?" - every stage that is out is one tap away,
 * every stage that is not is shown honestly as pending.
 */
export function DocumentJourney({ stages, className }: { stages: JourneyStage[]; className?: string }) {
 return (
  <nav aria-label="Recruitment journey" className={cn("border border-rule bg-card", className)}>
   <div className="flex items-center justify-between border-b border-rule px-4 py-2.5 sm:px-5">
    <h2 className="font-display text-base font-bold text-foreground">Recruitment journey</h2>
    <span className="agate text-[11px] text-muted-foreground">
     {stages.filter((s) => s.href).length} of {stages.length} stages out
    </span>
   </div>
   <ol className="grid grid-cols-2 sm:grid-cols-5">
    {stages.map((s, i) => {
     const out = Boolean(s.href)
     const body = (
      <>
       <span
        className={cn(
         "flex h-6 w-6 items-center justify-center border text-[11px]",
         s.current ? "border-brick bg-brick text-brick-ink" : out ? "border-ink bg-ink text-paper" : "border-rule text-muted-foreground",
        )}
       >
        {out ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3 w-3" />}
       </span>
       <span className="mt-2 block text-sm font-semibold text-foreground">{s.label}</span>
       <span className={cn("agate mt-0.5 block text-[11px]", s.current ? "text-brick" : "text-muted-foreground")}>
        {s.current ? "You are here" : out ? "Out - open" : "Not released yet"}
       </span>
      </>
     )
     const cell = cn(
      "block border-rule px-4 py-3 sm:border-l sm:first:border-l-0",
      i >= 2 && "border-t sm:border-t-0",
      i > 0 && i % 2 === 1 && "border-l sm:border-l",
     )
     return (
      <li key={s.key} className="contents">
       {out && !s.current ? (
        <Link href={s.href!} title={s.title ?? undefined} className={cn(cell, "transition-colors hover:bg-paper-2")}>
         {body}
        </Link>
       ) : (
        <div className={cn(cell, s.current && "bg-paper-2")} aria-current={s.current ? "step" : undefined}>
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
