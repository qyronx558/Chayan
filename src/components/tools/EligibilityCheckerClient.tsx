"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { EXAM_NORMS, CATEGORIES, calcAge } from "@/lib/tools/exam-age-norms";
import { StatusPill } from "@/components/tools/ToolShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const QUALS = ["10th Pass", "12th Pass", "ITI", "Diploma", "Graduate", "Post Graduate", "B.Ed", "Engineering", "Medical", "Law"];

const QUAL_MAP: Record<string, string[]> = {
  "10th Pass": ["ssc-mts", "ssc-gd", "rrb-alp", "agniveer"],
  "12th Pass": ["ssc-mts", "ssc-gd", "ssc-chsl", "rrb-ntpc", "rrb-alp", "agniveer", "up-police"],
  ITI: ["ssc-mts", "rrb-alp", "agniveer"],
  Diploma: ["ssc-chsl", "ssc-mts", "rrb-alp", "rrb-ntpc"],
  Graduate: ["upsc-cse", "ssc-cgl", "ssc-chsl", "ssc-mts", "ibps-po", "ibps-clerk", "rrb-ntpc", "up-police", "ctet"],
  "Post Graduate": ["upsc-cse", "ssc-cgl", "ibps-po", "ibps-clerk", "rrb-ntpc", "ctet"],
  "B.Ed": ["ctet", "ssc-cgl"],
  Engineering: ["upsc-cse", "ssc-cgl", "ibps-po", "rrb-ntpc", "rrb-alp"],
  Medical: ["upsc-cse", "ssc-cgl", "ibps-po"],
  Law: ["upsc-cse", "ssc-cgl", "ibps-po"],
};

export default function EligibilityCheckerClient() {
  const [dob, setDob] = useState("2001-05-10");
  const [category, setCategory] = useState("OBC");
  const [qual, setQual] = useState("Graduate");
  const [state, setState] = useState("Uttar Pradesh");

  const result = useMemo(() => {
    const cutoff = new Date(new Date().getFullYear(), 7, 1);
    const age = calcAge(new Date(dob), cutoff);
    return EXAM_NORMS.map((n) => {
      const relax = n.relaxations[category] ?? 0;
      const maxEff = n.maxAge + relax;
      const ageOk = age.decimalYears >= n.minAge && age.decimalYears < maxEff + 1;
      const qualOk = (QUAL_MAP[qual] ?? []).includes(n.id) || n.id === "custom";
      return { norm: n, relax, maxEff, ageOk, qualOk, eligible: ageOk && qualOk, age };
    });
  }, [dob, category, qual]);

  const eligible = result.filter((r) => r.eligible);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2 border-[#c3d4e2] dark:border-[#27445c]">
        <CardHeader className="bg-[#e7eef4] dark:bg-[#16232f]"><CardTitle className="text-base text-slate-800 dark:text-slate-100">Your profile</CardTitle></CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>DOB</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1" /></div>
            <div><Label>State</Label><Input value={state} onChange={(e) => setState(e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label>Category</Label>
            <div className="mt-2 flex flex-wrap gap-2">{CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => setCategory(c.value)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${category === c.value ? "border-[#4a7396] bg-[#4a7396] text-white" : "border-slate-200 dark:border-slate-700"}`}>{c.label}</button>
            ))}</div></div>
          <div><Label>Highest qualification</Label>
            <div className="mt-2 flex flex-wrap gap-2">{QUALS.map((q) => (
              <button key={q} onClick={() => setQual(q)} className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${qual === q ? "border-[#4a7396] bg-[#e7eef4] text-[#33506b] dark:bg-[#16232f] dark:text-[#93b4cc] dark:border-[#4a7396]" : "border-slate-200 text-slate-500 dark:border-slate-700"}`}>{q}</button>
            ))}</div></div>
          <div className="rounded-xl bg-[#e7eef4] p-3 text-xs text-[#3a607e] dark:bg-[#16232f] dark:text-[#93b4cc]">
            Checking age as on 1st Aug {new Date().getFullYear()} with {category} relaxation • {state}
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-3 space-y-4">
        <Card className="overflow-hidden">
          <div className="bg-[#e7eef4] p-5 dark:bg-[#16232f]">
            <p className="text-xs font-medium uppercase tracking-widest text-[#5b7f9c] dark:text-[#7d9cb8]">You are eligible for</p>
            <p className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">{eligible.length} exam families</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Age {result[0]?.age.years}y {result[0]?.age.months}m - {qual} - {category}</p>
          </div>
          <CardContent className="divide-y divide-gray-100 p-0 dark:divide-gray-800">
            {result.map(({ norm, relax, maxEff, ageOk, qualOk, eligible: ok }) => (
              <div key={norm.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{norm.label}</p>
                  <p className="text-xs text-gray-500">{norm.minAge}–{norm.maxAge}y{relax > 0 && ` +${relax}y`} → upto {maxEff}y • {norm.notes}</p>
                  {!ok && <p className="mt-0.5 text-[11px] font-medium text-gray-400">{!ageOk ? "✗ Age criteria not met" : "✗ Qualification not matched"}</p>}
                </div>
                {ok ? <StatusPill tone="ok">✓ Apply</StatusPill> : !ageOk && qualOk ? <StatusPill tone="bad">Age bar</StatusPill> : ageOk && !qualOk ? <StatusPill tone="info">Need higher qual.</StatusPill> : <StatusPill tone="warn">Not yet</StatusPill>}
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-[#4a7396] hover:bg-[#3c5f7c]"><Link href="/tools/age-calculator">Verify exact age</Link></Button>
          <Button asChild variant="outline"><Link href="/jobs">Browse matching jobs</Link></Button>
        </div>
      </div>
    </div>
  );
}
