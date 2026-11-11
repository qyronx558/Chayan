import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/* Building blocks for Help Centre articles. All server components. */

export function DocSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="docs-section">
      <h2 id={id} className="group scroll-mt-28 border-b border-rule pb-2 text-[1.6rem] text-foreground sm:text-[1.85rem]">
        {title}
        <a
          href={`#${id}`}
          aria-label={`Link to section: ${title}`}
          className="ml-2 align-middle text-base font-normal text-rule no-underline opacity-0 transition-opacity hover:text-brick group-hover:opacity-100 focus-visible:opacity-100"
        >
          #
        </a>
      </h2>
      <div className="docs-body mt-5">{children}</div>
    </section>
  )
}

export function DocSub({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 mt-7 text-[1.2rem] text-foreground">{children}</h3>
}

type CalloutTone = "note" | "tip" | "important" | "warning"

const calloutLabel: Record<CalloutTone, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Be careful",
}

export function Callout({ tone = "note", title, children }: { tone?: CalloutTone; title?: string; children: ReactNode }) {
  const signal = tone === "important" || tone === "warning"
  return (
    <aside
      role="note"
      // Inline colour: the global `* { border-color }` rule outranks layered utilities.
      style={{ borderLeftColor: signal ? "var(--color-brick)" : "var(--color-rule-2)" }}
      className="my-6 border border-l-[3px] bg-paper-2 px-5 py-4"
    >
      <p className={cn("agate mb-1 text-[0.78rem]", signal ? "text-brick" : "text-muted-foreground")}>
        {calloutLabel[tone]}
        {title ? <span className="text-foreground">{` · ${title}`}</span> : null}
      </p>
      <div className="docs-callout text-[0.98rem] leading-relaxed text-foreground">{children}</div>
    </aside>
  )
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="docs-steps my-6 space-y-5">{children}</ol>
}

export function Step({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <li className="docs-step relative pl-12">
      <p className="font-display text-[1.08rem] font-bold leading-snug text-foreground">{title}</p>
      {children ? <div className="mt-1 text-[0.98rem] leading-relaxed text-ink-2">{children}</div> : null}
    </li>
  )
}

/** Shows a click path through the interface, e.g. Profile > Security > Two-factor. */
export function UiPath({ items }: { items: string[] }) {
  return (
    <span className="agate inline-flex flex-wrap items-center gap-1 border border-rule bg-paper-2 px-1.5 py-0.5 align-baseline text-[0.82rem] text-foreground">
      {items.map((item, i) => (
        <span key={item + i} className="inline-flex items-center gap-1">
          {i > 0 ? <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden /> : null}
          {item}
        </span>
      ))}
    </span>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="agate inline-block min-w-[1.6em] border border-rule-2 border-b-2 bg-paper px-1.5 py-px text-center text-[0.8rem] leading-normal text-foreground">
      {children}
    </kbd>
  )
}

