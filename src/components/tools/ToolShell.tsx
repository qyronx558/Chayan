import Link from "next/link";
import type { ReactNode } from "react";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";
import { cn } from "@/lib/utils";
import { handFont, typeFont } from "@/components/home/fonts";
import { INK, TOOL_SKINS, ToolObject, type ToolKey } from "@/components/tools/tool-kit";
import "@/app/home.css";

// Eye-comfortable colour system for tools.
// Rule: colour lives in soft tints (light backgrounds, dark slate text) and
// small accents (4px bar, icon tile, active button). No saturated gradients,
// no white-on-neon. Each tool owns one muted hue:
// age = dusty indigo, salary = sage green, photo = warm clay, eligibility = steel blue.

export const TOOL_THEMES: Record<string, { tint: string; accent: string; deep: string; softBorder: string }> = {
 age: { tint: "bg-paper-2 dark:bg-ink", accent: "bg-ink", deep: "bg-ink", softBorder: "border-rule dark:border-rule" },
 salary: { tint: "bg-paper-2 dark:bg-ink", accent: "bg-ink", deep: "bg-ink", softBorder: "border-rule dark:border-rule" },
 photo: { tint: "bg-paper-2 dark:bg-ink", accent: "bg-ink", deep: "bg-ink", softBorder: "border-rule dark:border-rule" },
 eligibility: { tint: "bg-paper-2 dark:bg-ink", accent: "bg-ink", deep: "bg-ink", softBorder: "border-rule dark:border-rule" },
};

export function ToolShell({ toolKey, title, subtitle, badge, children, faq }: {
 toolKey: keyof typeof TOOL_THEMES; title: string; subtitle: string; badge: string; children: ReactNode; faq?: { q: string; a: string }[];
}) {
 const skin = TOOL_SKINS[toolKey as ToolKey];
 const others = [
  { k: "age", t: "Age Calculator", h: "/tools/age-calculator", d: "Check age in seconds" },
  { k: "salary", t: "Salary Explorer", h: "/tools/salary-calculator", d: "See take-home pay" },
  { k: "photo", t: "Photo Resizer", h: "/tools/photo-resizer", d: "Photo ready in one click" },
  { k: "eligibility", t: "Eligibility Checker", h: "/tools/eligibility-checker", d: "Where can I apply?" },
 ].filter((l) => l.k !== toolKey).slice(0, 3);
 return (
  <div className="home-saas mx-auto max-w-6xl px-4 py-6 sm:py-8">
   <BreadcrumbNav segments={[{ label: "Free Tools", href: "/tools" }, { label: title, href: "" }]} />

   {/* ── header: the instrument, out of the box ── */}
   <header className="mt-6 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
    <div className="min-w-0">
     <p className={cn(typeFont.className, "text-[11px] font-bold tracking-[0.3em]")} style={{ color: skin.accent }}>
      TOOL {skin.no} · {skin.kicker}
     </p>
     <h1 className="mt-2 font-display text-[2.3rem] font-black leading-[1.04] text-foreground sm:text-[3rem]">{title}</h1>
     <p className="mt-2 max-w-2xl text-[15.5px] leading-relaxed text-muted-foreground">{subtitle}</p>
     <p className={cn(handFont.className, "mt-1.5 text-[1.3rem] leading-snug text-foreground/80")}>{skin.note}</p>
     <div className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px]">
      <span className={cn(typeFont.className, "rotate-[-2deg] rounded-[3px] border-2 px-2 py-0.5 text-[11px] font-bold uppercase")} style={{ color: skin.accent, borderColor: skin.accent }}>{badge}</span>
      {["Free", "No signup", "Works on your phone"].map((t, i) => (
       <span key={t} className={cn("rounded-full border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-3 py-1 font-medium text-foreground/75", i % 2 ? "rotate-[1deg]" : "-rotate-[1deg]")}>{t}</span>
      ))}
     </div>
    </div>
    <ToolObject tool={toolKey as ToolKey} className="hidden sm:block" />
   </header>

   <div className="mt-8">{children}</div>

   {/* ── the rest of the geometry box ── */}
   <div className="mt-12">
    <p className={cn(handFont.className, "text-[1.2rem] text-muted-foreground")}>also in the box:</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
     {others.map((l, i) => (
      <Link
       key={l.h}
       href={l.h}
       className={cn("group relative rounded-[4px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] py-3.5 pl-9 pr-4 transition-transform duration-300 hover:-translate-y-1", i % 2 ? "rotate-[0.5deg]" : "-rotate-[0.5deg]")}
       style={{ boxShadow: "0 8px 16px -12px rgb(60 40 10 / .5)" }}
      >
       {/* the tag's eyelet */}
       <span className="absolute left-3.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[var(--hs-border-strong)] bg-background" aria-hidden />
       <p className="text-[15px] font-semibold text-foreground group-hover:text-[var(--color-brick)]">{l.t} <span aria-hidden>→</span></p>
       <p className={cn(handFont.className, "text-[1rem] text-muted-foreground")}>{l.d.toLowerCase()}</p>
      </Link>
     ))}
    </div>
   </div>

   {faq && faq.length > 0 && (
    <section className="mt-12">
     <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="font-display text-[1.6rem] font-black text-foreground">Common questions</h2>
      <span className={cn(handFont.className, "text-[1.05rem] text-muted-foreground")}>asked by people using this tool</span>
     </div>
     <div className="mt-4 grid gap-4 md:grid-cols-2">
      {faq.map((f, i) => (
       <div key={f.q} className={cn("rounded-[4px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] px-5 py-4", i % 2 ? "rotate-[0.3deg]" : "-rotate-[0.3deg]")} style={{ boxShadow: "0 6px 12px -10px rgb(60 40 10 / .5)" }}>
        <p className="flex gap-2.5 text-[15px] font-semibold leading-snug text-foreground">
         <span className={cn(handFont.className, "shrink-0 text-[1.15rem] font-normal text-[var(--color-brick)]")} aria-hidden>Q.</span>
         {f.q}
        </p>
        <p className="mt-2 flex gap-2.5 text-[14px] leading-relaxed text-muted-foreground">
         <span className={cn(handFont.className, "shrink-0 text-[1.15rem] text-[oklch(45%_0.11_155)]")} aria-hidden>A.</span>
         <span>{f.a}</span>
        </p>
       </div>
      ))}
     </div>
     <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }) }} />
    </section>
   )}
  </div>
 );
}

/** A rubber stamp, the way a clerk marks a form. Same tones and text as before. */
export function StatusPill({ tone, children }: { tone: "ok" | "warn" | "bad" | "info"; children: ReactNode }) {
 const ink = tone === "ok" ? INK.green : tone === "bad" ? INK.red : tone === "warn" ? INK.amber : INK.blue;
 return (
  <span
   className={cn(typeFont.className, "inline-flex -rotate-[6deg] items-center gap-1.5 rounded-[4px] border-[2.5px] px-2.5 py-0.5 text-[12px] font-bold uppercase leading-tight")}
   style={{ color: ink, borderColor: ink, background: `color-mix(in oklch, ${ink} 6%, transparent)` }}
  >{children}</span>
 );
}
