"use client"

import Link from "next/link"
import {
 ArrowLeft,
 ChevronsLeft,
 ChevronsRight,
 ExternalLink,
 Flag,
 Info,
 RefreshCw,
} from "lucide-react"
import type { ComponentType } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ApplicationToolRailProps {
 collapsed: boolean
 onToggleCollapse: () => void
 backHref: string
 backLabel: string
 onInfo: () => void
 onReload: () => void
 officialUrl: string
 hostname: string
 onReport: () => void
}

interface RailItem {
 id: string
 label: string
 icon: ComponentType<{ className?: string }>
 href?: string
 external?: boolean
 onClick?: () => void
}

const iconClass = "h-5 w-5 shrink-0"

function RailButton({
 item,
 expanded,
}: {
 item: RailItem
 expanded: boolean
}) {
 const className = expanded
  ? "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:text-muted-foreground dark:hover:bg-ink dark:hover:text-paper"
  : "flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:text-muted-foreground dark:hover:bg-ink dark:hover:text-paper"

 const inner = (
  <>
   <item.icon className={iconClass} aria-hidden="true" />
   {expanded ? <span className="truncate">{item.label}</span> : null}
  </>
 )

 const button = item.href ? (
  <Link
   href={item.href}
   aria-label={item.label}
   title={item.label}
   {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
   className={className}
  >
   {inner}
  </Link>
 ) : (
  <button
   type="button"
   aria-label={item.label}
   title={item.label}
   onClick={item.onClick}
   className={className}
  >
   {inner}
  </button>
 )

 // Expanded rows already show their name - a tooltip would be redundant.
 if (expanded) return button

 return (
  <Tooltip>
   <TooltipTrigger asChild>{button}</TooltipTrigger>
   <TooltipContent side="right">{item.label}</TooltipContent>
  </Tooltip>
 )
}

/**
 * Desktop tool rail with two states:
 * - Open: wide rail showing icon + name for every action.
 * - Collapsed: compact icon-only rail.
 * Desktop only - rendered `hidden md:flex` by the shell.
 */
export function ApplicationToolRail({
 collapsed,
 onToggleCollapse,
 backHref,
 backLabel,
 onInfo,
 onReload,
 officialUrl,
 hostname,
 onReport,
}: ApplicationToolRailProps) {
 const expanded = !collapsed

 const items: RailItem[] = [
  { id: "back", label: backLabel, icon: ArrowLeft, href: backHref },
  { id: "info", label: "Job details", icon: Info, onClick: onInfo },
  { id: "reload", label: "Reload website", icon: RefreshCw, onClick: onReload },
  {
   id: "external",
   label: `Open ${hostname}`,
   icon: ExternalLink,
   href: officialUrl,
   external: true,
  },
  { id: "report", label: "Report problem", icon: Flag, onClick: onReport },
 ]

 return (
  <nav
   aria-label="Application tools"
   className={cn(
    "flex shrink-0 flex-col border-r border-rule bg-background py-2 transition-[width] duration-200 ease-in-out dark:border-ink dark:bg-paper",
    expanded ? "w-[208px] px-2" : "w-[68px] items-center"
   )}
  >
   <Link
    href="/"
    aria-label="ChayanJobsJobs home"
    title="ChayanJobsJobs"
    className={cn(
     "mb-1 flex h-11 items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule",
     expanded ? "gap-2.5 px-2" : "w-11 justify-center"
    )}
   >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper-3">
     <svg viewBox="0 0 80 80" className="h-5 w-5" aria-hidden="true">
      <path
       d="M20 48 L30 58 L55 28"
       fill="none"
       stroke="white"
       strokeWidth="8"
       strokeLinecap="round"
       strokeLinejoin="round"
      />
     </svg>
    </span>
    {expanded ? (
     <span className="min-w-0 leading-tight">
      <span className="block truncate text-base font-bold text-foreground dark:text-paper">
       ChayanJobs
      </span>
      <span className="-mt-0.5 block truncate text-[10px] font-medium text-muted-foreground dark:text-muted-foreground">
       select right. serve right.
      </span>
     </span>
    ) : null}
   </Link>

   <div className={cn("flex flex-col gap-0.5", expanded ? "w-full" : "items-center")}>
    {items.map((item) => (
     <RailButton key={item.id} item={item} expanded={expanded} />
    ))}
   </div>

   <div className={cn("mt-auto", expanded ? "w-full" : "flex justify-center")}>
    {expanded ? (
     <button
      type="button"
      onClick={onToggleCollapse}
      aria-label="Collapse toolbar"
      className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:hover:bg-ink dark:hover:text-paper"
     >
      <ChevronsLeft className={iconClass} aria-hidden="true" />
      <span className="truncate">Collapse</span>
     </button>
    ) : (
     <Tooltip>
      <TooltipTrigger asChild>
       <button
        type="button"
        onClick={onToggleCollapse}
        aria-label="Expand toolbar"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:hover:bg-ink dark:hover:text-paper"
       >
        <ChevronsRight className={iconClass} aria-hidden="true" />
       </button>
      </TooltipTrigger>
      <TooltipContent side="right">Expand</TooltipContent>
     </Tooltip>
    )}
   </div>
  </nav>
 )
}
