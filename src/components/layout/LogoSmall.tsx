import Link from "next/link"
import { cn } from "@/lib/utils"

export function LogoSmall({ className, href = "/" }: { className?: string; href?: string }) {
 return (
  <Link href={href} className={cn("flex items-center gap-2.5", className)}>
   <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-paper-3">
    <svg viewBox="0 0 80 80" className="h-6 w-6">
     <path d="M20 48 L30 58 L55 28" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
   </div>
   <div className="leading-tight">
    <div className="text-2xl font-bold text-foreground dark:text-paper">ChayanJobs</div>
    <div className="text-xs font-medium text-muted-foreground dark:text-muted-foreground -mt-0.5">select right. serve right.</div>
   </div>
  </Link>
 )
}
