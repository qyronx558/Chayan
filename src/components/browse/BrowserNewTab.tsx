"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Briefcase, FileText, Search } from "lucide-react"
import { isSafeExternalUrl, looksLikeUrl, normalizeExternalUrl } from "@/lib/apply-room"

interface BrowserNewTabProps {
  backHref: string
  backLabel: string
  onNavigate: (url: string) => void
}

/**
 * Chrome-like new-tab page inside ChayanJobs: logo, big search box,
 * quick links. URLs open in this tab; plain text goes to /search.
 */
export function BrowserNewTab({ backHref, backLabel, onNavigate }: BrowserNewTabProps) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  const submit = (raw: string) => {
    const input = raw.trim()
    if (!input) return
    setError(null)
    if (/^(javascript|data|vbscript|file|blob|mailto|tel|sms|ftp):/i.test(input)) {
      setError("This address can't be opened here.")
      return
    }
    if (looksLikeUrl(input)) {
      const normalized = normalizeExternalUrl(input)
      if (!normalized || !isSafeExternalUrl(normalized)) {
        setError("This address can't be opened here.")
        return
      }
      onNavigate(normalized)
      return
    }
    window.location.href = `/search?q=${encodeURIComponent(input)}`
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-y-auto bg-white p-6 text-center dark:bg-gray-950">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600">
        <svg viewBox="0 0 80 80" className="h-8 w-8" aria-hidden="true">
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
      <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">New tab</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Search jobs or open any official website - right here inside ChayanJobs.
      </p>

      <form
        className="mt-5 flex w-full max-w-md items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-1 shadow-sm focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:bg-gray-900"
        onSubmit={(e) => { e.preventDefault(); submit(value) }}
        role="search"
      >
        <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
        <input
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null) }}
          placeholder="Search jobs or paste website URL"
          aria-label="Search jobs or enter website address"
          enterKeyHint="go"
          autoComplete="off"
          spellCheck={false}
          autoFocus
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
        />
      </form>
      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
        <Link
          href={backHref}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
        </Link>
        <Link
          href="/jobs"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Briefcase className="h-3.5 w-3.5" /> Browse jobs
        </Link>
        <Link
          href="/search"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <FileText className="h-3.5 w-3.5" /> All updates
        </Link>
      </div>
    </div>
  )
}
