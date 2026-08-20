"use client"

import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SectionHeroProps {
  icon: LucideIcon
  badge: string
  title: string
  subtitle: string
  count?: number
}

export function SectionHero({ icon: Icon, badge, title, subtitle, count }: SectionHeroProps) {
  return (
    <header className="mb-8">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge className="bg-gray-100 font-medium text-gray-700">{badge}</Badge>
        {count !== undefined && count > 0 && (
          <Badge className="bg-gray-100 font-medium text-gray-700">{count} listings</Badge>
        )}
      </div>
      <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        <Icon className="h-6 w-6 text-gray-700" />
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-gray-500 sm:text-base">{subtitle}</p>
    </header>
  )
}