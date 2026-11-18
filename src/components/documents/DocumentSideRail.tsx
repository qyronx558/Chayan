"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Flag, FileText } from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { paperShadow } from "@/components/desk/DeskKit"
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
  /** Ink colour of the page this rail sits on (look only). */
  accent?: string
}

/** Sticky desktop rail: state -> primary action -> save/follow -> share -> trust. Hidden in print. */
export function DocumentSideRail(p: Props) {
  const { state } = p
  const accent = p.accent ?? "var(--color-ink)"
  const tone = state.tone === "hot" ? "var(--color-brick)" : state.tone === "ok" ? accent : "oklch(50% 0.02 60)"
  return (
    <aside aria-label="Actions" className="space-y-6 print:hidden lg:sticky lg:top-24 lg:self-start">
      <div className="relative rounded-[4px] border border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)]" style={{ boxShadow: paperShadow }}>
        <div className="px-5 pb-4 pt-5">
          <p className={cn(typeFont.className, "text-[10.5px] font-bold uppercase text-muted-foreground")}>Status</p>
          <p className="mt-1 font-display text-[1.5rem] font-black leading-tight" style={{ color: state.tone === "muted" ? "var(--muted-foreground)" : tone }}>
            {state.headline}
          </p>
          {state.progress !== null ? (
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--hs-surface-2)]" role="progressbar" aria-valuenow={state.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Application window elapsed">
              <div className="h-full rounded-full" style={{ width: `${state.progress}%`, background: tone }} />
            </div>
          ) : null}
          {state.sub ? <p className={cn(handFont.className, "mt-2 text-[1rem] leading-snug text-muted-foreground")}>{state.sub}</p> : null}
        </div>

        {/* perforation */}
        <div className="relative border-t-2 border-dashed border-[var(--hs-border-strong)]" aria-hidden>
          <span className="absolute -left-[9px] -top-[9px] h-4 w-4 rounded-full border border-[var(--hs-border-strong)] bg-background" />
          <span className="absolute -right-[9px] -top-[9px] h-4 w-4 rounded-full border border-[var(--hs-border-strong)] bg-background" />
        </div>

        <div className="space-y-3 px-5 pb-5 pt-5">
          {p.downloadUrl ? (
            <Button className="h-12 w-full rounded-full text-[15px] font-semibold" asChild>
              {p.viewerHref ? (
                <Link href={p.viewerHref} target="_blank" rel="noopener noreferrer"><FileText className="mr-2 h-4 w-4" /> {p.downloadLabel}</Link>
              ) : (
                <a href={p.downloadUrl} target="_blank" rel="noopener noreferrer"><FileText className="mr-2 h-4 w-4" /> {p.downloadLabel}</a>
              )}
            </Button>
          ) : (
            <Button className="h-12 w-full rounded-full" disabled>
              <FileText className="mr-2 h-4 w-4" /> {state.tone === "ok" ? "PDF not attached yet" : state.pill === "Closed" ? "No file attached" : "Not released yet"}
            </Button>
          )}

          {p.actions ? <div className="flex flex-wrap items-center gap-2 pt-2">{p.actions}</div> : null}
          <ShareRow title={p.title} />
        </div>
      </div>

      <div className="relative rotate-[0.4deg] rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] p-4 text-xs" style={{ boxShadow: paperShadow }}>
        <p className="flex items-center gap-2.5 font-semibold text-foreground">
          <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0 -rotate-[10deg]" aria-hidden>
            <circle cx="32" cy="32" r="28" fill="none" stroke="oklch(50% 0.1 160)" strokeWidth="2" />
            <circle cx="32" cy="32" r="22" fill="none" stroke="oklch(50% 0.1 160)" strokeWidth="1" strokeDasharray="2 2" />
            <path d="M21 33 l7 7 l15 -16" fill="none" stroke="oklch(50% 0.1 160)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Checked against the official source
        </p>
        <dl className={cn(typeFont.className, "mt-3 space-y-1.5 text-[11.5px] text-muted-foreground")}>
          <div className="flex justify-between gap-3">
            <dt>Department</dt>
            <dd className="text-right font-bold text-foreground">{p.department}</dd>
          </div>
          {p.publishedAt ? (
            <div className="flex justify-between gap-3">
              <dt>Published</dt>
              <dd className="font-bold tabular-nums text-foreground">{formatDate(p.publishedAt)}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-3 border-t border-dashed border-[var(--hs-border-strong)] pt-2.5 leading-relaxed text-muted-foreground">
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
