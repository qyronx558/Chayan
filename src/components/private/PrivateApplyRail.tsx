"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ExternalLink,
  FileText,
  ShieldCheck,
  Share2,
  Copy,
  Check,
  Eye,
  Users,
  Flag,
  Printer,
  Building2,
} from "lucide-react"
import { formatDate, formatCompact, cn } from "@/lib/utils"
import { useActiveSection } from "@/components/shared/useActiveSection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { PrivateTracker } from "@/components/private/PrivateTracker"
import { TrustBadge } from "@/components/private/TrustBadge"

interface RailSection {
  id: string
  label: string
}

interface Props {
  privateJobId: string
  slug: string
  title: string
  company: string
  companySlug?: string | null
  companyWebsite?: string | null
  verifiedEmployer: boolean
  applicationUrl: string | null
  applicationEmail: string | null
  proofUrl: string | null
  trustScore: number
  trustReasons: string[]
  updatedAt: string | null
  createdAt: string | null
  viewsTotal: number | null
  lastDate: string | null
  sections: RailSection[]
}

/**
 * Private mirror of gov JobApplyRail.
 * Same card order and sticky behaviour: Apply → Verify → On this page → Share.
 */
export function PrivateApplyRail(p: Props) {
  const [copied, setCopied] = useState(false)
  const sectionIds = useMemo(() => p.sections.map((s) => s.id), [p.sections])
  const active = useActiveSection(sectionIds)

  const officialHost = (() => {
    try {
      const raw = p.companyWebsite || p.applicationUrl
      if (!raw) return null
      return new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname.replace(/^www\./, "")
    } catch {
      return null
    }
  })()

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
      {/* ── Apply card (primary conversion) ── */}
      <Card className="overflow-hidden border-sky-200 shadow-md dark:border-gray-700">
        <div aria-hidden="true" className="h-1 bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500" />
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Apply for this job</CardTitle>
          {p.lastDate ? (
            <p className="text-xs text-gray-500">
              Last date:{" "}
              <span className="font-bold text-gray-800 dark:text-gray-100">{formatDate(p.lastDate)}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-500">No deadline - apply anytime</p>
          )}
        </CardHeader>
        <CardContent className="space-y-2.5">
          {p.applicationUrl ? (
            <Button className="w-full bg-gradient-to-r from-sky-600 to-teal-600 font-semibold text-white hover:opacity-90" size="lg" asChild>
              <Link href={`/private-jobs/${p.slug}/apply`}>
                <ExternalLink className="mr-2 h-4 w-4" /> Apply Now
              </Link>
            </Button>
          ) : null}
          {!p.applicationUrl && p.applicationEmail ? (
            <Button className="w-full bg-gradient-to-r from-sky-600 to-teal-600 font-semibold text-white hover:opacity-90" size="lg" asChild>
              <a href={`mailto:${p.applicationEmail}`}>
                <ExternalLink className="mr-2 h-4 w-4" /> Apply via Email
              </a>
            </Button>
          ) : null}
          {p.proofUrl ? (
            <Button variant="outline" className="w-full" asChild>
              <a href={p.proofUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-2 h-4 w-4" /> Official Posting Proof
              </a>
            </Button>
          ) : null}
          <div className="flex gap-2">
            <div className="flex-1">
              <PrivateTracker privateJobId={p.privateJobId} variant="full" className="w-full" />
            </div>
            <BookmarkButton privateJobId={p.privateJobId} size="default" variant="outline" />
            <Button variant="outline" size="icon" onClick={() => window.print()} title="Print / Save PDF" aria-label="Print">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
          {p.viewsTotal !== null && p.viewsTotal > 0 ? (
            <div className="flex items-center gap-3 border-t border-dashed border-gray-200 pt-2.5 text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" /> {formatCompact(p.viewsTotal)} views
              </span>
              {p.companySlug ? (
                <Link href={`/companies/${p.companySlug}`} className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:underline">
                  <Users className="h-3 w-3" /> More at {p.company}
                </Link>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Verify / trust card ── */}
      <Card className="border-emerald-200/70 dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Verify this job
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex flex-wrap gap-1.5">
            <TrustBadge score={p.trustScore} reasons={p.trustReasons} size="sm" />
            {p.verifiedEmployer ? (
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                <Check className="mr-1 h-3 w-3" /> Verified employer
              </Badge>
            ) : null}
          </div>
          <dl className="space-y-1.5 text-gray-600 dark:text-gray-300">
            <div className="flex justify-between gap-2">
              <dt className="flex items-center gap-1 text-gray-500">
                <Building2 className="h-3 w-3" /> Company
              </dt>
              <dd className="text-right font-semibold text-gray-800 dark:text-gray-100">{p.company}</dd>
            </div>
            {officialHost ? (
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Official site</dt>
                <dd className="truncate font-semibold">{officialHost}</dd>
              </div>
            ) : null}
            {p.updatedAt ? (
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Last verified</dt>
                <dd className="font-semibold tabular-nums">{formatDate(p.updatedAt)}</dd>
              </div>
            ) : null}
          </dl>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {p.companyWebsite ? (
              <a
                href={p.companyWebsite.startsWith("http") ? p.companyWebsite : `https://${p.companyWebsite}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-300"
              >
                Open company website ↗
              </a>
            ) : null}
            <a
              href="#discussion"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById("discussion")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="inline-flex items-center gap-1 font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400"
            >
              <Flag className="h-3 w-3" /> Report an error
            </a>
          </div>
          <p className="border-t border-dashed border-gray-200 pt-2 text-[11px] leading-relaxed text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Never pay registration fees. Cross-check role, salary & venue on the company site before applying.
          </p>
        </CardContent>
      </Card>

      {/* ── On this page (scroll-spy TOC) ── */}
      {p.sections.length > 1 ? (
        <Card className="hidden lg:block dark:border-gray-700">
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
                    ? "bg-sky-50 font-bold text-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", active === s.id ? "bg-sky-500" : "bg-gray-300 dark:bg-gray-600")} />
                {s.label}
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* ── Share (single, consolidated) ── */}
      <Card className="dark:border-gray-700">
        <CardContent className="flex items-center gap-2 p-3.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Share2 className="h-3.5 w-3.5" /> Share
          </span>
          <div className="ml-auto flex gap-1.5">
            <Button variant="outline" size="sm" onClick={copyLink} className="h-8 text-xs">
              {copied ? <Check className="mr-1 h-3.5 w-3.5 text-green-600" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${p.title} at ${p.company} - ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(`${p.title} at ${p.company}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
