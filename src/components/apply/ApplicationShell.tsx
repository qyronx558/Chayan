"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { preconnect } from "react-dom"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Globe, Info, RefreshCw, X } from "lucide-react"
import { ApplicationTopBar } from "@/components/apply/ApplicationTopBar"
import { ApplicationToolRail } from "@/components/apply/ApplicationToolRail"
import { ApplicationIframe } from "@/components/apply/ApplicationIframe"
import { ApplicationFloatingCTA } from "@/components/apply/ApplicationFloatingCTA"
import { ApplicationFocusDock } from "@/components/apply/ApplicationFocusDock"
import { ApplicationInfoDrawer } from "@/components/apply/ApplicationInfoDrawer"
import { ApplicationFallback } from "@/components/apply/ApplicationFallback"
import { ApplicationMobileMenu } from "@/components/apply/ApplicationMobileMenu"
import { BrowserTabStrip } from "@/components/browse/BrowserTabStrip"
import { BrowserAddressBar } from "@/components/browse/BrowserAddressBar"
import { BrowserNewTab } from "@/components/browse/BrowserNewTab"
import { useBrowserTabs } from "@/components/browse/useBrowserTabs"
import type { ApplicationShellProps } from "@/components/apply/application-types"
import { isDocumentApplication } from "@/components/apply/application-types"
import { trackApplyEvent } from "@/lib/apply-analytics"
import { buildDocProxyUrl, buildHtmlProxyUrl, getExternalHostname, looksLikePdfUrl, normalizeExternalUrl } from "@/lib/apply-room"
import { downloadPdfFile } from "@/lib/download-pdf"

type FrameStatus = "checking" | "allowed" | "blocked" | "unknown"
type ViewMode = "direct" | "preview"

/** Answer of /api/apply/check for one address. */
interface FrameCheck {
 frameable: boolean | null
 isPdf: boolean
 /** Address that can be framed directly (https), or null when there is none. */
 directUrl: string | null
 /** false: the site's cookies do not work in a frame, so sign-in needs its own tab. */
 sessionInFrame: boolean | null
 /** The address does not exist (DNS lookup failed). */
 notFound: boolean
}

const RAIL_STORAGE_KEY = "cj-apply-rail-collapsed"
const FOCUS_STORAGE_KEY = "cj-viewer-focus"
const LOAD_TIMEOUT_MS = 12000
/** A frameable site is shown this long after it starts loading, not when its last image arrives. */
const REVEAL_DELAY_MS = 1200

/** Checks already answered in this browser tab (switching tabs back is instant). */
const checkCache = new Map<string, FrameCheck>()

async function fetchFrameCheck(url: string): Promise<FrameCheck | null> {
 const cached = checkCache.get(url)
 if (cached) return cached
 try {
  const res = await fetch(`/api/apply/check?url=${encodeURIComponent(url)}`)
  if (!res.ok) return null
  const json = await res.json()
  const check: FrameCheck = {
   frameable: typeof json?.frameable === "boolean" ? json.frameable : null,
   isPdf: json?.isPdf === true,
   directUrl: typeof json?.directUrl === "string" ? json.directUrl : null,
   sessionInFrame: typeof json?.sessionInFrame === "boolean" ? json.sessionInFrame : null,
   notFound: json?.reason === "not-found",
  }
  // "Could not reach the site" is not remembered: the next try may succeed.
  if (check.frameable !== null) {
   checkCache.set(url, check)
   rememberHost(url, check.frameable && !!check.directUrl)
  }
  return check
 } catch {
  return null
 }
}

const HOST_HINT_PREFIX = "cj-frame-host:"

function hostKey(url: string): string | null {
 try {
  return HOST_HINT_PREFIX + new URL(url).hostname
 } catch {
  return null
 }
}

/** Remember whether a site can be framed, so the next link to it opens the right way at once. */
function rememberHost(url: string, frameable: boolean) {
 try {
  const key = hostKey(url)
  if (key) window.localStorage.setItem(key, frameable ? "1" : "0")
 } catch {
  // Storage unavailable: the check still runs every time.
 }
}

/** true: this site is already known to refuse framing. */
function hostRefusesFraming(url: string): boolean {
 try {
  const key = hostKey(url)
  return !!key && window.localStorage.getItem(key) === "0"
 } catch {
  return false
 }
}

/** Browsers that cannot show a PDF inside a frame get the pdf.js viewer. */
function browserFramesPdf(): boolean {
 const nav = navigator as Navigator & { pdfViewerEnabled?: boolean }
 if (nav.pdfViewerEnabled === false) return false
 if (/Android|iPhone|iPad|iPod/i.test(nav.userAgent)) return false
 if (/Macintosh/i.test(nav.userAgent) && nav.maxTouchPoints > 1) return false // iPadOS
 return true
}

