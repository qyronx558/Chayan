"use client"

import { ArrowUpRight, Globe, Lock, RefreshCw, ShieldCheck } from "lucide-react"

interface ApplicationFallbackProps {
  organization: string
  hostname: string
  officialUrl: string
  sourceLabel: string
  headline?: string
  onReload: () => void
  onReport: () => void
  onOpenOfficial: () => void
}

/**
 * Premium fallback when the official site blocks embedding
 * (X-Frame-Options / CSP frame-ancestors). Never a blank iframe.
 * The floating Apply CTA stays visible above this (rendered by the shell).
 */
export function ApplicationFallback({
  organization,
  hostname,
  officialUrl,
  sourceLabel,
  headline = "Official application website",
  onReload,
  onReport,
  onOpenOfficial,
}: ApplicationFallbackProps) {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-[#fafafa] p-4 pb-28 md:pb-24 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 dark:bg-white">
          <Globe className="h-6 w-6 text-white dark:text-gray-900" aria-hidden="true" />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          {headline}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          This website doesn&apos;t allow embedded viewing. For security, continue directly on the
          official website.
        </p>

        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpenOfficial}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(5,150,105,0.4)] transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          Open Official Website
          <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        </a>

        <div className="mt-4 space-y-1.5 border-t border-dashed border-gray-200 pt-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <p className="flex items-center justify-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Verified destination
          </p>
          <p className="font-medium text-gray-700 dark:text-gray-200">{organization}</p>
          <p className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 font-mono text-[11px] dark:bg-gray-800">
            <Lock className="h-3 w-3 text-gray-400" aria-hidden="true" />
            {hostname}
          </p>
          <p className="text-gray-400">{sourceLabel}</p>
        </div>

        <div className="mt-3 flex items-center justify-center gap-3 text-xs">
          <button
            type="button"
            onClick={onReload}
            className="inline-flex items-center gap-1 font-medium text-gray-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-gray-300"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Try again
          </button>
          <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">
            |
          </span>
          <button
            type="button"
            onClick={onReport}
            className="font-medium text-gray-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-gray-400"
          >
            Report broken link
          </button>
        </div>
      </div>
    </div>
  )
}
