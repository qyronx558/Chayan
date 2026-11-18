"use client";
import { useMemo, useState } from "react";
import { EXAM_NORMS, CATEGORIES, calcAge } from "@/lib/tools/exam-age-norms";
import { StatusPill } from "@/components/tools/ToolShell";
import { cn } from "@/lib/utils";
import { handFont, typeFont } from "@/components/home/fonts";
import { Sheet, chip, fieldBox, fieldLabel } from "@/components/tools/tool-kit";
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
  <div className="grid items-start gap-6 lg:grid-cols-5">
   <Sheet label="FORM · YOUR DETAILS" aside="fill it like the real one" className="lg:col-span-2">
    <div className="space-y-5 p-5">
     <div><Label className={fieldLabel}>Birth date</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={fieldBox} /></div>
     <div><Label className={fieldLabel}>Count age on</Label><Input type="date" value={cutoff} onChange={(e) => setCutoff(e.target.value)} className={fieldBox} />
      <p className={cn(handFont.className, "mt-1.5 text-[1.02rem] text-[var(--color-brick)]")}>↑ Use date given in notification.</p></div>
     <div><Label className={fieldLabel}>Category</Label>
      <div className="mt-2 flex flex-wrap gap-2">
       {CATEGORIES.map((c) => (
        <button key={c.value} onClick={() => setCategory(c.value)} aria-pressed={category === c.value} className={chip(category === c.value)}>{c.label}</button>
       ))}
      </div></div>
     <div className="border-t border-dashed border-[var(--hs-border-strong)] pt-4">
      <button onClick={() => setShowAdvanced((v) => !v)} aria-expanded={showAdvanced} className={cn(handFont.className, "text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4")}>
       {showAdvanced ? "Hide extra options" : `Choose exams (${selected.length} selected)`}
      </button>
      {showAdvanced && (
       <div className="mt-3 space-y-4 rounded-[8px] border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-surface)] p-4">
        <div className="grid grid-cols-2 gap-3">
         <div><Label className={fieldLabel}>Min age</Label><Input type="number" value={customMin} onChange={(e) => setCustomMin(+e.target.value)} className={cn(fieldBox, "h-11")} /></div>
         <div><Label className={fieldLabel}>Max age</Label><Input type="number" value={customMax} onChange={(e) => setCustomMax(+e.target.value)} className={cn(fieldBox, "h-11")} /></div>
        </div>
        <div>
         <p className={fieldLabel}>Exams</p>
         <div className="mt-2 flex flex-wrap gap-2">
          {EXAM_NORMS.map((n) => (
           <button key={n.id} onClick={() => toggle(n.id)} aria-pressed={selected.includes(n.id)} className={cn(chip(selected.includes(n.id)), "min-h-[34px] px-3 py-1 text-[12.5px]")}>{selected.includes(n.id) ? "✓ " : ""}{n.label}</button>
          ))}
         </div>
         <Button variant="ghost" size="sm" className="mt-2 h-8 rounded-full text-[13px]" onClick={() => setSelected(EXAM_NORMS.map((n) => n.id))}>Select all</Button>
        </div>
       </div>
      )}
     </div>
    </div>
   </Sheet>

   <div className="space-y-5 lg:col-span-3">
    {/* ── the departure board: years, months, days on flaps ── */}
    <div className="rounded-[10px] p-2.5" style={{ background: "oklch(30% 0.02 60)", boxShadow: "0 24px 36px -24px rgb(0 0 0 / .7)" }}>
     <div className="rounded-[6px] px-5 pb-5 pt-4" style={{ background: "oklch(17% 0.01 60)" }}>
      <p className={cn(typeFont.className, "flex items-center justify-between text-[10.5px] font-bold tracking-[0.25em] text-[oklch(82%_0.13_85)]")}>
       <span>YOUR AGE</span>
       <span className="text-[oklch(75%_0.02_80)]">ON {cutoff ? cutoff.split("-").reverse().join(".") : "--"}</span>
      </p>
      {age ? (
       <div className="mt-3 flex flex-wrap items-end gap-4" aria-live="polite" aria-label={`${age.years} years ${age.months} months ${age.days} days`}>
        {([[age.years, "YEARS"], [age.months, "MONTHS"], [age.days, "DAYS"]] as const).map(([v, l]) => (
         <div key={l} className="text-center" aria-hidden>
          <div className="flex gap-1">
           {String(v).padStart(2, "0").split("").map((d, i) => (
            <span key={i} className="relative flex h-[68px] w-[48px] items-center justify-center overflow-hidden rounded-[5px] font-display text-[44px] font-black tabular-nums text-[oklch(96%_0.01_90)] sm:h-[78px] sm:w-[56px] sm:text-[52px]" style={{ background: "linear-gradient(180deg, oklch(30% 0.01 60) 0 50%, oklch(25% 0.01 60) 50% 100%)", boxShadow: "inset 0 1px 0 rgb(255 255 255 / .08), 0 2px 3px rgb(0 0 0 / .5)" }}>
             {d}
             <span className="absolute inset-x-0 top-1/2 h-px bg-black/70" />
            </span>
           ))}
          </div>
          <p className={cn(typeFont.className, "mt-1.5 text-[10px] font-bold tracking-[0.25em] text-[oklch(75%_0.02_80)]")}>{l}</p>
         </div>
        ))}
       </div>
      ) : <p className={cn(handFont.className, "mt-3 text-[1.2rem] text-[oklch(85%_0.02_80)]")}>Enter birth date and cutoff date.</p>}
     </div>
    </div>

    {age && (
     <Sheet label="THE VERDICT, EXAM BY EXAM" aside={`category: ${category}`}>
      <ul>
       {EXAM_NORMS.filter((n) => selected.includes(n.id)).map((n) => {
        const min = n.id === "custom" ? customMin : n.minAge;
        const maxBase = n.id === "custom" ? customMax : n.maxAge;
        const relax = n.id === "custom" ? (category === "UR" || category === "EWS" ? 0 : category === "OBC" ? 3 : category === "PwBD" ? 10 : 5) : (n.relaxations[category] ?? 0);
        const maxEff = maxBase + relax;
        const ok = age.decimalYears >= min - 1e-9 && age.decimalYears < maxEff + 1;
        const tooYoung = age.decimalYears < min;
        return (
         <li key={n.id} className="flex flex-wrap items-center gap-3 border-b border-dashed border-[var(--hs-border)] px-5 py-3.5 last:border-b-0">
          <div className="min-w-0 flex-1">
           <p className="text-[15.5px] font-bold text-foreground">{n.label}</p>
           <p className={cn(typeFont.className, "mt-0.5 text-[12px] text-muted-foreground")}>Age {min}–{maxEff}</p>
          </div>
          {ok ? <StatusPill tone="ok">✓ Yes</StatusPill> : tooYoung ? <StatusPill tone="info">Too young</StatusPill> : <StatusPill tone="bad">Too old</StatusPill>}
         </li>
        );
       })}
      </ul>
     </Sheet>
    )}
    <details className="group rounded-[4px] border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-4 py-3 text-[13.5px] leading-relaxed text-muted-foreground">
     <summary className={cn(handFont.className, "cursor-pointer text-[1.1rem] text-foreground")}>How is this calculated?</summary>
     <p className="mt-2">Limits follow standard rules. Some notifications change limits by post. Always check the PDF.</p>
    </details>
   </div>
  </div>
 );
}
