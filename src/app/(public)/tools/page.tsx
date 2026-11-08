import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, IndianRupee, ImageIcon, BadgeCheck } from "lucide-react";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Free Sarkari Tools - Age, Salary, Photo Resizer, Eligibility",
  description: "Free tools for govt job aspirants: universal age calculator for all India exams, 7th+8th pay salary explorer, photo/signature resizer, eligibility checker.",
  alternates: { canonical: "/tools" },
};

const TOOLS = [
  { slug: "age-calculator", icon: Calculator, title: "Universal age calculator", desc: "Exact Y-M-D age on any cutoff date plus eligibility for UPSC, SSC, Railway, Banking, Police and Agniveer with category relaxation.", note: "Most used" },
  { slug: "salary-calculator", icon: IndianRupee, title: "Salary explorer (7th + 8th Pay)", desc: "Level-wise basic, DA, HRA, TA, NPS and tax to in-hand salary, with an 8th CPC projector and fitment slider.", note: "7th + 8th CPC" },
  { slug: "photo-resizer", icon: ImageIcon, title: "Photo, signature and PDF tools", desc: "Resize to 20KB or 50KB SSC specs, compress images and convert to PDF. Runs fully in your browser, private by default.", note: "Private and fast" },
  { slug: "eligibility-checker", icon: BadgeCheck, title: "Eligibility checker", desc: "Enter age, qualification and category to instantly see which exam families you can apply for.", note: "Am I eligible?" },
];

export default function ToolsHub() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <BreadcrumbNav segments={[{ label: "Free tools", href: "/tools" }]} />
      <header className="mt-4 border-b-2 border-rule-2 pb-5">
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] text-foreground sm:text-[2.6rem]">
          Tools every aspirant needs, in one place
        </h1>
        <p className="mt-3 max-w-2xl text-[1.0625rem] leading-relaxed text-muted-foreground">
          Accurate age on cutoff dates, real in-hand salary with 7th and projected 8th pay,
          exam-spec photo tools, and instant eligibility. Free, no signup.
        </p>
      </header>
      <div className="mt-6 grid gap-x-10 sm:grid-cols-2">
        {TOOLS.map((t, i) => (
          <Link
            key={t.slug}
            href={`/tools/${t.slug}`}
            className="group flex items-start gap-4 border-t border-rule py-5 transition-colors"
          >
            <span className="agate w-6 shrink-0 pt-1 text-xs text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <t.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="font-display text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-brick">
                  {t.title}
                </span>
                <span className="agate text-[0.7rem] text-muted-foreground">{t.note}</span>
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{t.desc}</span>
              <span className="mt-2 inline-block text-sm font-medium text-brick underline decoration-1 underline-offset-4 group-hover:decoration-2">
                Open tool
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
