"use client"

import { useId, useMemo, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react"
import Link from "next/link"
import type { UseFormReturn } from "react-hook-form"
import { ArrowRight, Minus, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { handFont, sanskritFont, typeFont } from "@/components/home/fonts"
import { PenLoop, paperShadow } from "@/components/desk/DeskKit"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ageOn,
  CAREER_INTERESTS,
  CITY_SUGGESTIONS,
  interestRank,
  JOB_TYPES,
  lakhsFromRupees,
  PROFILE_CATEGORIES,
  PROFILE_QUALIFICATIONS,
  rupeesFromLakhs,
  SKILL_SUGGESTIONS,
  WORK_MODES,
  type CareerInterest,
} from "@/lib/profile"
import { INDIAN_STATES_28 } from "@/lib/states"
import type { ProfileUpdateInput } from "@/lib/profile-schemas"

type Form = UseFormReturn<ProfileUpdateInput>

const AIRMAIL_EDGE =
  "repeating-linear-gradient(135deg, var(--hs-pvt) 0 10px, transparent 10px 15px, var(--hs-gov) 15px 25px, transparent 25px 30px)"

function toggleIn<T extends string>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

export function CareerPaths({ form }: { form: Form }) {
  const gov = form.watch("govInterest") ?? null
  const priv = form.watch("privateInterest") ?? null
  const privateFirst = interestRank(priv) > interestRank(gov)

  const pages = [<GovPage key="gov" form={form} />, <PrivatePage key="pvt" form={form} />]
  if (privateFirst) pages.reverse()

  return (
    <section aria-labelledby="paths-title" className="relative">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <h2 id="paths-title" className="text-2xl text-foreground">
          Two roads, <span className={cn(handFont.className, "text-[var(--color-brick)]")}>your pace</span>
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Walk one, walk both, or switch later. Nothing here is locked in, and the road you lean on comes first.
        </p>
      </div>

      <div className="relative grid gap-5 lg:grid-cols-2 lg:gap-0" style={{ filter: "drop-shadow(0 18px 22px rgb(60 40 10 / .12))" }}>
        {pages}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-10 -translate-x-1/2 lg:block"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgb(40 25 5 / .07) 40%, rgb(40 25 5 / .16) 50%, rgb(40 25 5 / .07) 60%, transparent)",
          }}
        />
        <span aria-hidden className="pointer-events-none absolute inset-y-6 left-1/2 hidden border-l border-dashed border-[var(--hs-kraft-edge)] lg:block" />
      </div>
    </section>
  )
}

function PathPage({
  id,
  tone,
  kicker,
  devanagari,
  title,
  line,
  interest,
  onInterest,
  footerHref,
  footerLabel,
  decoration,
  children,
}: {
  id: string
  tone: string
  kicker: string
  devanagari: string
  title: string
  line: string
  interest: CareerInterest | null
  onInterest: (v: CareerInterest) => void
  footerHref: string
  footerLabel: string
  decoration: ReactNode
  children: ReactNode
}) {
  const paused = interest === "paused"
  return (
    <article
      id={id}
      tabIndex={-1}
      className="relative flex scroll-mt-24 flex-col overflow-hidden rounded-[6px] bg-[var(--hs-paper-slip)] px-5 pb-5 pt-7 outline-none sm:px-7 lg:rounded-none lg:first-of-type:rounded-l-[8px] lg:[&:nth-of-type(2)]:rounded-r-[8px]"
      style={{ ["--tone" as string]: tone, boxShadow: paperShadow } as CSSProperties}
    >
      {decoration}
      <header className="relative">
        <p className={cn(typeFont.className, "text-[11px] font-bold tracking-[0.18em] text-[var(--tone)]")}>{kicker}</p>
        <p className={cn(sanskritFont.className, "mt-0.5 text-sm text-muted-foreground")} lang="hi">
          {devanagari}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{line}</p>
        <InterestPicker value={interest} onChange={onInterest} label={`How keen are you on the ${title.toLowerCase()}?`} />
      </header>

      <div className={cn("relative mt-5 flex-1 space-y-6 transition-opacity", paused && "opacity-60")}>{children}</div>

      <footer className="relative mt-6 flex items-center justify-between gap-3 border-t border-dashed border-[var(--hs-border-strong)] pt-4">
        <span className={cn(handFont.className, "text-sm text-muted-foreground")}>
          {paused ? "Resting. Come back whenever." : "Saved with the bar below."}
        </span>
        <Link
          href={footerHref}
          prefetch={false}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--tone)] underline-offset-4 hover:underline"
        >
          {footerLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </footer>
    </article>
  )
}

