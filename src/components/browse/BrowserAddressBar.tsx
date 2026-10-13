"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, RefreshCw, Search, X } from "lucide-react"
import { looksLikeUrl, normalizeExternalUrl, isSafeExternalUrl } from "@/lib/apply-room"
import { trackApplyEvent } from "@/lib/apply-analytics"
import type { ApplyAnalyticsPayload } from "@/components/apply/application-types"

interface BrowserAddressBarProps {
  currentUrl: string
  hostname: string
  loading: boolean
  analytics: ApplyAnalyticsPayload
  onNavigate: (url: string) => void
  onReload: () => void
  onShare: () => void
  onOpenInNewTab?: (url: string) => void
}

/**
 * Clean omnibox: lock + hostname pill, one search/URL field, reload.
 * URLs stay inside the browser; plain text goes to ChayanJobs /search.
 * Never sends queries to Google - internal search only.
 */
export function BrowserAddressBar({
  currentUrl,
  hostname,
  loading,
  analytics,
  onNavigate,
  onReload,
  onOpenInNewTab,
}: BrowserAddressBarProps) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Show full URL on focus (edit mode), hostname pill otherwise.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- clearing edit buffer on blur is intentional */
    if (!focused) setValue("")
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [currentUrl, focused])

  const submit = (raw: string, newTab = false) => {
    const input = raw.trim()
    if (!input) return
    setError(null)

    // Dangerous schemes are rejected inline - never navigated.
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
      trackApplyEvent("browser_navigate", analytics)
      setValue("")
      inputRef.current?.blur()
      if (newTab && onOpenInNewTab) onOpenInNewTab(normalized)
      else onNavigate(normalized)
      return
    }

    // Plain text -> internal ChayanJobs search, stays on-site.
    trackApplyEvent("browser_navigate", analytics)
    setValue("")
    inputRef.current?.blur()
    router.push(`/search?q=${encodeURIComponent(input)}`)
  }

  return (
    <div className="w-full shrink-0 border-b border-gray-200 bg-white px-2 py-1.5 sm:px-3 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-1.5">
        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-mono text-[11px] font-medium text-emerald-700 sm:inline-flex dark:bg-emerald-950 dark:text-emerald-300">
          <Lock className="h-3 w-3" aria-hidden="true" />
          {hostname}
        </span>

        <form
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-0 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:bg-gray-900"
          onSubmit={(e) => { e.preventDefault(); submit(value) }}
          role="search"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={focused ? value : value || ""}
            onChange={(e) => { setValue(e.target.value); setError(null) }}
            onFocus={() => { setFocused(true); setValue(currentUrl) }}
            onBlur={() => setFocused(false)}
            placeholder={focused ? "Search or paste URL" : "Search jobs or paste website URL"}
            aria-label="Search jobs or enter website address"
            enterKeyHint="go"
            autoComplete="off"
            spellCheck={false}
            className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
          />
          {value ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => { setValue(""); setError(null); inputRef.current?.focus() }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {loading ? (
            <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" aria-hidden="true" />
          ) : null}
        </form>

        <button
          type="button"
          onClick={onReload}
          aria-label="Reload page"
          title="Reload"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-1 px-1 text-[11px] font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  )
}
