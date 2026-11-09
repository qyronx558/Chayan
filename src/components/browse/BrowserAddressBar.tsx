"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, ExternalLink, Expand, Lock, Maximize2, Minimize2, RefreshCw, Search, X } from "lucide-react"
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
 focus?: boolean
 onToggleFocus?: () => void
 onFullscreen?: () => void
 backHref?: string
 backLabel?: string
 title?: string
 downloadUrl?: string | null
 downloadFilename?: string
 onDownload?: () => void
 openUrl?: string
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
 focus,
 onToggleFocus,
 onFullscreen,
 backHref,
 backLabel,
 title,
 downloadUrl,
 downloadFilename,
 onDownload,
 openUrl,
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
  <div className="w-full shrink-0 border-b border-rule bg-background px-2 py-1.5 sm:px-3 dark:border-ink dark:bg-paper">
   <div className="flex items-center gap-1.5">
    {focus && backHref ? (
     <Link href={backHref} aria-label={`Back to ${backLabel ?? "previous page"}`} title={backLabel ?? "Back"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground">
      <ArrowLeft className="h-4 w-4" />
     </Link>
    ) : null}
    {focus && title ? (
     <span className="hidden max-w-[22%] shrink-0 truncate text-[13px] font-semibold text-foreground xl:inline" title={title}>{title}</span>
    ) : null}
    <span className="hidden shrink-0 items-center gap-1 rounded-full bg-paper-3 px-2 py-1 font-mono text-[11px] font-medium text-foreground sm:inline-flex dark:bg-paper-3 dark:text-foreground">
     <Lock className="h-3 w-3" aria-hidden="true" />
     {hostname}
    </span>

    <form
     className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-rule bg-paper-2 px-2.5 py-0 focus-within:border-rule focus-within:bg-background focus-within:ring-1 focus-within:ring-rule dark:border-ink dark:bg-ink dark:focus-within:bg-ink"
     onSubmit={(e) => { e.preventDefault(); submit(value) }}
     role="search"
    >
     <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
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
      className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground dark:text-paper dark:placeholder:text-muted-foreground"
     />
     {value ? (
      <button
       type="button"
       aria-label="Clear search"
       onClick={() => { setValue(""); setError(null); inputRef.current?.focus() }}
       className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
      >
       <X className="h-3.5 w-3.5" />
      </button>
     ) : null}
     {loading ? (
      <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-rule border-t-emerald-600" aria-hidden="true" />
     ) : null}
    </form>

    <button
     type="button"
     onClick={onReload}
     aria-label="Reload page"
     title="Reload"
     className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:text-muted-foreground dark:hover:bg-ink dark:hover:text-paper"
    >
     <RefreshCw className="h-4 w-4" />
    </button>

    {downloadUrl ? (
     <a href={downloadUrl} download={downloadFilename || "document.pdf"} onClick={onDownload} title="Download PDF" aria-label="Download PDF" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-2.5 text-xs font-semibold text-background transition-colors hover:bg-brick hover:text-brick-ink">
      <Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">Download</span>
     </a>
    ) : null}
    {openUrl ? (
     <a href={openUrl} target="_blank" rel="noopener noreferrer" title="Open original in a new tab" aria-label="Open original in a new tab" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground">
      <ExternalLink className="h-4 w-4" />
     </a>
    ) : null}
    {onFullscreen ? (
     <button type="button" onClick={onFullscreen} title="Screen fullscreen" aria-label="Toggle screen fullscreen" className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground sm:flex">
      <Expand className="h-4 w-4" />
     </button>
    ) : null}
    {onToggleFocus ? (
     <button type="button" onClick={onToggleFocus} title={focus ? "Show toolbars (F)" : "Focus mode: maximise page (F)"} aria-label="Toggle focus mode" aria-pressed={!!focus} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground">
      {focus ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
     </button>
    ) : null}
   </div>
   {error ? (
    <p role="alert" className="mt-1 px-1 text-[11px] font-medium text-brick dark:text-brick">{error}</p>
   ) : null}
  </div>
 )
}
