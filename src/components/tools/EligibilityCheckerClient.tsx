"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { EXAM_NORMS, CATEGORIES, calcAge } from "@/lib/tools/exam-age-norms";
import { StatusPill } from "@/components/tools/ToolShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2 border-[#c3d4e2] dark:border-[#27445c]">
        <CardHeader className="bg-[#e7eef4] dark:bg-[#16232f]"><CardTitle className="text-[17px] text-slate-800 dark:text-slate-100">About you</CardTitle></CardHeader>
        <CardContent className="space-y-5 p-5">
          <div><Label className="text-[15px]">Birth date</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1.5 h-12 text-base" /></div>
          <div><Label className="text-[15px]">Category</Label>
            <div className="mt-2 flex flex-wrap gap-2">{CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => setCategory(c.value)} className={`min-h-[40px] rounded-full border px-4 py-2 text-[13px] font-medium ${category === c.value ? "border-[#4a7396] bg-[#4a7396] text-white" : "border-slate-200 dark:border-slate-700"}`}>{c.label}</button>
            ))}</div></div>
          <div><Label className="text-[15px]">Study</Label>
            <div className="mt-2 flex flex-wrap gap-2">{QUALS.map((q) => (
              <button key={q} onClick={() => setQual(q)} className={`min-h-[40px] rounded-lg border px-3.5 py-2 text-[14px] font-medium ${qual === q ? "border-[#4a7396] bg-[#e7eef4] text-[#33506b] dark:bg-[#16232f] dark:text-[#93b4cc] dark:border-[#4a7396]" : "border-slate-200 text-slate-500 dark:border-slate-700"}`}>{q}</button>
            ))}</div></div>
          <div className="rounded-xl bg-[#e7eef4] p-3 text-[13px] text-[#3a607e] dark:bg-[#16232f] dark:text-[#93b4cc]">
            Age on 1 Aug • {category}
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-3 space-y-4">
        <Card className="overflow-hidden">
          <div className="bg-[#e7eef4] p-6 dark:bg-[#16232f]">
            <p className="text-[13px] font-medium uppercase tracking-widest text-[#5b7f9c] dark:text-[#7d9cb8]">Good news</p>
            <p className="mt-1 text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">You can apply for {eligible.length} exams</p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{qual} • {category}</p>
          </div>
          <CardContent className="divide-y divide-gray-100 p-0 dark:divide-gray-800">
            {result.map(({ norm, maxEff, eligible: ok }) => (
              <div key={norm.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">{norm.label}</p>
                  <p className="mt-0.5 text-[13px] text-gray-500">Age {norm.minAge}–{maxEff}</p>
                </div>
                {ok ? <StatusPill tone="ok">✓ Yes</StatusPill> : <StatusPill tone="warn">Not now</StatusPill>}
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="h-12 bg-[#4a7396] px-5 text-base hover:bg-[#3c5f7c]"><Link href="/tools/age-calculator">Check exact age</Link></Button>
          <Button asChild variant="outline" className="h-12 px-5 text-base"><Link href="/jobs">See jobs</Link></Button>
        </div>
      </div>
    </div>
  );
}
