"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { EXAM_NORMS, CATEGORIES, calcAge } from "@/lib/tools/exam-age-norms";
import { StatusPill } from "@/components/tools/ToolShell";
import { cn } from "@/lib/utils";
import { handFont, typeFont } from "@/components/home/fonts";
import { HandTick, PenLoop } from "@/components/desk/DeskKit";
import { Sheet, chip, fieldBox, fieldLabel } from "@/components/tools/tool-kit";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const QUALS = ["10th", "12th", "ITI / Diploma", "Graduate", "Higher study"];

const QUAL_MAP: Record<string, string[]> = {
 "10th": ["ssc-mts", "ssc-gd", "rrb-alp", "agniveer"],
 "12th": ["ssc-mts", "ssc-gd", "ssc-chsl", "rrb-ntpc", "rrb-alp", "agniveer", "up-police"],
 "ITI / Diploma": ["ssc-mts", "ssc-gd", "ssc-chsl", "rrb-ntpc", "rrb-alp", "agniveer", "up-police"],
 Graduate: ["upsc-cse", "ssc-cgl", "ssc-chsl", "ssc-mts", "ibps-po", "ibps-clerk", "rrb-ntpc", "up-police", "ctet"],
 "Higher study": ["upsc-cse", "ssc-cgl", "ssc-chsl", "ssc-mts", "ibps-po", "ibps-clerk", "rrb-ntpc", "up-police", "ctet", "rrb-alp"],
};

export default function EligibilityCheckerClient() {
 const [dob, setDob] = useState("2001-05-10");
 const [category, setCategory] = useState("OBC");
 const [qual, setQual] = useState("Graduate");

 const result = useMemo(() => {
  const cutoff = new Date(new Date().getFullYear(), 7, 1);
  const age = calcAge(new Date(dob), cutoff);
  return EXAM_NORMS.filter((n) => n.id !== "custom").map((n) => {
   const relax = n.relaxations[category] ?? 0;
   const maxEff = n.maxAge + relax;
   const ageOk = age.decimalYears >= n.minAge && age.decimalYears < maxEff + 1;
   const qualOk = (QUAL_MAP[qual] ?? []).includes(n.id);
   return { norm: n, maxEff, ageOk, qualOk, eligible: ageOk && qualOk, age };
  });
 }, [dob, category, qual]);

 const eligible = result.filter((r) => r.eligible);

 return (
  <div className="grid items-start gap-6 lg:grid-cols-5">
   <Sheet label="FORM · ABOUT YOU" aside="three questions" className="lg:col-span-2">
    <div className="space-y-5 p-5">
     <div><Label className={fieldLabel}><span className={cn(handFont.className, "mr-1 text-[1rem] normal-case tracking-normal text-[var(--color-brick)]")}>1.</span>Birth date</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={fieldBox} /></div>
     <div><Label className={fieldLabel}><span className={cn(handFont.className, "mr-1 text-[1rem] normal-case tracking-normal text-[var(--color-brick)]")}>2.</span>Category</Label>
      <div className="mt-2 flex flex-wrap gap-2">{CATEGORIES.map((c) => (
       <button key={c.value} onClick={() => setCategory(c.value)} aria-pressed={category === c.value} className={chip(category === c.value)}>{c.label}</button>
      ))}</div></div>
     <div><Label className={fieldLabel}><span className={cn(handFont.className, "mr-1 text-[1rem] normal-case tracking-normal text-[var(--color-brick)]")}>3.</span>Study</Label>
      <div className="mt-2 flex flex-wrap gap-2">{QUALS.map((q) => (
       <button key={q} onClick={() => setQual(q)} aria-pressed={qual === q} className={chip(qual === q)}>{q}</button>
      ))}</div></div>
     <p className={cn(typeFont.className, "rounded-[6px] border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-3 py-2 text-[12px] text-muted-foreground")}>
      Age on 1 Aug • {category}
     </p>
    </div>
   </Sheet>

   <div className="space-y-5 lg:col-span-3">
    <Sheet>
     <div className="border-b border-dashed border-[var(--hs-border-strong)] px-6 pb-5 pt-5">
      <p className={cn(handFont.className, "text-[1.25rem] text-[oklch(45%_0.11_155)]")}>Good news</p>
      <p className="mt-1 font-display text-[1.9rem] font-black leading-tight text-foreground sm:text-[2.3rem]">
       You can apply for{" "}
       <span className="relative mx-1.5 inline-block px-3">
        {eligible.length}
        <PenLoop className="-inset-x-1 -inset-y-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.5rem)]" color="var(--color-brick)" />
       </span>{" "}
       exams
      </p>
      <p className={cn(typeFont.className, "mt-1 text-[12px] text-muted-foreground")}>{qual} • {category}</p>
     </div>
     <ul>
      {result.map(({ norm, maxEff, eligible: ok }) => (
       <li key={norm.id} className={cn("flex flex-wrap items-center gap-3 border-b border-dashed border-[var(--hs-border)] px-6 py-3.5 last:border-b-0", !ok && "opacity-70")}>
        <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border-[1.5px]", ok ? "border-[oklch(45%_0.11_155)]" : "border-[var(--hs-border-strong)]")} aria-hidden>
         {ok ? <HandTick className="h-4 w-5 text-[oklch(45%_0.11_155)]" /> : null}
        </span>
        <div className="min-w-0 flex-1">
         <p className="text-[15.5px] font-bold text-foreground">{norm.label}</p>
         <p className={cn(typeFont.className, "mt-0.5 text-[12px] text-muted-foreground")}>Age {norm.minAge}–{maxEff}</p>
        </div>
        {ok ? <StatusPill tone="ok">✓ Yes</StatusPill> : <StatusPill tone="warn">Not now</StatusPill>}
       </li>
      ))}
     </ul>
    </Sheet>
    <div className="flex flex-wrap gap-3">
     <Button asChild className="h-12 rounded-full px-6 text-base font-semibold"><Link href="/tools/age-calculator">Check exact age</Link></Button>
     <Button asChild variant="outline" className="h-12 rounded-full px-6 text-base"><Link href="/jobs">See jobs</Link></Button>
    </div>
   </div>
  </div>
 );
}
