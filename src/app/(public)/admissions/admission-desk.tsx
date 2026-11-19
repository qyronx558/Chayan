"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { FileDown } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { cleanTitle } from "@/lib/card-helpers"
import { stripHtmlToText } from "@/lib/blog-prose"
import { handFont, typeFont } from "@/components/home/fonts"
import { daysLeft } from "@/components/home/HomeJobRow"
import { PinnedChecklist } from "@/components/desk/DeskKit"

/*
 * The admissions page, built from the admission season itself: the cloth
 * "ADMISSIONS OPEN" banner tied outside every college, the list of documents
 * every parent reads out the night before, and the admission form with its
 * "affix photograph" box and a counterfoil to cut along the dotted line.
 */

/* ───────────────────────── banner ───────────────────────── */

export function AdmissionBanner({ total }: { total: number }) {
  return (
    <div className="relative pt-2">
      {/* two bamboo poles and the ropes tying the cloth banner */}
      <div className="relative mx-auto max-w-4xl px-6 sm:px-12">
        <span
          className="absolute bottom-[-2.5rem] left-1 top-0 w-2.5 rounded-full sm:left-4"
          style={{ background: "repeating-linear-gradient(180deg, oklch(70% 0.09 85) 0 46px, oklch(58% 0.08 75) 46px 49px)" }}
          aria-hidden
        />
        <span
          className="absolute bottom-[-2.5rem] right-1 top-0 w-2.5 rounded-full sm:right-4"
          style={{ background: "repeating-linear-gradient(180deg, oklch(70% 0.09 85) 0 52px, oklch(58% 0.08 75) 52px 55px)" }}
          aria-hidden
        />
        <svg className="pointer-events-none absolute inset-x-0 top-1 h-8 w-full" viewBox="0 0 400 30" preserveAspectRatio="none" aria-hidden>
          <path d="M6 4 L 30 16 M 394 4 L 370 16 M6 26 L 30 22 M394 26 L 370 22" stroke="oklch(45% 0.04 60)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* the cloth, sagging a little and moving in the breeze */}
        <div className="hs-sway relative mt-3" style={{ animationDuration: "7s" }}>
          <div
            className="relative px-5 py-5 text-center sm:px-10 sm:py-7"
            style={{
              background: "linear-gradient(180deg, oklch(86% 0.15 88), oklch(80% 0.16 80))",
              clipPath: "polygon(0 0, 50% 6%, 100% 0, 100% 94%, 50% 100%, 0 94%)",
              boxShadow: "0 18px 30px -18px rgb(80 40 0 / .5)",
            }}
          >
            {/* eyelets */}
            {["left-2 top-2", "right-2 top-2", "left-2 bottom-3", "right-2 bottom-3"].map((pos) => (
              <span key={pos} className={cn("absolute h-2.5 w-2.5 rounded-full border-2 border-[oklch(55%_0.03_70)] bg-[oklch(92%_0.02_85)]", pos)} aria-hidden />
            ))}
            <p className="text-[11px] font-bold text-[oklch(35%_0.12_30)] sm:text-xs">SESSION 2026–27 · ALL INDIA</p>
            <h1
              className="mt-1 font-display text-[2.4rem] font-black leading-none text-[oklch(45%_0.19_28)] sm:text-[4.2rem]"
              style={{ textShadow: "2px 2px 0 oklch(96% 0.05 90)" }}
            >
              ADMISSIONS OPEN
            </h1>
            <p className="mt-2 text-[13px] font-semibold text-[oklch(30%_0.06_40)] sm:text-[15px]">
              Universities · Colleges · Entrance tests · Counselling
            </p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-14 max-w-2xl text-center">
        <p className="text-[16px] leading-relaxed text-muted-foreground">
          The season of forms, photocopies and counselling queues. Every admission notice is kept here with its dates
          written out, so you never stand in the wrong line, or miss the right one.
        </p>
        <p className={cn(handFont.className, "mt-2 text-[1.2rem] text-[var(--color-brick)]")}>
          {total > 0 ? `${total.toLocaleString("en-IN")} forms on the counter right now` : "counter opening shortly"}
        </p>
      </div>
    </div>
  )
}

