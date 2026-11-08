import Link from "next/link";
import type { ReactNode } from "react";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
 const theme = TOOL_THEMES[toolKey];
 return (
  <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
   <BreadcrumbNav segments={[{ label: "Free Tools", href: "/tools" }, { label: title, href: "" }]} />
   <header className={cn("relative mt-4 overflow-hidden rounded-xl border p-6 sm:p-8", theme.tint, theme.softBorder)}>
    <div className={cn("absolute inset-x-0 top-0 h-1", theme.accent)} aria-hidden="true" />
    <div className="relative">
     <Badge className="border border-rule/70 bg-background/70 font-medium text-muted-foreground dark:border-rule-2 dark:bg-ink dark:text-muted-foreground">{badge}</Badge>
     <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px] dark:text-paper">{title}</h1>
     <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base dark:text-muted-foreground">{subtitle}</p>
     <div className="mt-4 flex flex-wrap gap-2 text-[13px]">
      {["Free", "No signup", "Works on your phone"].map((t) => (
       <span key={t} className="rounded-full border border-rule/60 bg-background/60 px-3 py-1 font-medium text-muted-foreground dark:border-rule-2 dark:bg-ink dark:text-muted-foreground">{t}</span>
      ))}
     </div>
    </div>
   </header>
   <div className="mt-6">{children}</div>
   <div className="mt-8 grid gap-3 sm:grid-cols-3">
    {[
     { t: "Age Calculator", h: "/tools/age-calculator", d: "Check age in seconds" },
     { t: "Salary Explorer", h: "/tools/salary-calculator", d: "See take-home pay" },
     { t: "Photo Resizer", h: "/tools/photo-resizer", d: "Photo ready in one click" },
    ].filter((l) => !l.h.endsWith(toolKey === "age" ? "age-calculator" : toolKey === "salary" ? "salary-calculator" : toolKey === "photo" ? "photo-resizer" : "___")).slice(0, 3).map((l) => (
     <Link key={l.h} href={l.h} className="rounded-xl border border-rule bg-background p-4 transition hover:border-rule-2 dark:border-ink dark:bg-ink">
      <p className="text-[15px] font-semibold text-foreground dark:text-paper">{l.t}</p>
      <p className="mt-0.5 text-[13px] text-muted-foreground">{l.d}</p>
     </Link>
    ))}
   </div>
   {faq && faq.length > 0 && (
    <section className="mt-8 rounded-xl border border-rule bg-background p-6 dark:border-ink dark:bg-ink">
     <h2 className="text-[18px] font-semibold text-foreground dark:text-paper">Common questions</h2>
     <div className="mt-3 space-y-4">
      {faq.map((f) => (
       <div key={f.q}>
        <p className="text-[15px] font-semibold text-foreground dark:text-muted-foreground">{f.q}</p>
        <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground dark:text-muted-foreground">{f.a}</p>
       </div>
      ))}
     </div>
     <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }) }} />
    </section>
   )}
  </div>
 );
}

export function StatusPill({ tone, children }: { tone: "ok" | "warn" | "bad" | "info"; children: ReactNode }) {
 return (
  <span className={cn(
   "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
   tone === "ok" && "border border-rule bg-paper-2 text-foreground",
   tone === "warn" && "border border-rule bg-paper-2 text-brick",
   tone === "bad" && "border border-brick bg-paper-2 text-brick",
   tone === "info" && "border border-rule bg-paper-3 text-muted-foreground",
  )}>{children}</span>
 );
}
