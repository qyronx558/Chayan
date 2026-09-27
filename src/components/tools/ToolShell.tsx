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
  age: { tint: "bg-[#e9edf4] dark:bg-[#1c2438]", accent: "bg-[#5b6d9e]", deep: "bg-[#5b6d9e]", softBorder: "border-[#c9d2e4] dark:border-[#2c3a58]" },
  salary: { tint: "bg-[#e7f0ec] dark:bg-[#17281f]", accent: "bg-[#4f8577]", deep: "bg-[#4f8577]", softBorder: "border-[#c2d8cf] dark:border-[#24473d]" },
  photo: { tint: "bg-[#f3ece1] dark:bg-[#2b2118]", accent: "bg-[#b07a4f]", deep: "bg-[#b07a4f]", softBorder: "border-[#e2d3bd] dark:border-[#4a3a28]" },
  eligibility: { tint: "bg-[#e7eef4] dark:bg-[#16232f]", accent: "bg-[#4a7396]", deep: "bg-[#4a7396]", softBorder: "border-[#c3d4e2] dark:border-[#27445c]" },
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
          <Badge className="border border-slate-300/70 bg-white/70 font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">{badge}</Badge>
          <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-slate-800 sm:text-[30px] dark:text-slate-100">{title}</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">{subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[13px]">
            {["Free", "No signup", "Works on your phone"].map((t) => (
              <span key={t} className="rounded-full border border-slate-300/60 bg-white/60 px-3 py-1 font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">{t}</span>
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
          <Link key={l.h} href={l.h} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{l.t}</p>
            <p className="mt-0.5 text-[13px] text-slate-500">{l.d}</p>
          </Link>
        ))}
      </div>
      {faq && faq.length > 0 && (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-[18px] font-semibold text-slate-900 dark:text-slate-100">Common questions</h2>
          <div className="mt-3 space-y-4">
            {faq.map((f) => (
              <div key={f.q}>
                <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-200">{f.q}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-slate-600 dark:text-slate-400">{f.a}</p>
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
      tone === "ok" && "bg-[#e2ede4] text-[#33603f] dark:bg-[#1d2f28] dark:text-[#9fc3ae]",
      tone === "warn" && "bg-[#f2e9d4] text-[#6f5a2c] dark:bg-[#2f2a1d] dark:text-[#cfc09a]",
      tone === "bad" && "bg-[#f0e0de] text-[#7e3b35] dark:bg-[#30201f] dark:text-[#cfa5a0]",
      tone === "info" && "bg-[#dfe8f1] text-[#33506b] dark:bg-[#1d2836] dark:text-[#a3b8cf]",
    )}>{children}</span>
  );
}
