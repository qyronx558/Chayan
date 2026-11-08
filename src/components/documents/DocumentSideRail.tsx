"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import {
  FileText,
  ShieldCheck,
  Share2,
  Copy,
  Check,
  Flag,
  Printer,
} from "lucide-react"
import { useState } from "react"
import { formatDate, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useActiveSection } from "@/components/shared/useActiveSection"
import { SmartExternalLink } from "@/components/shared/SmartExternalLink"

interface RailSection {
  id: string
  label: string
}

interface RelatedLink {
  label: string
  value: string
  href: string
}

interface Props {
  title: string
  department: string
  category?: string | null
  downloadUrl?: string | null
  downloadLabel: string
  /** Fullscreen viewer route. When set, the download button opens it. */
  viewerHref?: string | null
  linkRows?: RelatedLink[]
  publishedAt?: string | null
  sections: RailSection[]
  /** Kind-specific buttons: tracker / follow / bookmark */
  actions?: ReactNode
}

/**
 * Sticky conversion rail for result / admit-card / answer-key /
 * syllabus / admission pages: download card, verify card,
 * scroll-spy TOC and consolidated share. Hidden in print.
 */
export function DocumentSideRail(p: Props) {
  const [copied, setCopied] = useState(false)
  const active = useActiveSection(p.sections.map((s) => s.id))

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="space-y-4 print:hidden lg:sticky lg:top-24 lg:self-start">
      {/* ── Download card ── */}
      <Card className="overflow-hidden border-rule  dark:border-ink">
        <div aria-hidden="true" className="h-1 bg-brick" />
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Official document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {p.downloadUrl ? (
            <Button className="w-full bg-ink font-semibold text-paper hover:bg-ink-2" size="lg" asChild>
              {p.viewerHref ? (
                <Link href={p.viewerHref}>
                  <FileText className="mr-2 h-4 w-4" /> {p.downloadLabel}
                </Link>
              ) : (
                <a href={p.downloadUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" /> {p.downloadLabel}
                </a>
              )}
            </Button>
          ) : (
            <Button className="w-full" size="lg" disabled>
              <FileText className="mr-2 h-4 w-4" /> Coming Soon
            </Button>
          )}
          {p.actions ? <div className="flex flex-wrap gap-2">{p.actions}</div> : null}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()} title="Print / Save PDF">
              <Printer className="mr-1.5 h-4 w-4" /> Print / PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Verify card ── */}
      <Card className="border-rule dark:border-ink">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-foreground" /> Verify this document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="bg-paper-3 text-foreground dark:bg-paper-3 dark:text-foreground">
              <Check className="mr-1 h-3 w-3" /> Source checked
            </Badge>
            {p.category ? <Badge variant="outline">{p.category}</Badge> : null}
          </div>
          <dl className="space-y-1.5 text-muted-foreground dark:text-muted-foreground">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Department</dt>
              <dd className="text-right font-semibold text-foreground dark:text-paper">{p.department}</dd>
            </div>
            {p.publishedAt ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Published</dt>
                <dd className="font-semibold tabular-nums">{formatDate(p.publishedAt)}</dd>
              </div>
            ) : null}
            {p.linkRows?.slice(0, 2).map((l) => (
              <div key={l.label} className="flex justify-between gap-2">
                <dt className="shrink-0 text-muted-foreground">{l.label}</dt>
                <dd className="truncate text-right">
                  <SmartExternalLink href={l.href} linkTitle={l.value} className="font-semibold text-foreground underline-offset-2 hover:underline dark:text-foreground">
                    {l.value}
                  </SmartExternalLink>
                </dd>
              </div>
            ))}
          </dl>
          <div className="pt-1">
            <a href="#discussion" onClick={(e) => { e.preventDefault(); document.getElementById("discussion")?.scrollIntoView({ behavior: "smooth" }) }} className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground dark:text-muted-foreground">
              <Flag className="h-3 w-3" /> Report an error
            </a>
          </div>
          <p className="border-t border-dashed border-rule pt-2 text-[11px] leading-relaxed text-muted-foreground dark:border-ink dark:text-muted-foreground">
            Not a govt. website. Always cross-check details on the department&apos;s official website before acting.
          </p>
        </CardContent>
      </Card>

      {/* ── On this page ── */}
      {p.sections.length > 1 ? (
        <Card className="hidden lg:block dark:border-ink">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">On this page</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {p.sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition",
                  active === s.id
                    ? "bg-paper-2 font-bold text-brick dark:bg-paper-2 dark:text-brick"
                    : "text-muted-foreground hover:bg-paper-2 hover:text-foreground dark:text-muted-foreground dark:hover:bg-ink",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", active === s.id ? "bg-paper-2" : "bg-paper-3 dark:bg-ink-2")} />
                {s.label}
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* ── Share (single, consolidated) ── */}
      <Card className="dark:border-ink">
        <CardContent className="flex items-center gap-2 p-3.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Share2 className="h-3.5 w-3.5" /> Share</span>
          <div className="ml-auto flex gap-1.5">
            <Button variant="outline" size="sm" onClick={copyLink} className="h-8 text-xs">
              {copied ? <Check className="mr-1 h-3.5 w-3.5 text-foreground" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${p.title} - ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(p.title)}`} target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