/* ───────────────────────── documents checklist ───────────────────────── */

const DOCS = [
  { id: "10th", label: "10th marksheet & certificate" },
  { id: "12th", label: "12th marksheet" },
  { id: "grad", label: "Graduation marksheets (for PG)" },
  { id: "tc", label: "Transfer certificate (TC)" },
  { id: "migration", label: "Migration certificate" },
  { id: "caste", label: "Caste / EWS certificate, if any" },
  { id: "domicile", label: "Domicile certificate" },
  { id: "photo", label: "Passport photos, white background" },
  { id: "sign", label: "Scanned signature" },
  { id: "aadhaar", label: "Aadhaar card" },
]

export function DocumentChecklist() {
  return (
    <PinnedChecklist
      storageKey="ChayanJobs_admission_docs_v1"
      title="Before you fill any form, keep these ready:"
      items={DOCS}
      doneText="all set. you're ready!"
    />
  )
}

/* ───────────────────────── the admission form card ───────────────────────── */

export interface AdmissionFormData {
  id: string
  title: string
  slug: string
  description: string | null
  startDate: string | null
  lastDate: string | null
  applicationFee: string | null
  pdfUrl: string | null
  department: { id: string; name: string; slug: string }
}

type Stage = { label: string; tone: string }

function stageOf(a: AdmissionFormData): Stage {
  const toEnd = daysLeft(a.lastDate)
  const toStart = daysLeft(a.startDate)
  if (toStart !== null && toStart > 0) return { label: "OPENS SOON", tone: "oklch(48% 0.12 250)" }
  if (toEnd === null) return { label: "SEE NOTICE", tone: "oklch(45% 0.03 60)" }
  if (toEnd < 0) return { label: "CLOSED", tone: "oklch(50% 0.02 60)" }
  if (toEnd <= 7) return { label: "CLOSING SOON", tone: "var(--color-brick)" }
  return { label: "OPEN", tone: "oklch(45% 0.1 160)" }
}

const initials = (name: string) =>
  name
    .replace(/\(.*?\)/g, " ")
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w) && w.length > 2)
    .slice(0, 3)
    .map((w) => w[0])
    .join("") || "—"

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-end gap-2">
      <span className={cn(typeFont.className, "shrink-0 text-[11px] text-muted-foreground")}>{label}</span>
      <span className="min-w-0 flex-1 truncate border-b border-dotted border-[var(--hs-border-strong)] pb-px">{children}</span>
    </div>
  )
}

