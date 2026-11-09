import Link from "next/link"
import { cn } from "@/lib/utils"

export function LogoSmall({ className, href = "/" }: { className?: string; href?: string }) {
 return (
  <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
   <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brick shadow-[0_1px_3px_rgba(0,0,0,.15)] transition-transform group-hover:scale-105">
    <svg viewBox="0 0 80 80" className="h-5 w-5">
     <path
      d="M20 44 L32 56 L58 26"
      fill="none"
      stroke="var(--color-brick-ink)"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
     />
    </svg>
   </div>
   <div className="leading-tight">
    <span className="text-[1.35rem] font-bold tracking-tight text-foreground">
     Chayan<span className="text-brick">Jobs</span>
    </span>
    <span className="block text-[10px] font-medium tracking-wide text-ink/40 dark:text-paper/40">
     select right. serve right.
    </span>
   </div>
  </Link>
 )
}
