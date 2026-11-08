"use client"

import type { LucideIcon } from "lucide-react"

interface SectionHeroProps {
 icon: LucideIcon
 badge: string
 title: string
 subtitle: string
 count?: number
}

export function SectionHero({ icon: Icon, badge, title, subtitle, count }: SectionHeroProps) {
 return (
  <header className="mb-8 border-b-2 border-rule-2 pb-4">
   <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
    <h1 className="flex items-center gap-2.5 text-[2rem] font-bold leading-[1.05] text-foreground sm:text-[2.6rem]">
     <Icon className="h-6 w-6 shrink-0 self-center text-muted-foreground" aria-hidden />
     {title}
    </h1>
    <span className="agate text-xs text-muted-foreground">
     {badge}
     {count !== undefined && count > 0 ? `, ${count} listings` : ""}
    </span>
   </div>
   <p className="mt-2 max-w-[65ch] text-[1.0625rem] leading-relaxed text-muted-foreground">{subtitle}</p>
  </header>
 )
}