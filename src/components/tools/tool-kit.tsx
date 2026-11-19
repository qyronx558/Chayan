import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"

/*
 * The tools are the instruments in an aspirant's geometry box. Each one is
 * drawn as the paper object it replaces:
 *   age          a tear-off calendar with the cutoff date circled
 *   salary       a pay slip
 *   photo        a strip of passport photos from the studio
 *   eligibility  a form with ticks and a stamp
 * Server-safe: no hooks, so both the shell and the client tools can use it.
 */

export const INK = {
 green: "oklch(45% 0.11 155)",
 red: "oklch(50% 0.18 28)",
 blue: "oklch(46% 0.13 255)",
 amber: "oklch(58% 0.13 70)",
 paper: "oklch(98% 0.008 90)",
 paperInk: "oklch(27% 0.03 60)",
} as const

export const paperShadow = "0 1px 2px rgb(60 40 10 / .08), 0 16px 28px -22px rgb(60 40 10 / .55)"

export type ToolKey = "age" | "salary" | "photo" | "eligibility"

export const TOOL_SKINS: Record<ToolKey, { no: string; kicker: string; note: string; accent: string }> = {
 age: { no: "01", kicker: "THE AGE COUNTER", note: "count on the notification's date, not today's.", accent: INK.blue },
 salary: { no: "02", kicker: "THE PAY SLIP", note: "what actually lands in your account, every month.", accent: INK.green },
 photo: { no: "03", kicker: "THE PHOTO STUDIO", note: "no shop, no queue. it never leaves your phone.", accent: INK.red },
 eligibility: { no: "04", kicker: "THE ELIGIBILITY FORM", note: "three answers. then you know where to apply.", accent: INK.amber },
}

/** A sheet of paper the tool's inputs or results sit on. */
export function Sheet({ label, aside, children, className, style }: { label?: string; aside?: ReactNode; children: ReactNode; className?: string; style?: CSSProperties }) {
 return (
  <div className={cn("rounded-[4px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)]", className)} style={{ boxShadow: paperShadow, ...style }}>
   {label ? (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-[var(--hs-border-strong)] px-5 py-3">
     <p className={cn(typeFont.className, "text-[10.5px] font-bold tracking-[0.25em] text-muted-foreground")}>{label}</p>
     {aside ? <span className={cn(handFont.className, "text-[1rem] text-muted-foreground")}>{aside}</span> : null}
    </div>
   ) : null}
   {children}
  </div>
 )
}

/** Field label in the typed, form-like style. */
export const fieldLabel = cn(typeFont.className, "block text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/75")

/** Inputs as boxes on a printed form. */
export const fieldBox = "mt-1.5 h-12 rounded-[10px] border-[1.5px] border-[var(--hs-border-strong)] bg-[var(--hs-surface)] text-base shadow-none focus-visible:border-foreground/60 focus-visible:ring-4 focus-visible:ring-[color-mix(in_oklch,var(--color-brick)_14%,transparent)]"

/** A choice you can press: pill, filled in brick when chosen. */
export const chip = (on: boolean) =>
 cn(
  "min-h-[40px] rounded-full border-[1.5px] px-4 py-2 text-[13px] font-semibold transition-all duration-200",
  on
   ? "border-[var(--color-brick)] bg-[var(--color-brick)] text-[oklch(98%_0.01_90)] shadow-[0_4px_10px_-5px_rgb(0_0_0/.45)]"
   : "border-[var(--hs-border-strong)] bg-[var(--hs-surface)] text-foreground/80 hover:-translate-y-px hover:border-foreground/50",
 )

/** A bigger choice tile (city class, photo preset). */
export const tile = (on: boolean) =>
 cn(
  "relative rounded-[8px] border-[1.5px] p-3 text-left transition-all duration-200",
  on
   ? "border-[var(--color-brick)] bg-[color-mix(in_oklch,var(--color-brick)_8%,var(--hs-paper-slip))] shadow-[0_8px_16px_-12px_rgb(0_0_0/.5)]"
   : "border-[var(--hs-border-strong)] bg-[var(--hs-surface)] hover:-translate-y-0.5 hover:border-foreground/50",
 )

/* ───────────────────────── the objects ───────────────────────── */

function CalendarPad() {
 return (
  <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
   <ellipse cx="100" cy="190" rx="70" ry="6" fill="rgb(0 0 0 / .1)" />
   <rect x="34" y="40" width="132" height="146" rx="6" fill="oklch(92% 0.02 85)" />
   <rect x="30" y="34" width="132" height="146" rx="6" fill={INK.paper} stroke="oklch(75% 0.02 80)" />
   <rect x="30" y="34" width="132" height="38" rx="6" fill={INK.blue} />
   <rect x="30" y="60" width="132" height="12" fill={INK.blue} />
   {[56, 82, 108, 134].map((x) => <rect key={x} x={x} y="26" width="6" height="18" rx="3" fill="oklch(45% 0.02 70)" />)}
   <text x="96" y="62" textAnchor="middle" fontSize="15" fontWeight="700" fill="oklch(97% 0.01 90)" fontFamily="'Courier Prime', monospace">AUGUST</text>
   <text x="96" y="140" textAnchor="middle" fontSize="62" fontWeight="900" fill={INK.paperInk} fontFamily="Georgia, serif">1</text>
   <ellipse cx="96" cy="120" rx="34" ry="30" fill="none" stroke={INK.red} strokeWidth="3" transform="rotate(-8 96 120)" />
   <text x="96" y="168" textAnchor="middle" fontSize="11" fill={INK.paperInk} fontFamily="'Courier Prime', monospace">CUTOFF DATE</text>
  </svg>
 )
}

