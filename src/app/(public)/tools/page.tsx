import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, IndianRupee, ImageIcon, BadgeCheck } from "lucide-react";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";
import { cn } from "@/lib/utils";
import { handFont, typeFont } from "@/components/home/fonts";
import { ToolObject } from "@/components/tools/tool-kit";
import "@/app/home.css";

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

const KEYS = ["age", "salary", "photo", "eligibility"] as const;

export default function ToolsHub() {
  return (
    <div className="home-saas mx-auto max-w-6xl px-4 pb-20 pt-6 sm:pt-8">
      <BreadcrumbNav segments={[{ label: "Free tools", href: "/tools" }]} />
      <header className="mt-6 max-w-3xl">
        <p className={cn(typeFont.className, "text-[11px] font-bold tracking-[0.3em] text-[var(--color-brick)]")}>THE GEOMETRY BOX · FREE TOOLS</p>
        <h1 className="mt-3 font-display text-[2.3rem] font-black leading-[1.04] text-foreground sm:text-[3.2rem]">
          Tools every aspirant needs, in one place
        </h1>
        <p className="mt-3 max-w-2xl text-[1.0625rem] leading-relaxed text-muted-foreground">
          Accurate age on cutoff dates, real in-hand salary with 7th and projected 8th pay,
          exam-spec photo tools, and instant eligibility. Free, no signup.
        </p>
        <p className={cn(handFont.className, "mt-2 text-[1.35rem] leading-snug text-foreground/80")}>
          the same tin box you carried to every exam, only these never run out of lead.
        </p>
      </header>

      {/* ── the open tin ── */}
      <div className="mt-10 rounded-[16px] p-3 sm:p-4" style={{ background: "linear-gradient(160deg, oklch(62% 0.03 240), oklch(48% 0.035 245))", boxShadow: "inset 0 2px 0 oklch(78% 0.02 240), inset 0 -3px 0 oklch(36% 0.03 245), 0 30px 46px -30px rgb(10 20 40 / .75)" }}>
        {/* the lid's label strip */}
        <div className="mb-3 flex items-center justify-between rounded-[6px] px-4 py-2" style={{ background: "oklch(94% 0.03 85)" }}>
          <span className={cn(typeFont.className, "text-[11px] font-bold tracking-[0.3em] text-[oklch(30%_0.04_60)]")}>CHAYANJOBS · MATHEMATICAL DRAWING INSTRUMENTS</span>
          <span className={cn(handFont.className, "hidden text-[1.05rem] text-[oklch(45%_0.17_28)] sm:block")}>name: you</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {TOOLS.map((t, i) => (
            <Link
              key={t.slug}
              href={`/tools/${t.slug}`}
              className="group relative flex items-center gap-4 overflow-hidden rounded-[10px] p-4 transition-transform duration-300 hover:-translate-y-1 sm:p-5"
              style={{ background: "oklch(97% 0.012 85)", boxShadow: "inset 0 3px 8px -4px rgb(0 0 0 / .35)" }}
            >
              <ToolObject tool={KEYS[i]} className="h-[118px] w-[118px] shrink-0 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105" />
              <span className="min-w-0 flex-1 text-[oklch(27%_0.03_60)]">
                <span className={cn(typeFont.className, "flex items-center justify-between gap-2 text-[10.5px] font-bold tracking-[0.2em] opacity-70")}>
                  <span>NO. {String(i + 1).padStart(2, "0")}</span>
                  <t.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="mt-1.5 block font-display text-[1.25rem] font-black leading-snug group-hover:text-[oklch(45%_0.17_28)]">
                  {t.title}
                </span>
                <span className="mt-1 block text-[13.5px] leading-relaxed opacity-80">{t.desc}</span>
                <span className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span className={cn(typeFont.className, "-rotate-[3deg] rounded-[3px] border-2 border-[oklch(45%_0.17_28)] px-1.5 text-[10px] font-bold uppercase text-[oklch(45%_0.17_28)]")}>{t.note}</span>
                  <span className={cn(handFont.className, "text-[1.1rem] text-[oklch(42%_0.075_205)] underline decoration-wavy decoration-1 underline-offset-4")}>Open tool →</span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
