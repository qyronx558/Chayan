"use client";
import { useMemo, useState } from "react";
import { EXAM_NORMS, CATEGORIES, calcAge } from "@/lib/tools/exam-age-norms";
import { StatusPill } from "@/components/tools/ToolShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AgeCalculatorClient() {
  const [dob, setDob] = useState("2002-08-15");
  const [cutoff, setCutoff] = useState(() => {
    const d = new Date(); d.setMonth(7, 1); return d.toISOString().slice(0, 10);
  });
  const [category, setCategory] = useState("UR");
  const [customMin, setCustomMin] = useState(18);
  const [customMax, setCustomMax] = useState(27);
  const [selected, setSelected] = useState<string[]>(["upsc-cse", "ssc-cgl", "ssc-chsl", "ibps-po", "rrb-ntpc"]);

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
        <CardHeader className="bg-[#e9edf4] dark:bg-[#1c2438]"><CardTitle className="text-base text-slate-800 dark:text-slate-100">Your details</CardTitle></CardHeader>
        <CardContent className="space-y-4 p-5">
          <div><Label>Date of Birth (as per 10th certificate)</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1" /></div>
          <div><Label>Crucial / Cutoff date (from notification)</Label><Input type="date" value={cutoff} onChange={(e) => setCutoff(e.target.value)} className="mt-1" />
            <p className="mt-1 text-xs text-gray-500">Tip: use the notification&apos;s &quot;crucial date&quot;, not today, for 100% accuracy.</p></div>
          <div><Label>Category</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => setCategory(c.value)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${category === c.value ? "border-[#5b6d9e] bg-[#5b6d9e] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#9aa8c4] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}>{c.label}</button>
              ))}
            </div></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Custom min age</Label><Input type="number" value={customMin} onChange={(e) => setCustomMin(+e.target.value)} className="mt-1" /></div>
            <div><Label>Custom max age</Label><Input type="number" value={customMax} onChange={(e) => setCustomMax(+e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label>Exams to check (tap to toggle)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXAM_NORMS.map((n) => (
                <button key={n.id} onClick={() => toggle(n.id)} className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${selected.includes(n.id) ? "border-[#5b6d9e] bg-[#e9edf4] text-[#43547a] dark:bg-[#1c2438] dark:text-[#a9b8d4] dark:border-[#5b6d9e]" : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"}`}>{n.label}</button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs" onClick={() => setSelected(EXAM_NORMS.map((n) => n.id))}>Select all</Button>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-3 space-y-4">
        <Card className="overflow-hidden">
          <div className="bg-[#e9edf4] p-5 dark:bg-[#1c2438]">
            <p className="text-xs font-medium uppercase tracking-widest text-[#6b7fa3] dark:text-[#8fa1c2]">Exact age on cutoff</p>
            {age ? (
              <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
                <p className="text-3xl font-bold tabular-nums text-slate-800 sm:text-4xl dark:text-slate-100">{age.years}y <span className="text-[#5b6d9e] dark:text-[#a9b8d4]">{age.months}m</span> <span className="text-2xl text-slate-500 dark:text-slate-400">{age.days}d</span></p>
                <p className="text-xs text-slate-500 pb-1.5 dark:text-slate-400">{age.totalDays.toLocaleString("en-IN")} days - {age.decimalYears.toFixed(2)} years - DOB {dob} to {cutoff}</p>
              </div>
            ) : <p className="mt-2 text-sm text-slate-500">Enter valid DOB and cutoff date.</p>}
          </div>
          <CardContent className="p-0">
            {age && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {EXAM_NORMS.filter((n) => selected.includes(n.id)).map((n) => {
                  const min = n.id === "custom" ? customMin : n.minAge;
                  const maxBase = n.id === "custom" ? customMax : n.maxAge;
                  const relax = n.id === "custom" ? (category === "UR" || category === "EWS" ? 0 : category === "OBC" ? 3 : category === "PwBD" ? 10 : 5) : (n.relaxations[category] ?? 0);
                  const maxEff = maxBase + relax;
                  const ok = age.decimalYears >= min - 1e-9 && age.decimalYears < maxEff + 1; // upper inclusive till birthday
                  const tooYoung = age.decimalYears < min;
                  return (
                    <div key={n.id} className="flex flex-wrap items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">{n.label}</p>
                        <p className="text-xs text-gray-500">{n.cutoffRule} • Limit {min}–{maxBase}y{relax > 0 && ` +${relax}y ${category}`} = upto {maxEff}y</p>
                        {!ok && <p className="mt-1 text-xs text-gray-500">{n.notes}</p>}
                      </div>
                      {ok ? <StatusPill tone="ok">✓ Eligible</StatusPill> : tooYoung ? <StatusPill tone="info">Underage by {(min - age.decimalYears).toFixed(1)}y</StatusPill> : <StatusPill tone="bad">Overage by {(age.decimalYears - maxEff).toFixed(1)}y</StatusPill>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <span className="font-bold">Accuracy note: </span> limits use DoPT standard norms. Some notifications change cutoff/min-max by post. Always cross-check the PDF - this tool computes exact Y-M-D math (leap-year aware) so date errors are zero.
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">UPSC</Badge><Badge variant="outline">SSC CGL/CHSL/MTS/GD</Badge><Badge variant="outline">IBPS/SBI</Badge><Badge variant="outline">RRB NTPC/ALP</Badge><Badge variant="outline">Police</Badge><Badge variant="outline">Agniveer</Badge><Badge variant="outline">Teaching</Badge>
        </div>
      </div>
    </div>
  );
}
