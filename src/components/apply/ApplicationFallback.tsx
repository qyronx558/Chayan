"use client"

import { ArrowUpRight, Download, Eye, Globe, Lock, RefreshCw, ShieldCheck } from "lucide-react"

interface ApplicationFallbackProps {
 organization: string
 hostname: string
 officialUrl: string
 sourceLabel: string
 headline?: string
 isPdf?: boolean
 /** Same-origin proxied URL (/api/proxy or /api/doc). Shown as "Preview inside" action. */
 previewUrl?: string | null
 /** Same-origin download URL (/api/doc?download=1). Shown for PDFs. */
 downloadUrl?: string | null
 downloadFilename?: string
 onReload: () => void
 onTryDirect?: () => void
 onTryPreview?: () => void
 onReport: () => void
 onOpenOfficial: () => void
 onDownload?: () => void
}

/**
 * Stay-on-ChayanJobs interstitial when embedding is blocked.
 * Never auto-exits: user explicitly picks Preview / Retry / Download / Continue.
 */
export function ApplicationFallback({
 organization,
 hostname,
 officialUrl,
 sourceLabel,
 headline = "Official application website",
 isPdf,
 previewUrl,
 downloadUrl,
 downloadFilename,
 onReload,
 onTryDirect,
 onTryPreview,
 onReport,
 onOpenOfficial,
 onDownload,
}: ApplicationFallbackProps) {
 return (
  <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-background p-4 pb-28 md:pb-24 dark:bg-paper">
   <div className="w-full max-w-md rounded-2xl border border-rule bg-background p-6 text-center sm:p-8 dark:border-ink dark:bg-ink">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ink dark:bg-background">
     <Globe className="h-6 w-6 text-paper dark:text-foreground" aria-hidden="true" />
    </div>

    <h2 className="mt-4 text-lg font-semibold text-foreground dark:text-paper">
     {headline}
    </h2>
    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground dark:text-muted-foreground">
     You&apos;re still on ChayanJobs. This website doesn&apos;t allow embedded viewing.
     {isPdf ? " Try the in-app preview or download below." : " Try the in-app preview below."}
    </p>

    {/* Primary: stay-inside actions */}
    {previewUrl && onTryPreview ? (
     <button
      type="button"
      onClick={onTryPreview}
      className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-paper-3 text-[15px] font-semibold text-paper transition hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule focus-visible:ring-offset-2"
     >
      <Eye className="h-5 w-5" aria-hidden="true" />
      Preview inside ChayanJobs
     </button>
    ) : null}

    {isPdf && downloadUrl ? (
     <a
      href={downloadUrl}
      download={downloadFilename || "document.pdf"}
      onClick={onDownload}
      className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-rule text-[15px] font-semibold text-foreground transition hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:text-foreground dark:hover:bg-paper-3"
     >
      <Download className="h-5 w-5" aria-hidden="true" />
      Download PDF
     </a>
    ) : null}

    {/* Last resort: explicit exit */}
    <a
     href={officialUrl}
     target="_blank"
     rel="noopener noreferrer"
     onClick={onOpenOfficial}
     className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rule text-sm font-medium text-muted-foreground transition hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:border-ink dark:text-muted-foreground dark:hover:bg-ink"
    >
     Continue on official site
     <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
    </a>

    <div className="mt-4 space-y-1.5 border-t border-dashed border-rule pt-4 text-xs text-muted-foreground dark:border-ink dark:text-muted-foreground">
     <p className="flex items-center justify-center gap-1.5 font-medium text-foreground dark:text-foreground">
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Verified destination
     </p>
     <p className="font-medium text-foreground dark:text-muted-foreground">{organization}</p>
     <p className="inline-flex items-center gap-1 rounded-full bg-paper-3 px-2.5 py-1 font-mono text-[11px] dark:bg-ink">
      <Lock className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
      {hostname}
     </p>
     <p className="text-muted-foreground">{sourceLabel}</p>
    </div>

    <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
     <button
      type="button"
      onClick={onTryDirect ?? onReload}
      className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:text-muted-foreground"
     >
      <RefreshCw className="h-3 w-3" aria-hidden="true" />
      Try direct again
     </button>
     <span aria-hidden="true" className="text-muted-foreground dark:text-muted-foreground">
      |
     </span>
     <button
      type="button"
      onClick={onReport}
      className="font-medium text-muted-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:text-muted-foreground"
     >
      Report broken link
     </button>
    </div>
   </div>
  </div>
 )
}
