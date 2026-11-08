"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
 ExternalLink,
 RefreshCw,
 ShieldCheck,
 Maximize,
 ArrowLeft,
 Globe,
 Lock,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ApplyRoomClientProps {
 targetUrl: string
 hostname: string
 title: string
 subtitle?: string | null
 backHref: string
 backLabel: string
 /** Optional small action shown in header (for example application tracker). */
 headerAction?: React.ReactNode
 /** Optional extra content shown collapsed below the viewer, not beside it. */
 sidebar?: React.ReactNode
}

type FrameStatus = "checking" | "allowed" | "blocked" | "unknown"
type ViewMode = "live" | "preview"

/**
 * Universal viewer for any external application website.
 * Tier 1 tries the official site directly in an iframe.
 * Tier 2 shows a safe read-only preview served by ChayanJobs when framing is blocked.
 * Passwords, OTP, eKYC and payments always happen on the official site.
 */
export function ApplyRoomClient({
 targetUrl,
 hostname,
 title,
 subtitle,
 backHref,
 backLabel,
 headerAction,
 sidebar,
}: ApplyRoomClientProps) {
 const [loading, setLoading] = useState(true)
 const [slowLoad, setSlowLoad] = useState(false)
 const [frameStatus, setFrameStatus] = useState<FrameStatus>("checking")
 const [mode, setMode] = useState<ViewMode>("live")
 const [iframeKey, setIframeKey] = useState(0)
 const frameRef = useRef<HTMLDivElement>(null)
 const openedRef = useRef(false)

 const proxyUrl = useMemo(
  () => `/api/proxy?url=${encodeURIComponent(targetUrl)}`,
  [targetUrl]
 )
 const viewerSrc = mode === "live" ? targetUrl : proxyUrl

 useEffect(() => {
  let cancelled = false
  const check = async () => {
   try {
    const res = await fetch(`/api/apply/check?url=${encodeURIComponent(targetUrl)}`)
    const json = await res.json()
    if (cancelled) return
    if (json?.frameable === false) setFrameStatus("blocked")
    else if (json?.frameable === true) setFrameStatus("allowed")
    else setFrameStatus("unknown")
   } catch {
    if (!cancelled) setFrameStatus("unknown")
   }
  }
  check()
  return () => {
   cancelled = true
  }
 }, [targetUrl])

 const blocked = frameStatus === "blocked"

 // When framing is blocked, stay on ChayanJobs and show the preview.
 // No automatic new tab. The user leaves only by explicit choice.
 // State updates run in a timeout callback to avoid cascading renders.
 useEffect(() => {
  if (!blocked || openedRef.current) return
  openedRef.current = true
  const t = window.setTimeout(() => {
   setMode("preview")
   setLoading(true)
   setSlowLoad(false)
  }, 0)
  return () => window.clearTimeout(t)
 }, [blocked])

 useEffect(() => {
  const t = setTimeout(() => {
   setLoading((still) => {
    if (still) setSlowLoad(true)
    return still
   })
  }, 9000)
  return () => clearTimeout(t)
 }, [iframeKey, viewerSrc])

 const reload = useCallback(() => {
  setLoading(true)
  setSlowLoad(false)
  setIframeKey((k) => k + 1)
 }, [])

 const switchMode = useCallback((next: ViewMode) => {
  setMode(next)
  setLoading(true)
  setSlowLoad(false)
  setIframeKey((k) => k + 1)
 }, [])

 const fullscreen = useCallback(() => {
  frameRef.current?.requestFullscreen?.().catch(() => {})
 }, [])

 return (
  <div className="space-y-3">
   {/* Compact control bar */}
   <div className="overflow-hidden rounded-xl border border-rule bg-background dark:border-ink dark:bg-ink">
    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4">
     <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground hover:text-foreground" asChild>
      <Link href={backHref}>
       <ArrowLeft className="mr-1 h-4 w-4" />
       <span className="hidden sm:inline">{backLabel}</span>
       <span className="sm:hidden">Back</span>
      </Link>
     </Button>

     <div className="min-w-0 hidden flex-1 md:block">
      <p className="truncate text-sm font-medium text-foreground dark:text-paper">{title}</p>
      {subtitle && (
       <p className="truncate text-xs text-muted-foreground dark:text-muted-foreground">{subtitle}</p>
      )}
     </div>

     <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
      {headerAction}
      <div className="flex overflow-hidden rounded-lg border border-rule dark:border-ink" role="tablist" aria-label="View mode">
       <button
        type="button"
        role="tab"
        aria-selected={mode === "live"}
        onClick={() => switchMode("live")}
        className={cn(
         "px-2.5 py-1.5 text-xs font-medium",
         mode === "live"
          ? "bg-ink text-paper dark:bg-background dark:text-foreground"
          : "bg-background text-muted-foreground hover:bg-paper-2 dark:bg-ink dark:text-muted-foreground"
        )}
       >
        Official
       </button>
       <button
        type="button"
        role="tab"
        aria-selected={mode === "preview"}
        onClick={() => switchMode("preview")}
        className={cn(
         "px-2.5 py-1.5 text-xs font-medium",
         mode === "preview"
          ? "bg-ink text-paper dark:bg-background dark:text-foreground"
          : "bg-background text-muted-foreground hover:bg-paper-2 dark:bg-ink dark:text-muted-foreground"
        )}
       >
        Preview
       </button>
      </div>
      <Button variant="outline" size="sm" onClick={reload} title="Reload">
       <RefreshCw className="h-4 w-4 sm:mr-1.5" />
       <span className="hidden sm:inline">Reload</span>
      </Button>
      <Button variant="outline" size="sm" onClick={fullscreen} title="Full screen">
       <Maximize className="h-4 w-4 sm:mr-1.5" />
       <span className="hidden sm:inline">Full screen</span>
      </Button>
      <Button variant="outline" size="sm" asChild title={`Open ${hostname} in a new tab`}>
       <a href={targetUrl} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="mr-1.5 h-4 w-4" />
        Open {hostname}
       </a>
      </Button>
     </div>
    </div>

    {/* Slim trust strip */}
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-rule bg-paper-2 px-3 py-1.5 text-xs sm:px-4 dark:border-ink dark:bg-ink/50">
     <span className="inline-flex items-center gap-1.5 text-muted-foreground dark:text-muted-foreground">
      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
      {mode === "preview" ? "Preview inside ChayanJobs" : "Official website opened inside ChayanJobs"}
     </span>
     <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground ring-1 ring-rule200 dark:bg-ink dark:text-muted-foreground dark:ring-rule700">
      <Lock className="h-3 w-3 text-muted-foreground" />
      {hostname}
     </span>
     <span className="hidden text-muted-foreground lg:inline dark:text-muted-foreground">
      {mode === "preview"
       ? "You stay on ChayanJobs. Login and payment use the official site."
       : "Complete your application here."}
     </span>
    </div>
   </div>

   {/* Notice when framing is blocked. User stays on ChayanJobs. */}
   {blocked && (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rule bg-paper-2 px-3 py-2 text-xs text-muted-foreground sm:px-4 dark:border-ink dark:bg-ink/50 dark:text-muted-foreground">
     <span>
      You stay on ChayanJobs. Preview of {hostname} is shown below, including its inner pages.
     </span>
     <span className="text-muted-foreground">Passwords, OTP and payments stay on {hostname}.</span>
     <Button size="sm" variant="outline" className="ml-auto" asChild>
      <a href={targetUrl} target="_blank" rel="noopener noreferrer">
       <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Continue on {hostname}
      </a>
     </Button>
    </div>
   )}

   {/* Spacious viewer */}
   <div
    ref={frameRef}
    className="relative overflow-hidden rounded-xl border border-rule bg-background dark:border-ink dark:bg-ink"
   >
    {/* Minimal browser bar */}
    <div className="flex items-center gap-2 border-b border-rule bg-paper-2 px-3 py-1.5 text-[11px] text-muted-foreground sm:px-4 dark:border-ink dark:bg-ink/50 dark:text-muted-foreground">
     <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
     <span className="min-w-0 flex-1 truncate font-mono">
      {mode === "preview" ? `${hostname} preview via ChayanJobs` : targetUrl}
     </span>
     {loading ? (
      <Badge variant="secondary" className="shrink-0 animate-pulse text-[10px]">
       Loading
      </Badge>
     ) : (
      <Badge variant="secondary" className="shrink-0 text-[10px]">
       {mode === "preview" ? "Preview" : "Live"}
      </Badge>
     )}
    </div>

    <div className="relative bg-background dark:bg-background">
     {loading && (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background p-8 text-center dark:bg-ink">
       <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink dark:bg-background">
        <Globe className="h-6 w-6 text-paper dark:text-foreground" />
       </div>
       <div className="h-5 w-5 animate-spin rounded-full border-2 border-rule border-t-gray-900 dark:border-ink dark:border-t-white" />
       <p className="text-sm font-medium text-foreground dark:text-muted-foreground">
        {mode === "preview" ? `Loading preview of ${hostname}` : `Opening ${hostname}`}
       </p>
       <p className="max-w-sm text-xs text-muted-foreground">
        {slowLoad
         ? "Still loading. The portal may be slow. Please wait or try Reload."
         : mode === "preview"
          ? "Fetching a readable copy of the official page."
          : "Loading the official website for you."}
       </p>
      </div>
     )}

     {mode === "preview" ? (
      <iframe
       key={`preview-${iframeKey}`}
       src={proxyUrl}
       title={`${title} preview`}
       className="h-[calc(100vh-240px)] min-h-[560px] w-full bg-background lg:h-[calc(100vh-210px)]"
       onLoad={() => {
        setLoading(false)
        setSlowLoad(false)
       }}
       referrerPolicy="no-referrer"
       sandbox="allow-forms allow-scripts allow-popups"
      />
     ) : (
      <iframe
       key={`live-${iframeKey}`}
       src={targetUrl}
       title={title}
       className="h-[calc(100vh-240px)] min-h-[560px] w-full bg-background lg:h-[calc(100vh-210px)]"
       onLoad={() => {
        setLoading(false)
        setSlowLoad(false)
       }}
       allow="fullscreen"
       allowFullScreen
       referrerPolicy="no-referrer"
       sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
      />
     )}
    </div>
   </div>

   {/* Quiet fallback, kept minimal on purpose */}
   <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 text-center text-xs text-muted-foreground dark:text-muted-foreground">
    <span>Page looks blank or stuck?</span>
    <button
     type="button"
     onClick={reload}
     className="font-medium text-foreground hover:underline dark:text-muted-foreground"
    >
     Try reload
    </button>
    <span className="text-muted-foreground dark:text-muted-foreground">|</span>
    <a
     href={targetUrl}
     target="_blank"
     rel="noopener noreferrer"
     className="inline-flex items-center gap-1 text-muted-foreground hover:underline dark:text-muted-foreground"
    >
     <ExternalLink className="h-3 w-3" /> Open {hostname} in a new tab
    </a>
   </div>

   {sidebar && (
    <details className="rounded-xl border border-rule bg-paper-2 px-4 py-2 text-sm text-muted-foreground dark:border-ink dark:bg-ink/50 dark:text-muted-foreground">
     <summary className="cursor-pointer py-1 text-xs font-semibold text-muted-foreground">
      Extra details
     </summary>
     <div className="space-y-3 py-2">{sidebar}</div>
    </details>
   )}
  </div>
 )
}
