"use client"

import { useEffect, useMemo, useState } from "react"
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
} from "lucide-react"
import { formatDate, formatCompact, cn } from "@/lib/utils"
import { useActiveSection } from "@/components/shared/useActiveSection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { SmartExternalLink } from "@/components/shared/SmartExternalLink"

interface RailSection {
  id: string
  label: string
}

interface Props {
  jobId: string
  slug: string
  title: string
  department: string
  advertisementNo: string | null
  officialNotification: string | null
  officialWebsite: string | null
  applyLink: string | null
  updatedAt: string | null
  viewsTotal: number | null
  lastDate: string | null
  sections: RailSection[]
}

export function JobApplyRail(p: Props) {
  const [copied, setCopied] = useState(false)
  const [trackCount, setTrackCount] = useState<number | null>(null)
  const sectionIds = useMemo(() => p.sections.map((s) => s.id), [p.sections])
  const active = useActiveSection(sectionIds)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/applications/count?jobId=${p.jobId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j && typeof j.count === "number") setTrackCount(j.count)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [p.jobId])

  const canApply = Boolean(p.applyLink || p.officialWebsite)
  const officialHost = (() => {
    try {
      return p.officialWebsite ? new URL(p.officialWebsite.startsWith("http") ? p.officialWebsite : `https://${p.officialWebsite}`).hostname.replace(/^www\./, "") : null
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
      <Card className="overflow-hidden border-orange-200 shadow-md dark:border-gray-700">
        <div aria-hidden="true" className="h-1 bg-[linear-gradient(to_right,#FF9933_0%,#FF9933_33.3%,#F8F8F8_33.3%,#F8F8F8_66.6%,#138808_66.6%,#138808_100%)]" />
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Apply for this job</CardTitle>
          {p.lastDate ? (
            <p className="text-xs text-gray-500">Last date: <span className="font-bold text-gray-800 dark:text-gray-100">{formatDate(p.lastDate)}</span></p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-2.5">
          {canApply ? (
            <Button className="w-full bg-gradient-to-r from-[#FF9933] to-[#138808] font-semibold text-white hover:opacity-90" size="lg" asChild>
              <Link href={`/apply/${p.slug}/start`}>
                <ExternalLink className="mr-2 h-4 w-4" /> Apply Now
              </Link>
            </Button>
          ) : null}
          {p.officialNotification ? (
            <Button variant="outline" className="w-full" asChild>
              <SmartExternalLink href={p.officialNotification} linkTitle={`${p.title} - official notification`}>
                <FileText className="mr-2 h-4 w-4" /> Official Notification
              </SmartExternalLink>
            </Button>
          ) : null}
          <div className="flex gap-2">
            <div className="flex-1">
              <ApplicationTracker jobId={p.jobId} variant="full" className="w-full" />
            </div>
            <BookmarkButton jobId={p.jobId} size="default" variant="outline" />
            <Button variant="outline" size="icon" onClick={() => window.print()} title="Print / Save PDF" aria-label="Print">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
          {/* Social proof - only real numbers, hidden until loaded */}
          {(p.viewsTotal !== null && p.viewsTotal > 0) || (trackCount !== null && trackCount > 0) ? (
            <div className="flex items-center gap-3 border-t border-dashed border-gray-200 pt-2.5 text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {p.viewsTotal !== null && p.viewsTotal > 0 ? (
                <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {formatCompact(p.viewsTotal)} views</span>
              ) : null}
              {trackCount !== null && trackCount > 0 ? (
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {formatCompact(trackCount)} tracking</span>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Verify / authenticity card ── */}
      <Card className="border-green-200/70 dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-green-600" /> Verify this job
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200">
              <Check className="mr-1 h-3 w-3" /> Source checked
            </Badge>
            {p.advertisementNo ? <Badge variant="outline">Advt: {p.advertisementNo}</Badge> : null}
          </div>
          <dl className="space-y-1.5 text-gray-600 dark:text-gray-300">
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Department</dt>
              <dd className="text-right font-semibold text-gray-800 dark:text-gray-100">{p.department}</dd>
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
            {p.officialWebsite ? (
              <SmartExternalLink href={p.officialWebsite} linkTitle={`${p.title} - official website`} className="font-semibold text-green-700 underline underline-offset-2 hover:text-green-800 dark:text-green-300">
                Open official website ↗
              </SmartExternalLink>
            ) : null}
            <a href="#discussion" onClick={(e) => { e.preventDefault(); document.getElementById("discussion")?.scrollIntoView({ behavior: "smooth" }) }} className="inline-flex items-center gap-1 font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400">
              <Flag className="h-3 w-3" /> Report an error
            </a>
          </div>
          <p className="border-t border-dashed border-gray-200 pt-2 text-[11px] leading-relaxed text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Not a govt. website. Always cross-check fees, dates & eligibility in the notification before paying or applying.
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
                    ? "bg-orange-50 font-bold text-orange-800 dark:bg-orange-950/50 dark:text-orange-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", active === s.id ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600")} />
                {s.label}
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* ── Share (single, consolidated) ── */}
      <Card className="dark:border-gray-700">
        <CardContent className="flex items-center gap-2 p-3.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500"><Share2 className="h-3.5 w-3.5" /> Share</span>
          <div className="ml-auto flex gap-1.5">
            <Button variant="outline" size="sm" onClick={copyLink} className="h-8 text-xs">
              {copied ? <Check className="mr-1 h-3.5 w-3.5 text-green-600" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
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
