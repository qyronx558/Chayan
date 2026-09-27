"use client";
import { useMemo, useState } from "react";
import { EXAM_NORMS, CATEGORIES, calcAge } from "@/lib/tools/exam-age-norms";
import { StatusPill } from "@/components/tools/ToolShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AgeCalculatorClient() {
  const [dob, setDob] = useState("2002-08-15");
  const [cutoff, setCutoff] = useState(() => {
    const d = new Date(); d.setMonth(7, 1); return d.toISOString().slice(0, 10);
  });
  const [category, setCategory] = useState("UR");
  const [customMin, setCustomMin] = useState(18);
  const [customMax, setCustomMax] = useState(27);
  const [selected, setSelected] = useState<string[]>(["upsc-cse", "ssc-cgl", "ssc-chsl", "ibps-po", "rrb-ntpc"]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const age = useMemo(() => {
    if (!dob || !cutoff) return null;
    const d = new Date(dob), c = new Date(cutoff);
    if (isNaN(+d) || isNaN(+c) || d > c) return null;
    return calcAge(d, c);
  }, [dob, cutoff]);

  const toggle = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2 border-[#c9d2e4] dark:border-[#2c3a58]">
        <CardHeader className="bg-[#e9edf4] dark:bg-[#1c2438]"><CardTitle className="text-[17px] text-slate-800 dark:text-slate-100">Your details</CardTitle></CardHeader>
        <CardContent className="space-y-5 p-5">
          <div><Label className="text-[15px]">Birth date</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1.5 h-12 text-base" /></div>
          <div><Label className="text-[15px]">Count age on</Label><Input type="date" value={cutoff} onChange={(e) => setCutoff(e.target.value)} className="mt-1.5 h-12 text-base" />
            <p className="mt-1.5 text-[13px] text-gray-500">Use date given in notification.</p></div>
          <div><Label className="text-[15px]">Category</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => setCategory(c.value)} className={`min-h-[40px] rounded-full border px-4 py-2 text-[13px] font-medium transition ${category === c.value ? "border-[#5b6d9e] bg-[#5b6d9e] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#9aa8c4] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}>{c.label}</button>
              ))}
            </div></div>
          <div>
            <button onClick={() => setShowAdvanced((v) => !v)} className="text-[14px] font-semibold text-[#43547a] underline-offset-4 hover:underline dark:text-[#a9b8d4]">
              {showAdvanced ? "Hide extra options" : `Choose exams (${selected.length} selected)`}
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-[14px]">Min age</Label><Input type="number" value={customMin} onChange={(e) => setCustomMin(+e.target.value)} className="mt-1 h-11 text-base" /></div>
                  <div><Label className="text-[14px]">Max age</Label><Input type="number" value={customMax} onChange={(e) => setCustomMax(+e.target.value)} className="mt-1 h-11 text-base" /></div>
                </div>
                <div>
                  <p className="text-[14px] font-medium">Exams</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EXAM_NORMS.map((n) => (
                      <button key={n.id} onClick={() => toggle(n.id)} className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-[13px] font-medium transition ${selected.includes(n.id) ? "border-[#5b6d9e] bg-[#e9edf4] text-[#43547a] dark:bg-[#1c2438] dark:text-[#a9b8d4] dark:border-[#5b6d9e]" : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"}`}>{n.label}</button>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2 h-8 text-[13px]" onClick={() => setSelected(EXAM_NORMS.map((n) => n.id))}>Select all</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-3 space-y-4">
        <Card className="overflow-hidden">
          <div className="bg-[#e9edf4] p-6 dark:bg-[#1c2438]">
            <p className="text-[13px] font-medium uppercase tracking-widest text-[#6b7fa3] dark:text-[#8fa1c2]">Your age</p>
            {age ? (
              <p className="mt-2 text-4xl font-bold tabular-nums text-slate-800 sm:text-[44px] sm:leading-[1.1] dark:text-slate-100">{age.years}y <span className="text-[#5b6d9e] dark:text-[#a9b8d4]">{age.months}m</span> <span className="text-3xl text-slate-500 dark:text-slate-400">{age.days}d</span></p>
            ) : <p className="mt-2 text-[15px] text-slate-500">Enter birth date and cutoff date.</p>}
          </div>
          <CardContent className="p-0">
            {age && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {EXAM_NORMS.filter((n) => selected.includes(n.id)).map((n) => {
                  const min = n.id === "custom" ? customMin : n.minAge;
                  const maxBase = n.id === "custom" ? customMax : n.maxAge;
                  const relax = n.id === "custom" ? (category === "UR" || category === "EWS" ? 0 : category === "OBC" ? 3 : category === "PwBD" ? 10 : 5) : (n.relaxations[category] ?? 0);
                  const maxEff = maxBase + relax;
                  const ok = age.decimalYears >= min - 1e-9 && age.decimalYears < maxEff + 1;
                  const tooYoung = age.decimalYears < min;
                  return (
                    <div key={n.id} className="flex flex-wrap items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold">{n.label}</p>
                        <p className="mt-0.5 text-[13px] text-gray-500">Age {min}–{maxEff}</p>
                      </div>
                      {ok ? <StatusPill tone="ok">✓ Yes</StatusPill> : tooYoung ? <StatusPill tone="info">Too young</StatusPill> : <StatusPill tone="bad">Too old</StatusPill>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <summary className="cursor-pointer font-semibold">How is this calculated?</summary>
          <p className="mt-2">Limits follow standard rules. Some notifications change limits by post. Always check the PDF.</p>
        </details>
      </div>
    </div>
  );
}
