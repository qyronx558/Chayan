import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"

interface AuthorCardProps {
  name: string
  bio?: string
  category?: string | null
}

/* Signed at the foot of the piece, the way a letter ends. */
export function AuthorCard({ name, bio, category }: AuthorCardProps) {
  return (
    <div className="mt-10 flex items-end justify-between gap-6 border-t border-dashed border-[var(--hs-border-strong,var(--color-rule))] pt-6 print:break-inside-avoid">
      <div className="min-w-0">
        <p className={cn(typeFont.className, "text-[10.5px] font-bold uppercase text-muted-foreground")}>Written by</p>
        <p className={cn(handFont.className, "mt-1 text-[2rem] leading-none text-foreground")}>{name}</p>
        <svg viewBox="0 0 160 10" className="mt-1 h-2.5 w-40" aria-hidden>
          <path d="M2 6 C 40 1, 80 9, 158 3" stroke="var(--color-brick)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
        <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
          {bio || "Editor at ChayanJobs - writes practical guides on careers, skills and money."}
        </p>
      </div>
      <div className={cn(typeFont.className, "hidden shrink-0 text-right text-[10.5px] leading-relaxed text-muted-foreground sm:block")}>
        <p>CHAYANJOBS EDITORIAL</p>
        {category && <p className="font-bold text-foreground/80">{category.toUpperCase()} DESK</p>}
      </div>
    </div>
  )
}
