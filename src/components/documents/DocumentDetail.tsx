"use client"

import {
  FileText, ExternalLink, Check, Copy, Printer,
  CalendarCheck, CalendarDays, CalendarClock, CalendarPlus,
  Building2, Tag, Briefcase, Wallet, MapPin, School,
  GraduationCap, FileCheck2, Ticket, KeyRound, BookOpen,
  AlarmClock, ShieldCheck, ListChecks, Clock,
} from "lucide-react"
import { useState, useEffect } from "react"
import { formatDate, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { AshokaChakra } from "@/components/layout/AshokaChakra"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { JobFollowBell } from "@/components/jobs/JobFollowBell"
import { RichTextView } from "@/components/shared/RichTextView"
import { containsHtml } from "@/lib/blog-prose"

type DocumentKind = "result" | "admit-card" | "answer-key" | "syllabus" | "admission"

interface DetailRow {
  label: string
  value: string | null
}

interface LinkRow {
  label: string
  value: string
  href: string
}

interface RelatedItem {
  href: string
  title: string
  department: string
  meta: string | null
}

interface DocumentDetailProps {
  kind: DocumentKind
  title: string
  department: string
  category?: string | null
  description?: string | null
  rows: DetailRow[]
  linkRows?: LinkRow[]
  list?: { label: string; items: string[] } | null
  downloadUrl?: string | null
  downloadLabel: string
  countdownDate?: string | null
  countdownLabel?: string
  bookmarkId?: { type: "result" | "admit-card"; id: string } | null
  bookmarkSyllabusId?: string | null
  application?: { type: "admission"; id: string } | null
  followJob?: { jobId: string } | null
  relatedTitle: string
  relatedItems: RelatedItem[]
}

const KIND_CONFIG: Record<DocumentKind, { badge: string; badgeClass: string; icon: typeof FileText; subtitle: string }> = {
  result: { badge: "Result", badgeClass: "bg-emerald-400 text-emerald-950", icon: FileCheck2, subtitle: "Examination Outcome Notification" },
  "admit-card": { badge: "Admit Card", badgeClass: "bg-sky-400 text-sky-950", icon: Ticket, subtitle: "Examination Entry Pass" },
  "answer-key": { badge: "Answer Key", badgeClass: "bg-violet-400 text-violet-950", icon: KeyRound, subtitle: "Answer Verification Document" },
  syllabus: { badge: "Syllabus", badgeClass: "bg-orange-400 text-orange-950", icon: BookOpen, subtitle: "Preparation Blueprint" },
  admission: { badge: "Admission", badgeClass: "bg-rose-400 text-rose-950", icon: GraduationCap, subtitle: "Admission Notice & Application" },
}

const iconFor = (label: string) => {
  if (/result date/i.test(label)) return CalendarCheck
  if (/exam date/i.test(label)) return CalendarDays
  if (/start date|begin/i.test(label)) return CalendarPlus
  if (/last date|clos/i.test(label)) return CalendarClock
  if (/fee/i.test(label)) return Wallet
  if (/department/i.test(label)) return Building2
  if (/category/i.test(label)) return Tag
  if (/job|exam/i.test(label)) return Briefcase
  if (/location|state|post/i.test(label)) return MapPin
  if (/college|institut/i.test(label)) return School
  if (/course/i.test(label)) return GraduationCap
  return FileText
}

export function DocumentDetail({
  kind,
  title,
  department,
  category,
  description,
  rows,
  linkRows = [],
  list,
  downloadUrl,
  downloadLabel,
  countdownDate,
  countdownLabel,
  bookmarkId,
  bookmarkSyllabusId,
  application,
  followJob,
  relatedTitle,
  relatedItems,
}: DocumentDetailProps) {
  const config = KIND_CONFIG[kind]
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} - ${shareUrl}`)}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title} ${shareUrl}`)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
    }
  }

  const countdownMs = countdownDate ? new Date(countdownDate).getTime() : null
  const diff = countdownMs !== null ? countdownMs - now : null
  const daysLeft = diff !== null ? Math.floor(diff / 86400000) : null
  const hoursLeft = diff !== null ? Math.floor((diff % 86400000) / 3600000) : null
  const minsLeft = diff !== null ? Math.floor((diff % 3600000) / 60000) : null
  const isUrgent = diff !== null && diff > 0 && diff <= 7 * 86400000
  const isCountdownActive = diff !== null && diff > 0

  const stats = rows.filter((r) => r.value).slice(0, 4)
  const filledRows = rows.filter((r) => r.value)

  const sections = [
    { id: "details", label: "Details", icon: ListChecks, show: filledRows.length > 0 || linkRows.length > 0 },
    { id: "subjects", label: list?.label || "Subjects", icon: BookOpen, show: Boolean(list && list.items.length > 0) },
    { id: "description", label: "About", icon: FileText, show: Boolean(description) },
  ].filter((s) => s.show)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="space-y-6 [scroll-behavior:smooth]">
      {/* ── Header / Hero — Tricolour ─────────────────── */}
      <header className="relative overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-r from-orange-50 via-white to-green-50 shadow-lg dark:border-gray-700 dark:from-[#231303] dark:via-gray-950 dark:to-[#071a0e]">
        {/* top tricolour strip with slow flow */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(to_right,#FF9933_0%,#FF9933_33.3%,#F8F8F8_33.3%,#F8F8F8_66.6%,#138808_66.6%,#138808_100%)]"
        >
          <div className="animate-flag-sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        </div>
        {/* light Ashoka Chakra watermark + flowing-air sheen */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 flex h-56 w-56 items-center justify-center">
          <AshokaChakra className="h-48 w-48 text-[#06038D]/10 dark:text-white/10" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-flag-sheen absolute inset-y-[-20%] left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
        </div>
        {/* bottom tricolour strip */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] bg-[linear-gradient(to_right,#FF9933_0%,#FF9933_33.3%,#F8F8F8_33.3%,#F8F8F8_66.6%,#138808_66.6%,#138808_100%)]"
        />

        <div className="relative p-6 pt-8 sm:p-8 sm:pt-9">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge className={cn("font-semibold", config.badgeClass)}>
              <config.icon className="mr-1 h-3 w-3" /> {config.badge}
            </Badge>
            {category && <Badge className="border border-gray-200 bg-white/80 text-gray-700 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">{category}</Badge>}
            {isUrgent && (
              <Badge className="bg-amber-400 font-bold text-amber-950 shadow-md ring-2 ring-amber-500/50">
                <AlarmClock className="mr-1 h-3.5 w-3.5" /> Closing Soon
              </Badge>
            )}
            {countdownMs !== null && !isCountdownActive && diff !== null && (
              <Badge className="bg-red-600 font-bold text-white shadow-md ring-2 ring-red-500/40">
                <Clock className="mr-1 h-3.5 w-3.5" /> Closed / Expired
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-[#1e3a5f] dark:text-gray-100">{department}</span>
            <span className="text-orange-500">•</span>
            <span className="text-gray-600 dark:text-gray-300">{config.subtitle}</span>
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {downloadUrl ? (
              <Button size="sm" className="bg-gradient-to-r from-[#FF9933] to-[#138808] font-semibold text-white shadow-sm hover:opacity-90" asChild>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-1.5 h-4 w-4" /> {downloadLabel}
                </a>
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="border-gray-300 bg-white/70 font-semibold text-gray-500" disabled>
                <FileText className="mr-1.5 h-4 w-4" /> {downloadLabel}
              </Button>
            )}
            {application && (
              <ApplicationTracker jobId={application.id} type="admission" variant="full" />
            )}
            {followJob && (
              <JobFollowBell jobId={followJob.jobId} />
            )}
            {bookmarkSyllabusId && (
              <BookmarkButton
                syllabusId={bookmarkSyllabusId}
                size="default"
                variant="outline"
                className="border-orange-300 bg-white/80 text-gray-700 hover:bg-orange-50 hover:text-orange-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
            )}
            {bookmarkId && (
              <BookmarkButton
                resultId={bookmarkId.type === "result" ? bookmarkId.id : undefined}
                admitCardId={bookmarkId.type === "admit-card" ? bookmarkId.id : undefined}
                size="default"
                variant="outline"
                className="border-orange-300 bg-white/80 text-gray-700 hover:bg-orange-50 hover:text-orange-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
            )}
            <Button variant="outline" size="icon" className="border-gray-300 bg-white/80 text-gray-600 hover:bg-orange-50 hover:text-orange-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300" onClick={() => window.print()} title="Print">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Live Countdown / Application Status — always clearly visible ── */}
      {countdownMs !== null && !(diff !== null && diff <= 0) && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border-2 border-l-8 p-4 shadow-md",
            isUrgent
              ? "border-red-300 border-l-red-600 bg-red-50 dark:border-red-800 dark:border-l-red-500 dark:bg-red-950/60"
              : "border-orange-300 border-l-[#FF9933] bg-gradient-to-r from-orange-50 via-white to-green-50 dark:border-gray-600 dark:from-[#231303] dark:via-gray-900 dark:to-[#071a0e]",
          )}
        >
          <span className={cn(
            "flex items-center gap-2 text-base font-bold",
            isUrgent ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white",
          )}>
            <AlarmClock className="h-6 w-6" /> Time Left — {countdownLabel}
          </span>
          <div className="flex items-center gap-2">
            {[
              { value: daysLeft, unit: "Days" },
              { value: hoursLeft, unit: "Hrs" },
              { value: minsLeft, unit: "Min" },
            ].map((t) => (
              <div key={t.unit} className={cn(
                "rounded-lg px-3.5 py-2 text-center shadow-sm ring-1",
                isUrgent ? "bg-white ring-red-300 dark:bg-red-900 dark:ring-red-700" : "bg-white ring-orange-200 dark:bg-gray-800 dark:ring-gray-600",
              )}>
                <div className={cn("text-xl font-extrabold leading-none tabular-nums", isUrgent ? "text-red-700 dark:text-red-300" : "text-green-800 dark:text-green-300")}>
                  {t.value !== null ? t.value : 0}
                </div>
                <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t.unit}</div>
              </div>
            ))}
          </div>
          <p className="ml-auto text-sm font-medium text-gray-700 dark:text-gray-200">
            {countdownLabel}: <span className="font-bold">{formatDate(countdownDate!)}</span>
          </p>
        </div>
      )}

      {/* ── Quick Stats ───────────────────────────────── */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => {
            const Icon = iconFor(s.label)
            const isUrgentStat = /last date|clos/i.test(s.label) && isUrgent
            return (
              <div key={s.label} className={cn(
                "group rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5",
                isUrgentStat
                  ? "border-red-200 bg-red-50 hover:shadow-md hover:shadow-red-100 dark:border-red-900 dark:bg-red-950/40 dark:hover:shadow-none"
                  : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-md hover:shadow-orange-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-orange-700 dark:hover:shadow-none",
              )}>
                <span className={cn(
                  "mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  isUrgentStat
                    ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                    : "bg-orange-50 text-orange-600 group-hover:bg-gradient-to-r group-hover:from-[#FF9933] group-hover:to-[#138808] group-hover:text-white dark:bg-orange-950 dark:text-orange-300",
                )}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className={cn(
                  "mb-0.5 text-[11px] font-medium uppercase tracking-wide",
                  isUrgentStat ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400",
                )}>
                  {s.label}
                </div>
                <div className={cn(
                  "text-sm font-bold leading-snug",
                  isUrgentStat ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-gray-100",
                )}>
                  {s.value}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Quick Navigation ──────────────────────────── */}
      {sections.length > 1 && (
        <nav className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-orange-700 dark:hover:bg-orange-950 dark:hover:text-orange-300"
            >
              <s.icon className="h-3.5 w-3.5" /> {s.label}
            </button>
          ))}
        </nav>
      )}

      {/* ── Share ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-500">Share this {config.badge.toLowerCase()}:</span>
        <Button variant="outline" size="sm" onClick={copyLink}>
          {copied ? <Check className="mr-1 h-4 w-4 text-green-500" /> : <Copy className="mr-1 h-4 w-4" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
          <a href={twitterUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
            <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        </Button>
      </div>

      {/* ── Details Table ─────────────────────────────── */}
      {(filledRows.length > 0 || linkRows.length > 0) && (
        <section id="details" className="scroll-mt-24">
          <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListChecks className="h-5 w-5 text-orange-600" /> {config.badge} Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {filledRows.map((item, i) => {
                    const Icon = iconFor(item.label)
                    return (
                      <TableRow key={item.label} className={cn(i % 2 === 1 && "bg-gray-50/70 dark:bg-gray-800/40")}>
                        <TableCell className="w-44 sm:w-56 font-medium text-gray-700 dark:text-gray-300">
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4 shrink-0 text-orange-500" /> {item.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {containsHtml(item.value) ? (
                            <RichTextView html={item.value} />
                          ) : (
                            <span className="whitespace-pre-line">{item.value}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {linkRows.map((item) => (
                    <TableRow key={item.label} className="bg-gray-50/70 dark:bg-gray-800/40">
                      <TableCell className="w-44 sm:w-56 font-medium text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 shrink-0 text-orange-500" /> {item.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={item.href}
                          className="inline-flex items-center gap-1 font-medium text-green-700 hover:text-orange-600 dark:text-green-400 dark:hover:text-orange-300"
                        >
                          {item.value} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Subjects / List ───────────────────────────── */}
      {list && list.items.length > 0 && (
        <section id="subjects" className="scroll-mt-24">
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-green-700" /> {list.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {list.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#FF9933] to-[#138808] text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Description ───────────────────────────────── */}
      {description && (
        <section id="description" className="scroll-mt-24">
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/60">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-orange-600" /> About this {config.badge}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextView html={description} />
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Download CTA ──────────────────────────────── */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:border-amber-900 dark:from-amber-950/40 dark:to-orange-950/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-amber-900 dark:text-amber-300">
              <FileText className="h-5 w-5 text-amber-600" /> {downloadLabel}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Get the official PDF from the latest notification. Click the button to open the file in a new tab.
            </p>
          </div>
          {downloadUrl ? (
            <Button size="lg" className="bg-gradient-to-r from-[#FF9933] to-[#138808] font-semibold text-white shadow-sm hover:opacity-90" asChild>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-2 h-5 w-5" /> {downloadLabel}
              </a>
            </Button>
          ) : (
            <Button size="lg" disabled className="bg-amber-100 font-semibold text-amber-700">
              <FileText className="mr-2 h-5 w-5" /> Coming Soon
            </Button>
          )}
        </div>
      </div>

      {/* ── Trust / Verify Note ───────────────────────── */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <p className="font-semibold text-amber-800 dark:text-amber-300">Important Note</p>
          <p className="mt-0.5">
            This is not a government website. Always verify all details (dates, fee, eligibility) from the{" "}
            <span className="font-medium text-amber-700 dark:text-amber-400">official notification</span> on the
            department's website before taking any action. We only aggregate publicly available information.
          </p>
        </div>
      </div>

      {/* ── Related ───────────────────────────────────── */}
      {relatedItems.length > 0 && (
        <section className="scroll-mt-24">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">{relatedTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {relatedItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-orange-700 dark:hover:shadow-none"
              >
                <Badge variant="secondary" className="mb-2 text-xs">{item.department}</Badge>
                <h3 className="text-sm font-semibold leading-snug text-gray-900 group-hover:text-orange-700 dark:text-gray-100 dark:group-hover:text-orange-300">
                  {item.title}
                </h3>
                {item.meta && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{item.meta}</p>}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Sticky Mobile Bar ─────────────────────────── */}
      <div className="sticky bottom-0 z-40 -mx-4 mt-4 border-t bg-white/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
            <p className={cn(
              "flex items-center gap-1.5 text-sm font-bold",
              isUrgent ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400",
            )}>
              {isUrgent ? <AlarmClock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              {isCountdownActive && daysLeft !== null
                ? isUrgent
                  ? `${daysLeft} days left`
                  : `${daysLeft} days remaining`
                : downloadUrl
                  ? "Available for download"
                  : "Awaiting official release"}
            </p>
          </div>
          {downloadUrl ? (
            <Button className="bg-gradient-to-r from-[#FF9933] to-[#138808] font-semibold text-white shadow-sm hover:opacity-90" asChild>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-1.5 h-4 w-4" /> {downloadLabel}
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
