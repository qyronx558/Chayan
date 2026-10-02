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
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4">
          <Button variant="ghost" size="sm" className="shrink-0 text-slate-600 hover:text-slate-900" asChild>
            <Link href={backHref}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">{backLabel}</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>

          <div className="min-w-0 hidden flex-1 md:block">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{title}</p>
            {subtitle && (
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {headerAction}
            <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700" role="tablist" aria-label="View mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "live"}
                onClick={() => switchMode("live")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium",
                  mode === "live"
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300"
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
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300"
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 bg-gray-50 px-3 py-1.5 text-xs sm:px-4 dark:border-gray-800 dark:bg-gray-800/50">
          <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
            {mode === "preview" ? "Preview inside ChayanJobs" : "Official website opened inside ChayanJobs"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-mono text-[11px] text-gray-600 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700">
            <Lock className="h-3 w-3 text-gray-400" />
            {hostname}
          </span>
          <span className="hidden text-gray-400 lg:inline dark:text-gray-500">
            {mode === "preview"
              ? "You stay on ChayanJobs. Login and payment use the official site."
              : "Complete your application here."}
          </span>
        </div>
      </div>

      {/* Notice when framing is blocked. User stays on ChayanJobs. */}
      {blocked && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 sm:px-4 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
          <span>
            You stay on ChayanJobs. Preview of {hostname} is shown below, including its inner pages.
          </span>
          <span className="text-gray-400">Passwords, OTP and payments stay on {hostname}.</span>
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
        className="relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      >
        {/* Minimal browser bar */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-[11px] text-gray-500 sm:px-4 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
          <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />
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

        <div className="relative bg-white dark:bg-white">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white p-8 text-center dark:bg-gray-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 dark:bg-white">
                <Globe className="h-6 w-6 text-white dark:text-gray-900" />
              </div>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-white" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {mode === "preview" ? `Loading preview of ${hostname}` : `Opening ${hostname}`}
              </p>
              <p className="max-w-sm text-xs text-gray-500">
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
              className="h-[calc(100vh-240px)] min-h-[560px] w-full bg-white lg:h-[calc(100vh-210px)]"
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
              className="h-[calc(100vh-240px)] min-h-[560px] w-full bg-white lg:h-[calc(100vh-210px)]"
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
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 text-center text-xs text-gray-500 dark:text-gray-400">
        <span>Page looks blank or stuck?</span>
        <button
          type="button"
          onClick={reload}
          className="font-medium text-gray-700 hover:underline dark:text-gray-200"
        >
          Try reload
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-gray-500 hover:underline dark:text-gray-400"
        >
          <ExternalLink className="h-3 w-3" /> Open {hostname} in a new tab
        </a>
      </div>

      {sidebar && (
        <details className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
          <summary className="cursor-pointer py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Extra details
          </summary>
          <div className="space-y-3 py-2">{sidebar}</div>
        </details>
      )}
    </div>
  )
}
