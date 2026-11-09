"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Flag, FileText, ShieldCheck } from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import type { DocState } from "@/lib/doc-state"
import { Button } from "@/components/ui/button"
import { ShareRow } from "@/components/shared/ShareRow"

interface Props {
  title: string
  department: string
  downloadUrl?: string | null
  downloadLabel: string
  /** Fullscreen viewer route. When set, the primary button opens it. */
  viewerHref?: string | null
  publishedAt?: string | null
  state: DocState
  /** Kind-specific buttons: tracker / follow / bookmark */
  actions?: ReactNode
}

/** Sticky desktop rail: state -> primary action -> save/follow -> share -> trust. Hidden in print. */
export function DocumentSideRail(p: Props) {
  const { state } = p
  return (
    <aside aria-label="Actions" className="space-y-3 print:hidden lg:sticky lg:top-24 lg:self-start">
      <div className="border border-rule bg-card shadow-[0_1px_0_var(--color-rule),0_12px_32px_-18px_rgb(0_0_0/0.35)]">
        <div aria-hidden="true" className={cn("h-1", state.tone === "hot" ? "bg-brick" : state.tone === "ok" ? "bg-ink" : "bg-rule-2")} />
        <div className="space-y-4 p-5">
          <div>
            <p className="agate text-[11px] uppercase tracking-wider text-muted-foreground">Status</p>
            <p className={cn("mt-1 font-display text-2xl font-bold leading-tight", state.tone === "hot" ? "text-brick" : state.tone === "muted" ? "text-muted-foreground" : "text-foreground")}>
              {state.headline}
            </p>
            {state.progress !== null ? (
              <div className="mt-3 h-1.5 w-full bg-paper-3" role="progressbar" aria-valuenow={state.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
                <div className={cn("h-full", state.tone === "hot" ? "bg-brick" : "bg-ink")} style={{ width: `${state.progress}%` }} />
              </div>
            ) : null}
            {state.sub ? <p className="agate mt-2 text-xs text-muted-foreground">{state.sub}</p> : null}
          </div>

          {p.downloadUrl ? (
            <Button className="h-11 w-full text-[15px] font-semibold" asChild>
              {p.viewerHref ? (
                <Link href={p.viewerHref}><FileText className="mr-2 h-4 w-4" /> {p.downloadLabel}</Link>
              ) : (
                <a href={p.downloadUrl} target="_blank" rel="noopener noreferrer"><FileText className="mr-2 h-4 w-4" /> {p.downloadLabel}</a>
              )}
            </Button>
          ) : (
            <Button className="h-11 w-full" disabled>
              <FileText className="mr-2 h-4 w-4" /> {state.tone === "ok" ? "PDF not attached yet" : state.pill === "Closed" ? "No file attached" : "Not released yet"}
            </Button>
          )}

          {p.actions ? <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-4">{p.actions}</div> : null}
          <ShareRow title={p.title} />
        </div>
      </div>

      <div className="border border-rule bg-card p-4 text-xs">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Checked against the official source
        </p>
        <dl className="mt-2.5 space-y-1.5 text-muted-foreground">
          <div className="flex justify-between gap-3">
            <dt>Department</dt>
            <dd className="text-right font-medium text-foreground">{p.department}</dd>
          </div>
          {p.publishedAt ? (
            <div className="flex justify-between gap-3">
              <dt>Published</dt>
              <dd className="font-medium tabular-nums text-foreground">{formatDate(p.publishedAt)}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-3 border-t border-rule pt-2.5 leading-relaxed text-muted-foreground">
          Not a government website. Confirm dates and details on the official site before acting.{" "}
          <a
            href="#discussion"
            onClick={(e) => { e.preventDefault(); document.getElementById("discussion")?.scrollIntoView({ behavior: "smooth" }) }}
            className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2 hover:text-brick"
          >
            <Flag className="h-3 w-3" /> Report an error
          </a>
        </p>
      </div>
    </aside>
  )
}
