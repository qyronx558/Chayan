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
   <Card className="lg:col-span-2 border-rule dark:border-rule">
    <CardHeader className="bg-paper-2 dark:bg-ink"><CardTitle className="text-[17px] text-foreground dark:text-paper">Your details</CardTitle></CardHeader>
    <CardContent className="space-y-5 p-5">
     <div><Label className="text-[15px]">Birth date</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1.5 h-12 text-base" /></div>
     <div><Label className="text-[15px]">Count age on</Label><Input type="date" value={cutoff} onChange={(e) => setCutoff(e.target.value)} className="mt-1.5 h-12 text-base" />
      <p className="mt-1.5 text-[13px] text-muted-foreground">Use date given in notification.</p></div>
     <div><Label className="text-[15px]">Category</Label>
      <div className="mt-2 flex flex-wrap gap-2">
       {CATEGORIES.map((c) => (
        <button key={c.value} onClick={() => setCategory(c.value)} className={`min-h-[40px] rounded-full border px-4 py-2 text-[13px] font-medium transition ${category === c.value ? "border-rule bg-ink text-paper" : "border-rule bg-background text-muted-foreground hover:border-rule dark:border-ink dark:bg-ink dark:text-muted-foreground"}`}>{c.label}</button>
       ))}
      </div></div>
     <div>
      <button onClick={() => setShowAdvanced((v) => !v)} className="text-[14px] font-semibold text-muted-foreground underline-offset-4 hover:underline dark:text-muted-foreground">
       {showAdvanced ? "Hide extra options" : `Choose exams (${selected.length} selected)`}
      </button>
      {showAdvanced && (
       <div className="mt-3 space-y-4 rounded-xl bg-paper-2 p-4 dark:bg-ink/50">
        <div className="grid grid-cols-2 gap-3">
         <div><Label className="text-[14px]">Min age</Label><Input type="number" value={customMin} onChange={(e) => setCustomMin(+e.target.value)} className="mt-1 h-11 text-base" /></div>
         <div><Label className="text-[14px]">Max age</Label><Input type="number" value={customMax} onChange={(e) => setCustomMax(+e.target.value)} className="mt-1 h-11 text-base" /></div>
        </div>
        <div>
         <p className="text-[14px] font-medium">Exams</p>
         <div className="mt-2 flex flex-wrap gap-2">
          {EXAM_NORMS.map((n) => (
           <button key={n.id} onClick={() => toggle(n.id)} className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-[13px] font-medium transition ${selected.includes(n.id) ? "border-rule bg-paper-2 text-muted-foreground dark:bg-ink dark:text-muted-foreground dark:border-rule" : "border-rule text-muted-foreground dark:border-ink dark:text-muted-foreground"}`}>{n.label}</button>
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
     <div className="bg-paper-2 p-6 dark:bg-ink">
      <p className="text-[13px] font-medium text-muted-foreground dark:text-muted-foreground">Your age</p>
      {age ? (
       <p className="mt-2 text-4xl font-bold tabular-nums text-foreground sm:text-[44px] sm:leading-[1.1] dark:text-paper">{age.years}y <span className="text-muted-foreground dark:text-muted-foreground">{age.months}m</span> <span className="text-3xl text-muted-foreground dark:text-muted-foreground">{age.days}d</span></p>
      ) : <p className="mt-2 text-[15px] text-muted-foreground">Enter birth date and cutoff date.</p>}
     </div>
     <CardContent className="p-0">
      {age && (
       <div className="divide-y divide-rule100 dark:divide-rule800">
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
            <p className="mt-0.5 text-[13px] text-muted-foreground">Age {min}–{maxEff}</p>
           </div>
           {ok ? <StatusPill tone="ok">✓ Yes</StatusPill> : tooYoung ? <StatusPill tone="info">Too young</StatusPill> : <StatusPill tone="bad">Too old</StatusPill>}
          </div>
         );
        })}
       </div>
      )}
     </CardContent>
    </Card>
    <details className="rounded-xl border border-rule bg-paper-2 p-4 text-[13px] leading-relaxed text-muted-foreground dark:border-ink dark:bg-ink dark:text-muted-foreground">
     <summary className="cursor-pointer font-semibold">How is this calculated?</summary>
     <p className="mt-2">Limits follow standard rules. Some notifications change limits by post. Always check the PDF.</p>
    </details>
   </div>
  </div>
 );
}
