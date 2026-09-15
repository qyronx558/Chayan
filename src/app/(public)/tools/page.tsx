import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, IndianRupee, ImageIcon, BadgeCheck, ArrowRight, Sparkles } from "lucide-react";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Free Sarkari Tools - Age, Salary, Photo Resizer, Eligibility",
  description: "Free tools for govt job aspirants: universal age calculator for all India exams, 7th+8th pay salary explorer, photo/signature resizer, eligibility checker.",
  alternates: { canonical: "/tools" },
};

const TOOLS = [
  { slug: "age-calculator", icon: Calculator, title: "Universal Age Calculator", desc: "Exact Y-M-D age on any cutoff date + eligibility for UPSC, SSC, Railway, Banking, Police, Agniveer with category relaxation.", accent: "bg-[#5b6d9e]", tile: "bg-[#e9edf4] text-[#4c5e88] dark:bg-[#1c2438] dark:text-[#a9b8d4]", badge: "Most used" },
  { slug: "salary-calculator", icon: IndianRupee, title: "Salary Explorer (7th + 8th Pay)", desc: "Level-wise basic, DA, HRA, TA, NPS, tax to in-hand salary. 8th CPC projector with fitment slider.", accent: "bg-[#4f8577]", tile: "bg-[#e7f0ec] text-[#3e6e62] dark:bg-[#17281f] dark:text-[#93bfae]", badge: "7th + 8th CPC" },
  { slug: "photo-resizer", icon: ImageIcon, title: "Photo, Signature and PDF Tools", desc: "Resize to 20KB/50KB SSC specs, compress images, convert to PDF - 100% in-browser, private.", accent: "bg-[#b07a4f]", tile: "bg-[#f3ece1] text-[#8f6238] dark:bg-[#2b2118] dark:text-[#cfa87c]", badge: "Private and fast" },
  { slug: "eligibility-checker", icon: BadgeCheck, title: "Eligibility Checker", desc: "Enter age, qualification, category to instantly know which exam families you can apply for.", accent: "bg-[#4a7396]", tile: "bg-[#e7eef4] text-[#3a607e] dark:bg-[#16232f] dark:text-[#93b4cc]", badge: "Am I eligible?" },
];

export default function ToolsHub() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <BreadcrumbNav segments={[{ label: "Free Tools", href: "/tools" }]} />
      <header className="relative mt-4 overflow-hidden rounded-xl bg-[#1c2e44] p-6 text-slate-100 shadow-sm sm:p-10 dark:bg-[#131f30]">
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200"><Sparkles className="h-3.5 w-3.5" /> Free Sarkari Tools</span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Tools every aspirant needs, in one place.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-[15px]">Accurate age on cutoff dates, real in-hand salary with 7th and projected 8th pay, exam-spec photo tools, and instant eligibility - free forever, no signup.</p>
        </div>
      </header>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <Link key={t.slug} href={`/tools/${t.slug}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-400 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${t.tile}`}>
                  <t.icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{t.badge}</span>
              </div>
              <div className={`mt-4 h-1 w-12 rounded-full ${t.accent}`} aria-hidden="true" />
              <h2 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{t.title}</h2>
            </div>
            <div className="p-5">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-700 group-hover:gap-2 dark:text-slate-300">Open tool <ArrowRight className="h-4 w-4" /></span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
