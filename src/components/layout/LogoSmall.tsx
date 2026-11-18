import Link from "next/link"
import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"

/*
 * "Chayan" means selection. The mark is an answer box ticked by hand: the
 * tick overshoots the box a little, the way a real pen does on an OMR sheet.
 */
export function LogoSmall({ className, href = "/" }: { className?: string; href?: string }) {
 return (
  <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
   <div className="relative flex h-9 w-9 shrink-0 -rotate-[3deg] items-center justify-center rounded-[5px] border-2 border-brick bg-background transition-transform duration-300 group-hover:rotate-0">
    <svg viewBox="0 0 40 40" className="absolute -right-2 -top-2.5 h-10 w-10 overflow-visible" aria-hidden>
     <path
      d="M9 22 C 12 24, 15 28, 17 32 C 21 21, 28 12, 38 4"
      fill="none"
      stroke="var(--color-brick)"
      strokeWidth="4.2"
      strokeLinecap="round"
      strokeLinejoin="round"
     />
    </svg>
   </div>
   <div className="leading-tight">
    <span className="text-[1.35rem] font-bold tracking-tight text-foreground">
     Chayan<span className="text-brick">Jobs</span>
    </span>
    <span className={cn(handFont.className, "-mt-0.5 block text-[0.78rem] text-ink/50 dark:text-paper/50")}>
     select right. serve right.
    </span>
   </div>
  </Link>
 )
}
