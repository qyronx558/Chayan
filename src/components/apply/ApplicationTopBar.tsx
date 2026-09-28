"use client"

import Link from "next/link"
import { ArrowLeft, CalendarClock, Lock, ShieldCheck } from "lucide-react"
import type { ApplicationType } from "@/components/apply/application-types"
import type { ReactNode } from "react"

interface ApplicationTopBarProps {
  type: ApplicationType
  title: string
  organization: string
  hostname: string
  deadlineLabel?: string | null
  sourceLabel: string
  backHref: string
  backLabel: string
  /** Rendered on the right side on mobile (the ⋮ menu trigger). */
  mobileMenu?: ReactNode
}

/**
 * Minimal 48–56px top bar for Application Mode.
 * Truncates long titles; carries trust signals only.
 */
export function ApplicationTopBar({
  title,
  organization,
  hostname,
  deadlineLabel,
  sourceLabel,
  backHref,
  backLabel,
  mobileMenu,
}: ApplicationTopBarProps) {
  return (
    <header className="flex h-12 w-full shrink-0 items-center gap-1.5 border-b border-gray-200 bg-white px-2 sm:gap-2 sm:px-3 md:h-14 dark:border-gray-800 dark:bg-gray-950">
      <Link
        href={backHref}
        aria-label={`Back to ${backLabel}`}
        title={backLabel}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-gray-900 sm:text-sm dark:text-white">
            {title}
          </p>
          <p className="truncate text-[11px] leading-tight text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-600 dark:text-gray-300">{organization}</span>
          <span aria-hidden="true" className="mx-1 text-gray-300 dark:text-gray-600">
            ·
          </span>
          <span className="inline-flex items-center gap-0.5 align-middle text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            {sourceLabel}
          </span>
          <span aria-hidden="true" className="mx-1 hidden text-gray-300 sm:inline dark:text-gray-600">
            ·
          </span>
          <span className="hidden items-center gap-0.5 sm:inline-flex">
            <Lock className="h-3 w-3 text-gray-400" aria-hidden="true" />
            <span className="font-mono">{hostname}</span>
          </span>
        </p>
      </div>

      {deadlineLabel ? (
        <span className="hidden shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600 lg:inline-flex dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          Last date: {deadlineLabel}
        </span>
      ) : null}

      {mobileMenu ? <div className="shrink-0 md:hidden">{mobileMenu}</div> : null}
    </header>
  )
}