export function InfoTable({ head, rows, caption }: { head: string[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div className="my-6 overflow-x-auto border-y-2 border-rule-2">
      <table className="w-full min-w-[32rem] border-collapse text-left text-[0.95rem]">
        {caption ? <caption className="agate py-2 text-left text-xs text-muted-foreground">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-rule-2">
            {head.map((h) => (
              <th key={h} scope="col" className="px-3 py-2.5 font-display text-[0.95rem] font-bold text-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-rule last:border-b-0 align-top">
              {row.map((cell, c) => (
                <td key={c} className={cn("px-3 py-2.5 leading-relaxed", c === 0 ? "font-semibold text-foreground" : "text-ink-2")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** A labelled diagram of a screen: numbered regions plus a key underneath. */
export function Anatomy({
  title,
  regions,
  layout,
}: {
  title: string
  /** Region number and the meaning shown in the key. */
  regions: { n: number; label: string; detail: string }[]
  /** Rows of region numbers, each row split into equal or weighted columns, e.g. [[1],[2,2,3]]. */
  layout: number[][]
}) {
  return (
    <figure className="my-8 border border-rule-2 bg-paper">
      <div className="flex items-center justify-between border-b border-rule-2 bg-paper-2 px-4 py-2">
        <figcaption className="agate text-xs text-foreground">{title}</figcaption>
        <span className="flex gap-1" aria-hidden>
          <span className="h-2 w-2 border border-rule-2" />
          <span className="h-2 w-2 border border-rule-2" />
          <span className="h-2 w-2 border border-rule-2" />
        </span>
      </div>
      <div className="space-y-2 p-3 sm:p-4" aria-hidden>
        {layout.map((row, r) => (
          <div key={r} className="flex gap-2">
            {groupRuns(row).map(({ n, span }, i) => (
              <div
                key={i}
                style={{ flexGrow: span }}
                className={cn(
                  "flex min-h-12 basis-0 items-center justify-center border border-dashed border-rule-2",
                  n === 0 ? "border-transparent" : "bg-paper-2",
                )}
              >
                {n > 0 ? (
                  <span className="agate flex h-6 w-6 items-center justify-center bg-ink text-xs text-paper">{n}</span>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
      <dl className="grid gap-x-6 gap-y-3 border-t border-rule px-4 py-4 sm:grid-cols-2">
        {regions.map((r) => (
          <div key={r.n} className="flex gap-3">
            <dt className="agate flex h-6 w-6 shrink-0 items-center justify-center bg-ink text-xs text-paper">{r.n}</dt>
            <dd className="text-[0.92rem] leading-snug text-ink-2">
              <span className="font-semibold text-foreground">{r.label}.</span> {r.detail}
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}

function groupRuns(row: number[]) {
  const runs: { n: number; span: number }[] = []
  for (const n of row) {
    const last = runs[runs.length - 1]
    if (last && last.n === n) last.span += 1
    else runs.push({ n, span: 1 })
  }
  return runs
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="my-6 grid gap-px border border-rule bg-rule sm:grid-cols-2">{children}</div>
}

export function CardLink({ href, title, children }: { href: string; title: string; children: ReactNode }) {
  return (
    <Link href={href} className="group flex flex-col bg-paper p-5 no-underline transition-colors hover:bg-paper-2">
      <span className="flex items-center justify-between gap-3 font-display text-[1.08rem] font-bold text-foreground">
        {title}
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brick" aria-hidden />
      </span>
      <span className="mt-1 text-[0.92rem] leading-relaxed text-muted-foreground">{children}</span>
    </Link>
  )
}

export function Timeline({ items }: { items: { date: string; title: string; body: ReactNode }[] }) {
  return (
    <ol className="my-8 border-l-2 border-rule-2">
      {items.map((item) => (
        <li key={item.date + item.title} className="relative pb-7 pl-6 last:pb-0">
          <span className="absolute -left-[7px] top-1.5 h-3 w-3 border-2 border-ink bg-paper" aria-hidden />
          <p className="agate text-xs text-brick">{item.date}</p>
          <p className="mt-0.5 font-display text-[1.12rem] font-bold leading-snug text-foreground">{item.title}</p>
          <div className="mt-1 text-[0.98rem] leading-relaxed text-ink-2">{item.body}</div>
        </li>
      ))}
    </ol>
  )
}

/** Question and answer pair for FAQ pages; native details so it works without JavaScript. */
export function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group border-b border-rule py-1 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-3 font-display text-[1.08rem] font-bold text-foreground hover:text-brick">
        {q}
        <span className="agate mt-0.5 shrink-0 text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <div className="docs-body pb-4">{children}</div>
    </details>
  )
}

export function Term({ word, children }: { word: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-rule py-3.5 sm:grid-cols-[12rem_1fr] sm:gap-6">
      <dt className="font-display text-[1.05rem] font-bold text-foreground">{word}</dt>
      <dd className="text-[0.98rem] leading-relaxed text-ink-2">{children}</dd>
    </div>
  )
}