function PaySlip() {
 return (
  <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
   <ellipse cx="100" cy="190" rx="70" ry="6" fill="rgb(0 0 0 / .1)" />
   <g transform="rotate(-4 100 100)">
    <path d="M40 22 H160 V176 l-10 6 -10 -6 -10 6 -10 -6 -10 6 -10 -6 -10 6 -10 -6 -10 6 -10 -6 -10 6 Z" fill={INK.paper} stroke="oklch(75% 0.02 80)" />
    <text x="100" y="44" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK.paperInk} fontFamily="'Courier Prime', monospace">PAY SLIP</text>
    <line x1="52" y1="52" x2="148" y2="52" stroke={INK.paperInk} strokeDasharray="3 3" />
    {[68, 84, 100, 116].map((y, i) => (
     <g key={y}>
      <rect x="52" y={y - 7} width={38 + (i % 2) * 10} height="5" rx="2" fill="oklch(80% 0.02 80)" />
      <rect x={124 - (i % 3) * 4} y={y - 7} width={24 + (i % 3) * 4} height="5" rx="2" fill="oklch(70% 0.03 80)" />
     </g>
    ))}
    <line x1="52" y1="130" x2="148" y2="130" stroke={INK.paperInk} strokeDasharray="3 3" />
    <text x="52" y="152" fontSize="12" fontWeight="700" fill={INK.paperInk} fontFamily="'Courier Prime', monospace">NET</text>
    <text x="148" y="152" textAnchor="end" fontSize="18" fontWeight="900" fill={INK.green} fontFamily="Georgia, serif">₹ ✓</text>
   </g>
   <g>
    {[0, 1, 2, 3].map((i) => (
     <ellipse key={i} cx="168" cy={168 - i * 7} rx="20" ry="6" fill={i === 3 ? "oklch(80% 0.1 85)" : "oklch(70% 0.1 80)"} stroke="oklch(55% 0.08 75)" />
    ))}
    <text x="168" y="148" textAnchor="middle" fontSize="8" fontWeight="700" fill="oklch(40% 0.06 70)">₹</text>
   </g>
  </svg>
 )
}

function PhotoStrip() {
 return (
  <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
   <ellipse cx="100" cy="190" rx="70" ry="6" fill="rgb(0 0 0 / .1)" />
   <g transform="rotate(5 100 100)">
    <rect x="44" y="18" width="112" height="164" rx="3" fill="oklch(99% 0.004 90)" stroke="oklch(78% 0.02 80)" />
    {[0, 1].map((r) =>
     [0, 1].map((c) => {
      const x = 52 + c * 52, y = 26 + r * 76
      return (
       <g key={`${r}${c}`}>
        <rect x={x} y={y} width="44" height="68" fill="oklch(88% 0.04 230)" />
        <circle cx={x + 22} cy={y + 26} r="11" fill="oklch(52% 0.04 50)" />
        <path d={`M${x + 4} ${y + 68} C ${x + 6} ${y + 46}, ${x + 38} ${y + 46}, ${x + 40} ${y + 68} Z`} fill="oklch(40% 0.05 250)" />
       </g>
      )
     }),
    )}
    <path d="M44 100 H156" stroke={INK.red} strokeDasharray="4 4" strokeWidth="1.4" />
   </g>
   {/* scissors */}
   <g transform="translate(150 96) rotate(-20)">
    <circle cx="0" cy="0" r="7" fill="none" stroke="oklch(40% 0.02 60)" strokeWidth="3" />
    <circle cx="0" cy="18" r="7" fill="none" stroke="oklch(40% 0.02 60)" strokeWidth="3" />
    <path d="M6 4 L 40 16 M6 14 L 40 4" stroke="oklch(55% 0.01 250)" strokeWidth="3" strokeLinecap="round" />
   </g>
  </svg>
 )
}

function TickForm() {
 return (
  <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
   <ellipse cx="100" cy="190" rx="70" ry="6" fill="rgb(0 0 0 / .1)" />
   <g transform="rotate(-3 100 100)">
    <rect x="40" y="20" width="120" height="160" rx="3" fill={INK.paper} stroke="oklch(75% 0.02 80)" />
    <text x="52" y="40" fontSize="10" fontWeight="700" fill={INK.paperInk} fontFamily="'Courier Prime', monospace">AM I ELIGIBLE?</text>
    {["Age", "Category", "Study"].map((t, i) => (
     <g key={t}>
      <rect x="52" y={56 + i * 26} width="12" height="12" rx="2" fill="none" stroke={INK.paperInk} strokeWidth="1.4" />
      <path d={`M54 ${63 + i * 26} l3 4 l8 -11`} stroke={INK.green} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <text x="72" y={66 + i * 26} fontSize="11" fill={INK.paperInk} fontFamily="'Courier Prime', monospace">{t}</text>
      <line x1="112" y1={67 + i * 26} x2="148" y2={67 + i * 26} stroke="oklch(75% 0.02 80)" />
     </g>
    ))}
    <g transform="rotate(-12 110 150)">
     <rect x="72" y="134" width="78" height="26" rx="4" fill="none" stroke={INK.green} strokeWidth="3" />
     <text x="111" y="152" textAnchor="middle" fontSize="12" fontWeight="700" fill={INK.green} fontFamily="'Courier Prime', monospace">ELIGIBLE</text>
    </g>
   </g>
  </svg>
 )
}

export function ToolObject({ tool, className }: { tool: ToolKey; className?: string }) {
 return (
  <div className={cn("h-[190px] w-[190px]", className)}>
   {tool === "age" ? <CalendarPad /> : tool === "salary" ? <PaySlip /> : tool === "photo" ? <PhotoStrip /> : <TickForm />}
  </div>
 )
}