/**
 * Unified in-app browser shell for gov + private + documents + /browse.
 * Clean + simple: TopBar / TabStrip / AddressBar / content / CTA.
 * Tabs stay inside ChayanJobs; search goes to internal /search;
 * PDFs open + download end-to-end from ChayanJobs origin (/api/doc).
 */
export function ApplicationShell(props: ApplicationShellProps) {
 const {
  type,
  jobId,
  slug,
  title,
  organization,
  officialUrl,
  deadlineLabel,
  updatedLabel,
  sourceLabel,
  backHref,
  backLabel,
  infoRows,
 } = props

 const router = useRouter()
 const scope = useMemo(() => `${type}:${slug}`, [type, slug])
 const {
  tabs, activeId, activeTab, openTab, closeTab, switchTab, navigateActive, newTab,
  canGoBack, canGoForward, goBack, goForward,
 } = useBrowserTabs(scope, officialUrl, title)

 const currentUrl = activeTab?.url ?? officialUrl
 const isBlank = !currentUrl
 const currentHostname = currentUrl ? getExternalHostname(currentUrl) : "New tab"
 const [collapsed, setCollapsed] = useState(false)
 useEffect(() => {
  try {
   if (window.sessionStorage.getItem(RAIL_STORAGE_KEY) === "1") setCollapsed(true) // eslint-disable-line react-hooks/set-state-in-effect
  } catch {
   // Ignore storage failures.
  }
 }, [])
 // Focus mode (default ON): hides rail, title bar, tab strip and floating CTAs
 // so the official page / PDF gets the whole screen. Toggle with the "F" key.
 const [focus, setFocus] = useState(true)
 // Restore saved preference after hydration (reading storage during the first
 // render would make server and client HTML differ).
 useEffect(() => {
  try {
   if (window.localStorage.getItem(FOCUS_STORAGE_KEY) === "0") setFocus(false) // eslint-disable-line react-hooks/set-state-in-effect
  } catch {
   // Ignore storage failures.
  }
 }, [])
 const toggleFocus = useCallback(() => {
  setFocus((prev) => {
   try {
    window.localStorage.setItem(FOCUS_STORAGE_KEY, prev ? "0" : "1")
   } catch {
    // Ignore storage failures.
   }
   return !prev
  })
 }, [])
 const toggleFullscreen = useCallback(() => {
  if (document.fullscreenElement) void document.exitFullscreen()
  else void document.documentElement.requestFullscreen?.().catch(() => {})
 }, [])
 useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
   const el = e.target as HTMLElement | null
   if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return
   // Alt+Left / Alt+Right: Back / Forward inside this tab, as in Chrome.
   if (e.altKey && !e.metaKey && !e.ctrlKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
    const canStep = e.key === "ArrowLeft" ? canGoBack : canGoForward
    if (!canStep) return // nothing in the tab's trail: let the browser handle it
    e.preventDefault()
    if (e.key === "ArrowLeft") goBack()
    else goForward()
    return
   }
   if (e.metaKey || e.ctrlKey || e.altKey) return
   if (e.key.toLowerCase() === "f") toggleFocus()
  }
  window.addEventListener("keydown", onKey)
  return () => window.removeEventListener("keydown", onKey)
 }, [toggleFocus, canGoBack, canGoForward, goBack, goForward])
 const [drawerOpen, setDrawerOpen] = useState(false)
 const [frameStatus, setFrameStatus] = useState<FrameStatus>("checking")
 const [check, setCheck] = useState<{ url: string; data: FrameCheck } | null>(null)
 const info = check && check.url === currentUrl ? check.data : null
 // Whether this browser can show a PDF inside a frame; null until known
 // (client only, so the server render never guesses).
 const [nativePdf, setNativePdf] = useState<boolean | null>(null)
 useEffect(() => {
  setNativePdf(browserFramesPdf()) // eslint-disable-line react-hooks/set-state-in-effect
 }, [])
 // Where a link starts. Documents, PDFs and http-only sites start in the
 // ChayanJobs-served view (/api/proxy or /api/doc): it always frames, and
 // every in-page click is caught and opened as a ChayanJobs tab. Interactive
 // apply portals start as the real site so their forms work.
 const startMode = useCallback(
  (url: string): ViewMode =>
   isDocumentApplication(type) || looksLikePdfUrl(url) || !url.startsWith("https:") ? "preview" : "direct",
  [type]
 )
 const [viewMode, setViewMode] = useState<ViewMode>(() => startMode(officialUrl))
 const viewModeRef = useRef<ViewMode>(viewMode)
 // Ways of opening the current address that have already failed.
 const failedRef = useRef({ preview: false, direct: false })
 const latestUrlRef = useRef(currentUrl)
 const [previewFailed, setPreviewFailed] = useState(false)
 const [iframeLoaded, setIframeLoaded] = useState(false)
 // Frame is shown although it has not finished loading every resource.
 const [revealed, setRevealed] = useState(false)
 const [hintDismissed, setHintDismissed] = useState(false)
 const [blocked, setBlocked] = useState(false)
 const [slowLoad, setSlowLoad] = useState(false)
 const [iframeKey, setIframeKey] = useState(0)
 const [noticeVisible, setNoticeVisible] = useState(() => {
  if (typeof window === "undefined") return false
  try {
   return !window.sessionStorage.getItem(`cj-apply-notice-${slug}`)
  } catch {
   return true
  }
 })

 const analyticsBase = useMemo(
  () => ({ job_id: jobId, job_slug: slug, job_type: type, destination_domain: currentHostname }),
  [jobId, slug, type, currentHostname]
 )
 const openedTracked = useRef(false)
 const previewTracked = useRef<string | null>(null)
 const iframeRef = useRef<HTMLIFrameElement | null>(null)

 const isDocument = isDocumentApplication(type)
 const isPdf = activeTab?.kind === "pdf" || info?.isPdf === true || looksLikePdfUrl(currentUrl)
 // Address the real site can be framed at: https only (browsers refuse an
 // http frame on an https page). Before the check answers, trust https links.
 const directSrc = info ? info.directUrl : currentUrl.startsWith("https:") ? currentUrl : null

 const previewUrl = useMemo(() => {
  if (!currentUrl) return null
  return isPdf ? buildDocProxyUrl(currentUrl) : buildHtmlProxyUrl(currentUrl)
 }, [currentUrl, isPdf])

 const downloadUrl = useMemo(() => {
  if (!currentUrl) return null
  if (!isPdf && !isDocument) return null
  return `${buildDocProxyUrl(currentUrl, true)}&filename=${encodeURIComponent(slug)}`
 }, [currentUrl, isPdf, isDocument, slug])

 const downloadFilename = useMemo(() => `${slug}.pdf`, [slug])
 const iframeSrc = (viewMode === "direct" ? directSrc : previewUrl) ?? previewUrl ?? currentUrl
 const showingPreview = iframeSrc === previewUrl
 // In the real-site frame only a confirmed PDF gets the unsandboxed PDF frame.
 const frameIsPdf = showingPreview ? isPdf : info?.isPdf === true
 const frameKey = `${iframeKey}:${viewMode}:${currentUrl}`

 // Open the connection to the official host while the first checks run.
 const directOrigin = useMemo(() => {
  try {
   return directSrc ? new URL(directSrc).origin : null
  } catch {
   return null
  }
 }, [directSrc])
 if (directOrigin) preconnect(directOrigin)

 const dismissNotice = useCallback(() => {
  setNoticeVisible(false)
  try {
   window.sessionStorage.setItem(`cj-apply-notice-${slug}`, "1")
  } catch {
   // Ignore storage failures.
  }
 }, [slug])

 // application_page_opened + browse_opened (once per shell mount).
 useEffect(() => {
  if (openedTracked.current) return
  openedTracked.current = true
  trackApplyEvent("application_page_opened", analyticsBase)
  trackApplyEvent("browse_opened", analyticsBase)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount
 }, [])

 /** Switch how the current address is shown (real site vs ChayanJobs-served view). */
 const applyMode = useCallback((mode: ViewMode) => {
  if (viewModeRef.current === mode) return
  viewModeRef.current = mode
  setViewMode(mode)
  setIframeLoaded(false)
  setRevealed(false)
  setSlowLoad(false)
 }, [])

 const showInterstitial = useCallback(() => {
  setBlocked(true)
  trackApplyEvent("iframe_failed", analyticsBase)
  trackApplyEvent("interstitial_shown", analyticsBase)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
 }, [analyticsBase])

 const runFrameCheck = useCallback(async (url: string) => {
  setFrameStatus("checking")
  const data = await fetchFrameCheck(url)
  if (latestUrlRef.current !== url) return // user already moved on
  if (!data) {
   setFrameStatus("unknown")
   return
  }
  setCheck({ url, data })
  if (data.notFound) {
   showInterstitial()
   return
  }
  setFrameStatus(data.frameable === false ? "blocked" : data.frameable ? "allowed" : "unknown")
  // PDFs, sites that refuse framing and http-only sites cannot be shown as
  // the real site in a frame: use the ChayanJobs-served view for them.
  const needsPreview = data.isPdf || data.frameable === false || !data.directUrl
  if (!needsPreview) return
  if (failedRef.current.preview) {
   // The served view already failed and the real site cannot be framed.
   if (data.frameable === false || !data.directUrl) showInterstitial()
   return
  }
  if (viewModeRef.current !== "preview") {
   applyMode("preview")
   if (previewTracked.current !== url) {
    previewTracked.current = url
    trackApplyEvent(data.isPdf ? "pdf_preview_shown" : "proxy_preview_shown", {
     job_id: jobId, job_slug: slug, job_type: type, destination_domain: getExternalHostname(url),
    })
   }
  }
 }, [jobId, slug, type, applyMode, showInterstitial])

 // Reset per-tab view state when switching tabs / navigating.
 useEffect(() => {
  latestUrlRef.current = currentUrl
  failedRef.current = { preview: false, direct: false }
  // A site already known to refuse framing goes straight to the served view.
  viewModeRef.current = hostRefusesFraming(currentUrl) ? "preview" : startMode(currentUrl)
  /* eslint-disable react-hooks/set-state-in-effect -- tab switch must reset view state */
  setViewMode(viewModeRef.current)
  setIframeLoaded(false)
  setRevealed(false)
  setPreviewFailed(false)
  setBlocked(false)
  setSlowLoad(false)
  /* eslint-enable react-hooks/set-state-in-effect */
  previewTracked.current = null
  if (currentUrl) void runFrameCheck(currentUrl)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on tab identity change
 }, [activeId, currentUrl])

 /** The ChayanJobs-served view failed: fall back to the real site if it can be framed. */
 const failPreview = useCallback(() => {
  failedRef.current.preview = true
  setPreviewFailed(true)
  const known = checkCache.get(currentUrl)
  const canFrameSite = known
   ? known.frameable !== false && !!known.directUrl
   : currentUrl.startsWith("https:")
  // A phone cannot show a PDF in a frame at all, whoever serves it.
  const pdfNeedsViewer = isPdf && nativePdf === false
  if (canFrameSite && !pdfNeedsViewer && !failedRef.current.direct) applyMode("direct")
  else showInterstitial()
 }, [currentUrl, isPdf, nativePdf, applyMode, showInterstitial])

 /** The real site failed in the frame: fall back to the ChayanJobs-served view. */
 const failDirect = useCallback(() => {
  failedRef.current.direct = true
  if (!failedRef.current.preview) {
   applyMode("preview")
   trackApplyEvent(isPdf ? "pdf_preview_shown" : "proxy_preview_shown", analyticsBase)
  } else {
   showInterstitial()
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
 }, [isPdf, applyMode, showInterstitial, analyticsBase])

 // Messages from the ChayanJobs-served frame (script injected by /api/proxy,
 // or the error page of /api/proxy and /api/doc):
 //  - cj-frame-ready: the page is readable, drop the loading screen now.
 //  - cj-frame-error: it could not be fetched, switch to another way.
 //  - cj-open-tab: a link was clicked; open it as a tab INSIDE ChayanJobs
 //    (normal click navigates this tab, Ctrl/middle/_blank opens a new one).
 // Origin + source are verified so only our own frame can drive the shell.
 useEffect(() => {
  const onFrameMessage = (e: MessageEvent) => {
   // Proxied pages are sandboxed, so their origin is opaque ("null"). The
   // source check below is what proves the message came from our own frame.
   if (e.origin !== window.location.origin && e.origin !== "null") return
   if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return
   const data = e.data as { type?: unknown; url?: unknown; newTab?: unknown } | null
   if (!data) return
   if (data.type === "cj-frame-ready") {
    setIframeLoaded(true)
    setSlowLoad(false)
    return
   }
   if (data.type === "cj-frame-error") {
    if (viewModeRef.current === "preview") failPreview()
    return
   }
   if (data.type !== "cj-open-tab" || typeof data.url !== "string") return
   const normalized = normalizeExternalUrl(data.url)
   if (!normalized) return
   if (data.newTab === true) {
    const t = openTab(normalized, { switchTo: true })
    if (t) trackApplyEvent("browser_tab_opened", analyticsBase)
   } else {
    navigateActive(normalized)
    trackApplyEvent("browser_navigate", analyticsBase)
   }
  }
  window.addEventListener("message", onFrameMessage)
  return () => window.removeEventListener("message", onFrameMessage)
 }, [openTab, navigateActive, analyticsBase, failPreview])

 // New destination arrived via props (e.g. /browse?url= changed) ->
 // open it as a tab INSIDE the browser instead of replacing the page.
 // The first destination is opened by useBrowserTabs itself (which also
 // restores the tab a refresh came from), so only later changes act here.
 const inboundUrlRef = useRef(officialUrl)
 useEffect(() => {
  if (inboundUrlRef.current === officialUrl) return
  inboundUrlRef.current = officialUrl
  const normalized = normalizeExternalUrl(officialUrl)
  if (normalized) openTab(normalized, { title, switchTo: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- react to inbound destination only
 }, [officialUrl, title])

 // Slow-load hint if the iframe takes too long.
 useEffect(() => {
  if (iframeLoaded || revealed || blocked) return
  const t = window.setTimeout(() => {
   // Our server could not reach the site either: stop waiting and offer the
   // official link instead of an endless spinner.
   if (checkCache.get(currentUrl) === undefined && frameStatus === "unknown") showInterstitial()
   else setSlowLoad(true)
  }, LOAD_TIMEOUT_MS)
  return () => window.clearTimeout(t)
 }, [iframeKey, currentUrl, viewMode, iframeLoaded, revealed, blocked, frameStatus, showInterstitial])

 // A real site that is known to allow framing is shown while it is still
 // loading, like a normal browser tab. A frame's "load" event only fires
 // after its last image and script, which on slow portals takes many seconds.
 useEffect(() => {
  if (iframeLoaded || revealed || blocked) return
  const frameableSite = viewMode === "direct" && info?.frameable === true && !info.isPdf
  // The browser's own PDF viewer draws its own progress bar, and not every
  // browser reports "load" for it; a failed fetch still arrives as cj-frame-error.
  const builtInPdfViewer = showingPreview && frameIsPdf && nativePdf === true
  if (!frameableSite && !builtInPdfViewer) return
  const t = window.setTimeout(() => setRevealed(true), REVEAL_DELAY_MS)
  return () => window.clearTimeout(t)
 }, [iframeKey, viewMode, info, showingPreview, frameIsPdf, nativePdf, iframeLoaded, revealed, blocked])

 const reload = useCallback(() => {
  checkCache.delete(currentUrl)
  failedRef.current = { preview: false, direct: false }
  viewModeRef.current = startMode(currentUrl)
  setViewMode(viewModeRef.current)
  setPreviewFailed(false)
  setIframeLoaded(false)
  setRevealed(false)
  setBlocked(false)
  setSlowLoad(false)
  setIframeKey((k) => k + 1)
  if (currentUrl) void runFrameCheck(currentUrl)
 }, [runFrameCheck, currentUrl, startMode])

 const handleIframeLoad = useCallback(() => {
  setIframeLoaded(true)
  setSlowLoad(false)
  trackApplyEvent("iframe_loaded", analyticsBase)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
 }, [analyticsBase])

 const handleIframeError = useCallback(() => {
  if (viewModeRef.current === "direct") failDirect()
  else failPreview()
 }, [failDirect, failPreview])

 const retryMode = useCallback((mode: ViewMode) => {
  failedRef.current[mode] = false
  if (mode === "preview") setPreviewFailed(false)
  viewModeRef.current = mode
  setViewMode(mode)
  setBlocked(false)
  setIframeLoaded(false)
  setRevealed(false)
  setSlowLoad(false)
  setIframeKey((k) => k + 1)
 }, [])

 const tryDirect = useCallback(() => retryMode("direct"), [retryMode])

 const tryPreview = useCallback(() => {
  retryMode("preview")
  trackApplyEvent("proxy_preview_retry", analyticsBase)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
 }, [retryMode, analyticsBase])

 const toggleCollapse = useCallback(() => {
  setCollapsed((prev) => {
   const next = !prev
   try {
    window.sessionStorage.setItem(RAIL_STORAGE_KEY, next ? "1" : "0")
   } catch {
    // Ignore storage failures.
   }
   if (next) trackApplyEvent("sidebar_collapsed", analyticsBase)
   return next
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
 }, [analyticsBase])

 const openInfo = useCallback(() => {
  setDrawerOpen(true)
  trackApplyEvent("job_info_opened", analyticsBase)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
 }, [analyticsBase])

 const reportIssue = useCallback(() => {
  trackApplyEvent("report_issue_clicked", analyticsBase)
  router.push("/contact")
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
 }, [router, analyticsBase])

 const handleApply = useCallback(() => {
  trackApplyEvent("apply_cta_clicked", analyticsBase)
  trackApplyEvent("official_site_opened", analyticsBase)
  trackApplyEvent("continue_clicked", analyticsBase)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
 }, [analyticsBase])

 const handleDownload = useCallback((e?: { preventDefault(): void }) => {
  // Stop the anchor's same-tab navigation: the helper downloads via blob
  // (stays in place) and only opens a new tab if the proxy fails.
  e?.preventDefault();
  trackApplyEvent("pdf_download_clicked", analyticsBase);
  if (!downloadUrl) return;
  void (async () => {
   const result = await downloadPdfFile({
    proxyUrl: downloadUrl,
    directUrl: currentUrl,
    filename: downloadFilename,
   });
   if (result === "direct") trackApplyEvent("official_site_opened", analyticsBase);
  })();
 }, [analyticsBase, downloadUrl, currentUrl, downloadFilename])

 const handleNavigate = useCallback((url: string) => {
  navigateActive(url)
 }, [navigateActive])

 const handleOpenInNewTab = useCallback((url: string) => {
  const t = openTab(url, { switchTo: true })
  if (t) trackApplyEvent("browser_tab_opened", analyticsBase)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
 }, [openTab, analyticsBase])

 const handleCloseTab = useCallback((id: string) => {
  closeTab(id)
  trackApplyEvent("browser_tab_closed", analyticsBase)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
 }, [closeTab, analyticsBase])

 const handleNewTab = useCallback(() => {
  newTab()
  trackApplyEvent("browser_tab_opened", analyticsBase)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
 }, [newTab, analyticsBase])

 const share = useCallback(async () => {
  const url = window.location.href
  try {
   if (navigator.share) {
    await navigator.share({ title, text: `${title} - ${organization}`, url })
    return
   }
   await navigator.clipboard.writeText(url)
  } catch {
   // User cancelled or clipboard unavailable - stay silent.
  }
 }, [title, organization])

 const showFallback = blocked
 // The real site's frame also fires "load" when the site refuses framing
 // (the browser shows its own error box), so keep the loading screen until
 // the check has said the frame is allowed.
 const frameVisible = (iframeLoaded || revealed) && !(viewMode === "direct" && frameStatus === "checking")
 const ctaSublabel = isDocument
  ? "Official Document"
  : type === "government"
   ? "Official Website"
   : "Official Application"
 const noticeText = isDocument
  ? "You are opening the official document in fullscreen."
  : type === "government"
   ? "You are opening the official application website."
   : "You'll complete your application on the company's official careers website."

 return (
  <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground dark:bg-paper dark:text-paper">
   {/* Desktop left tool rail */}
   <div className={focus ? "hidden" : "hidden shrink-0 md:flex"}>
    <ApplicationToolRail
     collapsed={collapsed}
     onToggleCollapse={toggleCollapse}
     backHref={backHref}
     backLabel={backLabel}
     onInfo={openInfo}
     onReload={reload}
     officialUrl={currentUrl}
     hostname={currentHostname}
     onReport={reportIssue}
    />
   </div>

   {/* Main column: top bar + tabs + address + official website */}
   <div className="flex min-w-0 flex-1 flex-col">
    {!focus && (
    <ApplicationTopBar
     type={type}
     title={title}
     organization={organization}
     hostname={currentHostname}
     deadlineLabel={deadlineLabel}
     sourceLabel={sourceLabel}
     backHref={backHref}
     backLabel={backLabel}
     mobileMenu={
      <ApplicationMobileMenu
       hostname={currentHostname}
       officialUrl={currentUrl}
       onInfo={openInfo}
       onReload={reload}
       onShare={share}
       onReport={reportIssue}
       downloadUrl={downloadUrl}
       downloadFilename={downloadFilename}
       onDownload={handleDownload}
      />
     }
    />
    )}

    {(!focus || tabs.length > 1) && (
    <BrowserTabStrip
     tabs={tabs}
     activeId={activeId}
     onSwitch={switchTab}
     onClose={handleCloseTab}
     onNew={handleNewTab}
    />
    )}

    <BrowserAddressBar
     currentUrl={currentUrl}
     hostname={currentHostname}
     loading={!isBlank && !iframeLoaded && !showFallback}
     analytics={analyticsBase}
     onNavigate={handleNavigate}
     onReload={reload}
     onShare={share}
     onOpenInNewTab={handleOpenInNewTab}
     focus={focus}
     onToggleFocus={toggleFocus}
     onFullscreen={toggleFullscreen}
     backHref={backHref}
     backLabel={backLabel}
     title={title}
     downloadUrl={isDocument || isPdf ? downloadUrl : null}
     downloadFilename={downloadFilename}
     onDownload={handleDownload}
     openUrl={currentUrl}
     canGoBack={canGoBack}
     canGoForward={canGoForward}
     onBack={goBack}
     onForward={goForward}
    />

    <div className="relative min-h-0 flex-1 bg-background dark:bg-background">
     {isBlank ? (
      <BrowserNewTab backHref={backHref} backLabel={backLabel} onNavigate={handleNavigate} />
     ) : showFallback ? (
      <ApplicationFallback
       organization={organization}
       hostname={currentHostname}
       officialUrl={currentUrl}
       sourceLabel={sourceLabel}
       headline={info?.notFound ? "This link is not working" : isDocument ? "Official document" : undefined}
       notFound={info?.notFound === true}
       isPdf={isPdf}
       previewUrl={previewUrl}
       downloadUrl={downloadUrl}
       downloadFilename={downloadFilename}
       onReload={reload}
       onTryDirect={tryDirect}
       onTryPreview={previewUrl && !previewFailed && !info?.notFound ? tryPreview : undefined}
       onReport={reportIssue}
       onOpenOfficial={handleApply}
       onDownload={handleDownload}
      />
     ) : (
      <>
       {/* A PDF waits one tick until we know which viewer this browser needs. */}
       {frameIsPdf && nativePdf === null ? null : (
        <ApplicationIframe
         src={iframeSrc}
         title={title}
         frameKey={frameKey}
         isPdf={frameIsPdf}
         canvasPdf={nativePdf === false}
         iframeRef={iframeRef}
         onLoad={handleIframeLoad}
         onError={handleIframeError}
        />
       )}

       {/* Sign-in, OTP and payment need the site's own tab when it cannot keep a session in a frame. */}
       {!isDocument && !isPdf && !hintDismissed && frameVisible &&
        (viewMode === "preview" || info?.sessionInFrame === false || frameStatus === "unknown") && (
        <div className="absolute left-1/2 top-2 z-30 w-[calc(100%-1rem)] max-w-md -translate-x-1/2">
         <div className="flex items-center gap-2 rounded-xl border border-rule bg-background px-3 py-2 text-xs text-muted-foreground shadow-lg">
          <Info className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden="true" />
          <p className="flex-1 leading-relaxed">
           {frameStatus === "unknown" && viewMode === "direct"
            ? `Page not showing? Open ${currentHostname} in its own tab.`
            : `To sign in, enter OTP or pay, ${currentHostname} needs its own tab.`}
          </p>
          <a
           href={currentUrl}
           target="_blank"
           rel="noopener noreferrer"
           onClick={handleApply}
           className="inline-flex shrink-0 items-center gap-1 rounded-md bg-foreground px-2 py-1 font-semibold text-background"
          >
           Open
           <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </a>
          <button type="button" onClick={() => setHintDismissed(true)} aria-label="Dismiss" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-paper-3">
           <X className="h-3.5 w-3.5" />
          </button>
         </div>
        </div>
       )}

       {/* Loading overlay */}
       {!frameVisible && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background p-8 text-center dark:bg-paper">
         <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink dark:bg-background">
          <Globe className="h-6 w-6 text-paper dark:text-foreground" aria-hidden="true" />
         </div>
         <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-rule border-t-gray-900 dark:border-ink dark:border-t-white"
          aria-hidden="true"
         />
         <p className="text-sm font-medium text-foreground dark:text-muted-foreground">
          {frameStatus === "checking" && !iframeLoaded
           ? `Checking ${currentHostname}`
           : `Opening ${currentHostname}`}
          {viewMode === "preview" ? " preview" : ""}
         </p>
         <p className="max-w-sm text-xs text-muted-foreground">
          {slowLoad
           ? "Still loading. The portal may be slow - please wait or try Reload."
           : viewMode === "preview"
            ? "Loading the in-app preview for you."
            : "Loading the official website for you."}
         </p>
         {slowLoad && (
          <button
           type="button"
           onClick={reload}
           className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-lg border border-rule px-3 text-xs font-medium text-foreground transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:border-ink dark:text-muted-foreground dark:hover:bg-ink"
          >
           <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
           Reload
          </button>
         )}
         {slowLoad && (
          <a
           href={currentUrl}
           target="_blank"
           rel="noopener noreferrer"
           onClick={handleApply}
           className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-semibold text-background"
          >
           Open official site
           <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
         )}
        </div>
       )}

       {/* Preview-mode pill: one-tap switch back to direct */}
       {viewMode === "preview" && iframeLoaded && !isPdf && isDocument && info?.frameable === true && !!directSrc && (
        <div className="absolute left-1/2 top-2 z-20 w-[calc(100%-1rem)] max-w-md -translate-x-1/2">
         <div className="flex items-center gap-2 rounded-xl border border-rule bg-background px-3 py-2 text-xs text-muted-foreground dark:border-rule dark:bg-ink dark:text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden="true" />
          <p className="flex-1 leading-relaxed">In-app preview. Some buttons may need the direct site.</p>
          <button
           type="button"
           onClick={tryDirect}
           className="shrink-0 rounded-md bg-paper-3 px-2 py-1 font-semibold text-paper hover:bg-paper-3"
          >
           Direct
          </button>
         </div>
        </div>
       )}

       {/* One-time informational notice (non-blocking, dismissible) */}
       {noticeVisible && iframeLoaded && viewMode === "direct" && info?.sessionInFrame !== false && (
        <div className="absolute left-1/2 top-2 z-20 w-[calc(100%-1rem)] max-w-md -translate-x-1/2">
         <div className="flex items-start gap-2 rounded-xl border border-rule bg-background px-3 py-2 text-xs text-muted-foreground dark:border-ink dark:bg-ink dark:text-muted-foreground">
          <Info
           className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground"
           aria-hidden="true"
          />
          <p className="flex-1 leading-relaxed">
           {noticeText}
          </p>
          <button
           type="button"
           onClick={dismissNotice}
           aria-label="Dismiss notice"
           className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:hover:bg-ink dark:hover:text-muted-foreground"
          >
           <X className="h-3.5 w-3.5" />
          </button>
         </div>
        </div>
       )}
      </>
     )}
    </div>

    {/* Mobile sticky bottom CTA bar (hidden on blank new-tab page) */}
    {!isBlank && !focus ? (
     <div className="shrink-0 md:hidden">
      <ApplicationFloatingCTA
       variant="mobile"
       officialUrl={currentUrl}
       hostname={currentHostname}
       sublabel={ctaSublabel}
       title={isDocument ? (downloadUrl ? "Download PDF" : "Open Document") : undefined}
       onApply={handleApply}
       downloadUrl={isDocument || isPdf ? downloadUrl : null}
       downloadFilename={downloadFilename}
       onDownload={handleDownload}
      />
     </div>
    ) : null}
   </div>

   {/* Focus-mode dock: Apply / Download stay one tap away at bottom-right */}
   {!isBlank && focus ? (
    <ApplicationFocusDock
     officialUrl={currentUrl}
     hostname={currentHostname}
     applyLabel={isDocument ? "Open original" : "Apply Now"}
     downloadUrl={isDocument || isPdf ? downloadUrl : null}
     downloadFilename={downloadFilename}
     onDownload={handleDownload}
     onApply={handleApply}
     onInfo={openInfo}
     onReload={reload}
     onExitFocus={toggleFocus}
    />
   ) : null}

   {/* Desktop floating CTA - hidden on blank new-tab page */}
   {!isBlank && !focus ? (
    <ApplicationFloatingCTA
     variant="desktop"
     officialUrl={currentUrl}
     hostname={currentHostname}
     sublabel={ctaSublabel}
     title={isDocument ? (downloadUrl ? "Download PDF" : "Open Document") : undefined}
     onApply={handleApply}
     downloadUrl={isDocument || isPdf ? downloadUrl : null}
     downloadFilename={downloadFilename}
     onDownload={handleDownload}
    />
   ) : null}

   {/* Job info overlay drawer (never resizes the iframe) */}
   <ApplicationInfoDrawer
    open={drawerOpen}
    onOpenChange={setDrawerOpen}
    type={type}
    title={title}
    organization={organization}
    hostname={currentHostname}
    officialUrl={currentUrl}
    sourceLabel={sourceLabel}
    deadlineLabel={deadlineLabel}
    updatedLabel={updatedLabel}
    infoRows={infoRows}
    ctaLabel={isDocument ? (downloadUrl ? "Download PDF" : "Open Document") : undefined}
    downloadUrl={isDocument || isPdf ? downloadUrl : null}
    downloadFilename={downloadFilename}
    onDownload={handleDownload}
    onApply={handleApply}
    aboutCopy={
     isDocument
      ? `This document opens from the ${sourceLabel.toLowerCase()} (${currentHostname}). ChayanJobs only opens the verified official file for you.`
      : undefined
    }
    onReport={reportIssue}
   />
  </div>
 )
}