export function AdmissionFormCard({ item, index, track, share }: { item: AdmissionFormData; index: number; track: ReactNode; share: ReactNode }) {
  const stage = stageOf(item)
  const left = daysLeft(item.lastDate)
  const urgent = left !== null && left >= 0 && left <= 7
  const excerpt = stripHtmlToText(item.description).replace(/\s+/g, " ").trim()
  const title = cleanTitle(item.title)
  const href = `/admission/${item.slug}`

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] transition-transform duration-300 hover:-translate-y-1",
        index % 3 === 1 ? "rotate-[0.5deg]" : index % 3 === 2 ? "-rotate-[0.4deg]" : ""
      )}
      style={{ boxShadow: "0 1px 2px rgb(60 40 10 / .08), 0 16px 28px -22px rgb(60 40 10 / .55)" }}
    >
      <div className="flex-1 px-5 pb-4 pt-4">
        {/* form header, as printed */}
        <div className={cn(typeFont.className, "flex items-start justify-between gap-3 border-b-2 border-double border-[var(--hs-border-strong)] pb-2 text-[10.5px] text-muted-foreground")}>
          <span className="line-clamp-2 font-bold uppercase text-foreground/80">{item.department.name}</span>
          <span className="shrink-0">FORM No. {String(index + 1).padStart(4, "0")}</span>
        </div>

        <div className="mt-3 flex gap-4">
          <div className="min-w-0 flex-1">
            <p className={cn(typeFont.className, "text-[10.5px] text-muted-foreground")}>APPLICATION FOR ADMISSION TO</p>
            <h3 className="mt-1 line-clamp-3 text-[16px] font-bold leading-snug text-foreground">
              <Link href={href} className="decoration-[var(--hs-trust)] decoration-2 underline-offset-[3px] after:absolute after:inset-0 after:content-[''] hover:underline">
                {title}
              </Link>
            </h3>
          </div>
          {/* "affix recent passport size photograph" */}
          <div className="relative flex h-[84px] w-[68px] shrink-0 flex-col items-center justify-center border border-dashed border-[var(--hs-border-strong)] text-center">
            <span className={cn(handFont.className, "text-[1.3rem] leading-none text-foreground/70")}>{initials(item.department.name)}</span>
            <span className={cn(typeFont.className, "mt-1 px-1 text-[7.5px] leading-tight text-muted-foreground")}>AFFIX RECENT PHOTO</span>
          </div>
        </div>

        {/* the fields, filled in by hand */}
        <div className="relative mt-4 space-y-2.5 pr-2">
          {/* status rubber stamp, pressed over the fields */}
          <span
            className={cn(typeFont.className, "pointer-events-none absolute -top-1 right-0 z-10 -rotate-[12deg] rounded-[4px] border-[2.5px] bg-[var(--hs-paper-slip)]/60 px-2 py-0.5 text-[12.5px] font-bold opacity-85")}
            style={{ color: stage.tone, borderColor: stage.tone }}
            aria-label={`Status: ${stage.label.toLowerCase()}`}
          >
            {stage.label}
          </span>
          <Field label="Form opens">
            <span className={cn(handFont.className, "text-[1.05rem] text-foreground")}>{item.startDate ? formatDate(item.startDate, "d MMM yyyy") : "see notice"}</span>
          </Field>
          <Field label="Last date">
            <span className={cn(handFont.className, "relative inline-block text-[1.05rem]", urgent ? "text-[var(--color-brick)]" : "text-foreground")}>
              {item.lastDate ? formatDate(item.lastDate, "d MMM yyyy") : "see notice"}
              {urgent && (
                <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="pointer-events-none absolute -inset-x-2 -inset-y-1 h-[calc(100%+0.5rem)] w-[calc(100%+1rem)] overflow-visible" aria-hidden>
                  <path d="M54 3 C 82 2, 98 9, 96 18 C 94 28, 70 32, 48 31 C 22 31, 3 26, 3 17 C 3 8, 22 3, 44 3 C 56 3, 64 4, 70 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </svg>
              )}
            </span>
            {left !== null && left >= 0 && (
              <span className={cn(handFont.className, "ml-3 text-[0.95rem] text-muted-foreground")}>{left === 0 ? "(today!)" : `(${left} days left)`}</span>
            )}
          </Field>
          <Field label="Fee">
            <span className={cn(handFont.className, "text-[1.05rem] text-foreground")}>{stripHtmlToText(item.applicationFee).replace(/\s+/g, " ").trim() || "as per notice"}</span>
          </Field>
        </div>

        {excerpt && <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{excerpt}</p>}
      </div>

      {/* counterfoil: cut along the dotted line */}
      <div className="relative z-10 border-t-2 border-dashed border-[var(--hs-border-strong)] px-5 py-3">
        <span className="absolute -top-[11px] left-4 bg-[var(--hs-paper-slip)] px-1 text-[13px] leading-none text-muted-foreground" aria-hidden>
          ✂
        </span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href={href} className={cn(handFont.className, "text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4")}>
            read the full notice →
          </Link>
          {item.pdfUrl && (
            <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground">
              <FileDown className="h-3.5 w-3.5" />
              Prospectus PDF
            </a>
          )}
          <span className="ml-auto flex items-center gap-1">
            {track}
            {share}
          </span>
        </div>
      </div>
    </article>
  )
}
