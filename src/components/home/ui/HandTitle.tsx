import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"
import { InView } from "@/components/home/ui/InView"

/*
 * Section headings, marked up the way a person marks a page: the label is a
 * handwritten note with a little pen squiggle, and one word of the title is
 * circled, underlined or highlighted. The mark draws itself on arrival.
 */

export type MarkStyle = "underline" | "circle" | "highlight"

export function HandEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn(handFont.className, "inline-flex -rotate-[1.5deg] items-center gap-1.5 text-[1.12rem] leading-none text-[var(--hs-trust)]", className)}>
      <svg width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden>
        <path d="M1 6 C 4 1, 7 9, 10 5 S 16 1, 21 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {children}
    </span>
  )
}

const len = (n: number) => ({ ["--len" as string]: n }) as CSSProperties

function Marked({ children, style }: { children: ReactNode; style: MarkStyle }) {
  if (style === "highlight") {
    return (
      <span className="relative inline-block whitespace-nowrap">
        <svg className="absolute -inset-x-1 bottom-[0.06em] -z-0 h-[0.42em] w-[calc(100%+0.5rem)]" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden>
          <path className="hs-draw" d="M3 12 C 50 6, 120 15, 197 8" fill="none" stroke="var(--hs-marigold)" strokeOpacity=".6" strokeWidth="16" strokeLinecap="round" style={{ ...len(210), animationDelay: ".3s" }} />
        </svg>
        <span className="relative">{children}</span>
      </span>
    )
  }
  if (style === "circle") {
    return (
      <span className="relative ml-1.5 inline-block whitespace-nowrap px-1">
        <svg className="pointer-events-none absolute -inset-x-2 -inset-y-1.5 h-[calc(100%+0.75rem)] w-[calc(100%+1rem)] overflow-visible" viewBox="0 0 120 50" preserveAspectRatio="none" aria-hidden>
          <path
            className="hs-draw"
            d="M70 4 C 100 3, 117 13, 115 26 C 113 41, 85 47, 58 46 C 28 45, 4 38, 5 24 C 6 11, 28 4, 58 5 C 70 5, 80 6, 88 9"
            fill="none"
            stroke="var(--color-brick)"
            strokeWidth="2.2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ ...len(340), animationDelay: ".3s", animationDuration: "1.3s" }}
          />
        </svg>
        {children}
      </span>
    )
  }
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg className="pointer-events-none absolute -bottom-[0.2em] left-0 h-[0.3em] w-full overflow-visible" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
        <path className="hs-draw" d="M2 8 C 40 3, 90 11, 130 6 S 185 4, 198 7" fill="none" stroke="var(--hs-marigold)" strokeWidth="3.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ ...len(220), animationDelay: ".3s" }} />
      </svg>
    </span>
  )
}

/** Renders `title`, marking the first occurrence of `mark` (if given). */
export function MarkedTitle({ title, mark, markStyle = "underline" }: { title: string; mark?: string; markStyle?: MarkStyle }) {
  const at = mark ? title.indexOf(mark) : -1
  if (!mark || at < 0) return <>{title}</>
  return (
    <>
      {title.slice(0, at)}
      <Marked style={markStyle}>{mark}</Marked>
      {title.slice(at + mark.length)}
    </>
  )
}

/** Wrapper so the marks wait until the heading is on screen. */
export function HandHeading({ children, className }: { children: ReactNode; className?: string }) {
  return <InView className={className}>{children}</InView>
}
