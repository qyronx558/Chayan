"use client"
import { ShieldCheck, ShieldAlert, ShieldQuestion, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function TrustBadge({ score, reasons, size = "md" }: { score: number; reasons?: string[]; size?: "sm" | "md" }) {
 const label = score >= 75 ? "Verified" : score >= 50 ? "Trusted" : score >= 30 ? "Unverified" : "Risky"
 const Icon = score >= 75 ? BadgeCheck : score >= 50 ? ShieldCheck : score >= 30 ? ShieldQuestion : ShieldAlert
 const cls =
  score >= 75 ? "bg-paper-3 text-foreground border-rule"
  : score >= 50 ? "bg-paper-3 text-brick border-rule"
  : score >= 30 ? "bg-paper-2 text-brick border-rule"
  : "bg-paper-2 text-brick border-brick"
 return (
  <TooltipProvider>
   <Tooltip>
    <TooltipTrigger asChild>
     <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold", size === "sm" ? "text-[10px]" : "text-[11px]", cls)}>
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {label} · {score}
     </span>
    </TooltipTrigger>
    <TooltipContent className="max-w-[260px]">
     <p className="mb-1 text-xs font-bold">Why this score?</p>
     <ul className="list-disc pl-4 text-xs">
      {(reasons || []).map((r) => <li key={r}>{r}</li>)}
      {(!reasons || reasons.length === 0) && <li>Scored from apply-link, company domain and scam signals.</li>}
     </ul>
    </TooltipContent>
   </Tooltip>
  </TooltipProvider>
 )
}