function InterestPicker({ value, onChange, label }: { value: CareerInterest | null; onChange: (v: CareerInterest) => void; label: string }) {
  return (
    <div className="mt-4">
      <p className={cn(handFont.className, "text-[15px] text-foreground/80")}>How keen are you?</p>
      <div role="radiogroup" aria-label={label} className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
        {CAREER_INTERESTS.map((o) => {
          const on = value === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={cn(
                handFont.className,
                "relative px-2 py-1 text-[17px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tone)]",
                on ? "text-[var(--tone)]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
              {on ? <PenLoop className="-left-1.5 -top-1 h-[calc(100%+8px)] w-[calc(100%+12px)]" color="var(--tone)" /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Step({ n, title, hint, htmlFor, children }: { n: number; title: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  const Title = htmlFor ? "label" : "p"
  return (
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2">
      <span className={cn(handFont.className, "pt-0.5 text-xl leading-none text-[var(--tone)]")} aria-hidden>
        {n}.
      </span>
      <div className="min-w-0">
        <Title {...(htmlFor ? { htmlFor } : {})} className="block text-[15px] font-semibold text-foreground">
          {title}
        </Title>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        <div className="mt-2.5">{children}</div>
      </div>
    </div>
  )
}

function Chips<T extends string>({
  options,
  value,
  onToggle,
  label,
}: {
  options: readonly { value: T; label: string }[]
  value: T[]
  onToggle: (v: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o.value)}
            className={cn(
              "rounded-[4px] border px-2.5 py-1 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tone)]",
              on
                ? "border-[var(--tone)] bg-[var(--tone)] font-medium text-[var(--hs-paper-slip)]"
                : "border-[var(--hs-border-strong)] text-muted-foreground hover:border-[var(--tone)] hover:text-[var(--tone)]"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function TagInput({
  id,
  values,
  onChange,
  suggestions,
  placeholder,
  max,
}: {
  id: string
  values: string[]
  onChange: (next: string[]) => void
  suggestions: readonly string[]
  placeholder: string
  max: number
}) {
  const [draft, setDraft] = useState("")
  const lower = useMemo(() => new Set(values.map((v) => v.toLowerCase())), [values])
  const full = values.length >= max

  function add(raw: string) {
    const v = raw.trim().replace(/\s+/g, " ")
    if (!v || lower.has(v.toLowerCase()) || full) return
    onChange([...values, v.slice(0, 60)])
    setDraft("")
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      add(draft)
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1))
    }
  }

  const open = suggestions.filter((s) => !lower.has(s.toLowerCase())).slice(0, 8)

  return (
    <div>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[4px] border border-[var(--hs-border-strong)] bg-background/60 px-2 py-1.5 focus-within:border-[var(--tone)]">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-[3px] bg-[color-mix(in_oklch,var(--tone)_14%,transparent)] py-0.5 pl-2 pr-1 text-[13px] text-foreground">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="rounded-[2px] p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--tone)]"
              aria-label={`Remove ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          disabled={full}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => add(draft)}
          placeholder={full ? `That's ${max}, plenty` : values.length ? "Add another" : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground/70"
        />
      </div>
      {open.length && !full ? (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {open.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className={cn(handFont.className, "text-[15px] text-muted-foreground hover:text-[var(--tone)] focus-visible:outline-none focus-visible:underline")}
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function GovPage({ form }: { form: Form }) {
  const uid = useId()
  const { watch, setValue, register } = form
  const set = { shouldDirty: true, shouldValidate: true } as const
  const qual = watch("qualification") ?? ""
  const dob = watch("dateOfBirth") ?? ""
  const states = watch("preferredStates") ?? []
  const cats = watch("interestedCategories") ?? []
  const [allStates, setAllStates] = useState(false)

  const shownStates = allStates ? INDIAN_STATES_28 : [...new Set([...states, ...INDIAN_STATES_28.slice(0, 10)])]

  return (
    <PathPage
      id="path-gov"
      tone="var(--hs-gov)"
      kicker="SARKARI NAUKRI"
      devanagari="सरकारी नौकरी"
      title="Government road"
      line="Notifications, exam dates, a steady post. We'll keep the paperwork straight."
      interest={watch("govInterest") ?? null}
      onInterest={(v) => setValue("govInterest", v, set)}
      footerHref="/jobs"
      footerLabel="Government jobs"
      decoration={<RedTape />}
    >
      <Step n={1} title="What you've studied" hint="Your highest pass. Eligibility starts here." htmlFor={`${uid}-q`}>
        <Select value={qual} onValueChange={(v) => setValue("qualification", v, set)}>
          <SelectTrigger id={`${uid}-q`} className="bg-background/60">
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
          <SelectContent>
            {PROFILE_QUALIFICATIONS.map((q) => (
              <SelectItem key={q} value={q}>
                {q}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Step>

      <Step n={2} title="When you were born" hint="We do the age maths on every notice so you don't have to." htmlFor={`${uid}-dob`}>
        <Input id={`${uid}-dob`} type="date" className="max-w-[13rem] bg-background/60" {...register("dateOfBirth")} />
        <AgeNote dob={dob} />
      </Step>

      <Step n={3} title="Departments that call to you">
        <Chips
          label="Departments"
          options={PROFILE_CATEGORIES.map((c) => ({ value: c, label: c }))}
          value={cats}
          onToggle={(v) => setValue("interestedCategories", toggleIn(cats, v), set)}
        />
      </Step>

      <Step n={4} title="States you'd happily serve in" hint="Leave empty if anywhere in India is fine.">
        <Chips
          label="Preferred states"
          options={shownStates.map((s) => ({ value: s, label: s }))}
          value={states}
          onToggle={(v) => setValue("preferredStates", toggleIn(states, v), set)}
        />
        <button
          type="button"
          onClick={() => setAllStates((v) => !v)}
          className={cn(handFont.className, "mt-2 text-[15px] text-[var(--tone)] hover:underline focus-visible:outline-none focus-visible:underline")}
        >
          {allStates ? "show fewer" : `show all ${INDIAN_STATES_28.length} states`}
        </button>
      </Step>
    </PathPage>
  )
}

function AgeNote({ dob }: { dob: string }) {
  const now = new Date()
  const today = ageOn(dob, now)
  const cutoff = new Date(now.getFullYear() + 1, 0, 1)
  const atCutoff = ageOn(dob, cutoff)
  return (
    <div className="relative mt-3 -rotate-[0.4deg] rounded-[3px] border border-[var(--hs-kraft-edge)] bg-[var(--hs-kraft)] px-3.5 py-3 text-foreground">
      {today && atCutoff ? (
        <>
          <p className={cn(handFont.className, "text-[16px] leading-snug")}>
            You&apos;re {today.years} years{today.months ? `, ${today.months} month${today.months > 1 ? "s" : ""}` : ""} old today. On 1 Jan {cutoff.getFullYear()}, a common cut-off date,
            you&apos;ll be {atCutoff.years}.
          </p>
          <p className={cn(typeFont.className, "mt-2 text-[11.5px] leading-relaxed text-muted-foreground")}>
            Most central posts: 18 to 27–32 for general. Extra years: OBC +3, SC/ST +5, PwBD +10. The notification always has the final word.
          </p>
        </>
      ) : (
        <p className={cn(handFont.className, "text-[16px] leading-snug text-muted-foreground")}>Add your birthday and this note will tell you where you stand on age limits.</p>
      )}
    </div>
  )
}

function RedTape() {
  return (
    <span aria-hidden className="pointer-events-none absolute -right-9 top-5 rotate-45">
      <span className="block h-3.5 w-36" style={{ background: "var(--hs-gov)", boxShadow: "0 2px 3px rgb(0 0 0 / .18)" }} />
    </span>
  )
}

function PrivatePage({ form }: { form: Form }) {
  const uid = useId()
  const { watch, setValue, register, formState } = form
  const set = { shouldDirty: true, shouldValidate: true } as const
  const exp = watch("experienceYears") ?? null
  const skills = watch("skills") ?? []
  const cities = watch("preferredCities") ?? []
  const modes = watch("workModes") ?? []
  const types = watch("jobTypes") ?? []
  const salary = watch("expectedSalary") ?? null
  const [salaryDraft, setSalaryDraft] = useState(() => lakhsFromRupees(salary))
  const headlineError = formState.errors.headline?.message
  const salaryShown = rupeesFromLakhs(salaryDraft) === salary || (salaryDraft === "" && salary === null) ? salaryDraft : lakhsFromRupees(salary)

  return (
    <PathPage
      id="path-private"
      tone="var(--hs-pvt)"
      kicker="PRIVATE NAUKRI"
      devanagari="प्राइवेट नौकरी"
      title="Company road"
      line="Offers, interviews, room to grow and move. Tell recruiters' jobs what you bring."
      interest={watch("privateInterest") ?? null}
      onInterest={(v) => setValue("privateInterest", v, set)}
      footerHref="/private-jobs"
      footerLabel="Company jobs"
      decoration={<span aria-hidden className="absolute inset-x-0 top-0 h-[6px]" style={{ background: AIRMAIL_EDGE }} />}
    >
      <Step n={1} title="Where you stand today" hint="One line, in your words. Experience counts from your first paid job." htmlFor={`${uid}-h`}>
        <Input
          id={`${uid}-h`}
          placeholder="e.g. B.Com grad, good with numbers and people"
          className="bg-background/60"
          aria-invalid={!!headlineError}
          {...register("headline")}
        />
        {headlineError ? <p className="mt-1 text-xs text-[var(--color-brick)]">{headlineError}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={exp === 0}
            onClick={() => setValue("experienceYears", exp === 0 ? null : 0, set)}
            className={cn(
              "rounded-[4px] border px-2.5 py-1 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tone)]",
              exp === 0
                ? "border-[var(--tone)] bg-[var(--tone)] font-medium text-[var(--hs-paper-slip)]"
                : "border-[var(--hs-border-strong)] text-muted-foreground hover:border-[var(--tone)] hover:text-[var(--tone)]"
            )}
          >
            Fresher
          </button>
          <span className={cn(handFont.className, "text-[15px] text-muted-foreground")}>or</span>
          <div className="inline-flex items-center rounded-[4px] border border-[var(--hs-border-strong)]" role="group" aria-label="Years of experience">
            <button
              type="button"
              onClick={() => setValue("experienceYears", exp && exp > 1 ? exp - 1 : exp === 1 ? 0 : null, set)}
              disabled={exp === null}
              className="p-1.5 text-muted-foreground hover:text-[var(--tone)] disabled:opacity-40"
              aria-label="One year less"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[5.5rem] text-center text-[13px] tabular-nums text-foreground" aria-live="polite">
              {exp === null ? "years?" : exp === 0 ? "0 years" : `${exp} year${exp > 1 ? "s" : ""}`}
            </span>
            <button
              type="button"
              onClick={() => setValue("experienceYears", Math.min(50, (exp ?? 0) + 1), set)}
              className="p-1.5 text-muted-foreground hover:text-[var(--tone)]"
              aria-label="One year more"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Step>

      <Step n={2} title="What you're good at" hint="Type and press Enter. Tools, languages, anything you'd put on a CV." htmlFor={`${uid}-s`}>
        <TagInput
          id={`${uid}-s`}
          values={skills}
          onChange={(next) => setValue("skills", next, set)}
          suggestions={SKILL_SUGGESTIONS}
          placeholder="Excel, Tally, Python…"
          max={20}
        />
      </Step>

      <Step n={3} title="Where and how you'd work" htmlFor={`${uid}-c`}>
        <TagInput
          id={`${uid}-c`}
          values={cities}
          onChange={(next) => setValue("preferredCities", next, set)}
          suggestions={CITY_SUGGESTIONS}
          placeholder="Any city in the world"
          max={10}
        />
        <div className="mt-3">
          <Chips label="Work mode" options={WORK_MODES} value={modes} onToggle={(v) => setValue("workModes", toggleIn(modes, v), set)} />
        </div>
      </Step>

      <Step n={4} title="The kind of job, and the pay" hint="Pay stays private. It only sorts what we show you." htmlFor={`${uid}-pay`}>
        <Chips label="Job type" options={JOB_TYPES} value={types} onToggle={(v) => setValue("jobTypes", toggleIn(types, v), set)} />
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span>₹</span>
          <Input
            id={`${uid}-pay`}
            inputMode="decimal"
            value={salaryShown}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d.]/g, "")
              setSalaryDraft(v)
              setValue("expectedSalary", v ? rupeesFromLakhs(v) : null, set)
            }}
            placeholder="4.5"
            className="w-20 bg-background/60 text-center tabular-nums"
          />
          <span>lakh a year, or more</span>
        </div>
      </Step>
    </PathPage>
  )
}
