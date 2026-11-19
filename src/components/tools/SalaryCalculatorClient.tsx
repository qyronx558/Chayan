"use client";
import { useMemo, useState } from "react";
import { PAY_MATRIX_7, calcSalary, inr } from "@/lib/tools/pay-matrix";
import { StatusPill } from "@/components/tools/ToolShell";
import { cn } from "@/lib/utils";
import { handFont, typeFont } from "@/components/home/fonts";
import { Sheet, chip, fieldBox, fieldLabel, tile } from "@/components/tools/tool-kit";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const CITY_LABEL: Record<"X" | "Y" | "Z", { title: string; sub: string }> = {
 X: { title: "Big city", sub: "e.g. Delhi • More rent" },
 Y: { title: "Medium city", sub: "e.g. Lucknow • Mid rent" },
 Z: { title: "Small town", sub: "Others • Less rent" },
};

export default function SalaryCalculatorClient() {
 const [level, setLevel] = useState(6);
 const [city, setCity] = useState<"X" | "Y" | "Z">("Y");
 const [daPct, setDaPct] = useState(58);
 const [fitment, setFitment] = useState(1.92);
 const [mode, setMode] = useState<"7th" | "8th">("7th");

 const base = PAY_MATRIX_7.find((p) => p.level === level)!;
 const basic = mode === "7th" ? base.basic7 : Math.round(base.basic7 * fitment / 100) * 100;
 const s = useMemo(() => calcSalary({ basic, daPct: mode === "7th" ? daPct : 0, cityClass: city }), [basic, daPct, city, mode]);

 const rows: [string, number][] = [
  ["Basic", s.basic],
  ["Living cost", s.da],
  ["House rent", s.hra],
  ["Travel", s.ta],
  ["Total salary", s.gross],
  ["Retirement cut", -s.nps],
  ["Medical + insurance", -(s.cghs + s.cgegis)],
  ["Tax (approx)", -s.incomeTaxMonthly],
 ];

 // display only: the same rows, laid out the way a pay slip prints them
 // a cut that comes to zero arrives as -0: still a deduction, shown as "− ₹0"
 const isCut = (v: number) => v < 0 || Object.is(v, -0);
 const earnings = rows.filter(([k, v]) => !isCut(v) && k !== "Total salary");
 const deductions = rows.filter(([, v]) => isCut(v));
 const gross = rows.find(([k]) => k === "Total salary");

 return (
  <div className="grid items-start gap-6 lg:grid-cols-5">
   <Sheet label="FORM · YOUR PAY" className="lg:col-span-2">
    <div className="space-y-5 p-5">
     <div className="flex gap-2" role="group" aria-label="Pay commission">
      {(["7th", "8th"] as const).map((m) => (
       <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={chip(mode === m)}>{m === "7th" ? "Current" : "8th Pay idea"}</button>
      ))}
     </div>
     <div>
      <Label className={fieldLabel}>Pay level</Label>
      <select value={level} onChange={(e) => setLevel(+e.target.value)} className="mt-1.5 h-12 w-full rounded-[10px] border-[1.5px] border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-3 text-base text-foreground focus:border-foreground/60 focus:outline-none focus:ring-4 focus:ring-[color-mix(in_oklch,var(--color-brick)_14%,transparent)]">
       {PAY_MATRIX_7.map((p) => (
        <option key={p.level} value={p.level}>Level {p.level} - {inr(p.basic7)}</option>
       ))}
      </select>
      <p className={cn(handFont.className, "mt-1.5 text-[1.02rem] text-muted-foreground")}>Most CGL, SI posts are Level 6–7.</p>
     </div>
     <div><Label className={fieldLabel}>City</Label>
      <div className="mt-2 grid grid-cols-3 gap-2">
       {(["X", "Y", "Z"] as const).map((c) => (
        <button key={c} onClick={() => setCity(c)} aria-pressed={city === c} className={cn(tile(city === c), "min-h-[72px] p-2.5")}>
         <span className={cn(typeFont.className, "absolute right-2 top-1.5 text-[10px] font-bold opacity-50")}>{c}</span>
         <p className="text-[14.5px] font-bold text-foreground">{CITY_LABEL[c].title}</p>
         <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{CITY_LABEL[c].sub}</p>
        </button>
       ))}
      </div></div>
     {mode === "7th" ? (
      <div><Label className={fieldLabel}>DA %</Label><Input type="number" value={daPct} onChange={(e) => setDaPct(+e.target.value)} className={fieldBox} /></div>
     ) : (
      <div><Label className={fieldLabel}>Expected hike: {fitment.toFixed(2)}x</Label>
       <input type="range" min={1.5} max={2.5} step={0.01} value={fitment} onChange={(e) => setFitment(+e.target.value)} className="mt-3 w-full accent-[var(--color-brick)]" />
       <p className={cn(handFont.className, "mt-1 text-[1.02rem] text-[var(--color-brick)]")}>Estimate only - not official yet.</p></div>
     )}
    </div>
   </Sheet>

   <div className="space-y-5 lg:col-span-3">
    {/* ── the pay slip ── */}
    <div className="relative">
     <div className="rounded-t-[4px] px-6 pb-8 pt-5 text-[oklch(27%_0.03_60)] sm:px-8" style={{ background: "oklch(98% 0.008 90)", boxShadow: "0 1px 2px rgb(60 40 10 / .1), 0 22px 34px -24px rgb(60 40 10 / .6)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-double border-[oklch(27%_0.03_60/0.4)] pb-3">
       <div>
        <p className={cn(typeFont.className, "text-[12px] font-bold tracking-[0.3em]")}>PAY SLIP</p>
        <p className={cn(typeFont.className, "mt-0.5 text-[11px] opacity-70")}>LEVEL {level} · {CITY_LABEL[city].title.toUpperCase()} · {mode === "7th" ? "7TH CPC" : `8TH CPC × ${fitment.toFixed(2)}`}</p>
       </div>
       <StatusPill tone={mode === "7th" ? "ok" : "warn"}>{mode === "7th" ? "Actual" : "Estimate"}</StatusPill>
      </div>

      <div className="grid gap-x-8 sm:grid-cols-2">
       <div>
        <p className={cn(typeFont.className, "mt-4 text-[10.5px] font-bold tracking-[0.2em] opacity-60")}>EARNINGS</p>
        <table className="mt-1 w-full text-[14.5px]">
         <tbody>
          {earnings.map(([k, v]) => (
           <tr key={k} className="border-b border-dotted border-[oklch(27%_0.03_60/0.25)]">
            <td className="py-2">{k}</td>
            <td className={cn(typeFont.className, "py-2 text-right font-bold tabular-nums")}>{inr(v)}</td>
           </tr>
          ))}
          {gross ? (
           <tr>
            <td className="pt-2.5 font-semibold">{gross[0]}</td>
            <td className={cn(typeFont.className, "pt-2.5 text-right font-bold tabular-nums")}>{inr(gross[1])}</td>
           </tr>
          ) : null}
         </tbody>
        </table>
       </div>
       <div>
        <p className={cn(typeFont.className, "mt-4 text-[10.5px] font-bold tracking-[0.2em] opacity-60")}>DEDUCTIONS</p>
        <table className="mt-1 w-full text-[14.5px]">
         <tbody>
          {deductions.map(([k, v]) => (
           <tr key={k} className="border-b border-dotted border-[oklch(27%_0.03_60/0.25)]">
            <td className="py-2">{k}</td>
            <td className={cn(typeFont.className, "py-2 text-right font-bold tabular-nums text-[oklch(48%_0.17_28)]")}>− {inr(-v)}</td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 rounded-[4px] border-2 border-[oklch(27%_0.03_60)] px-4 py-3">
       <div>
        <p className={cn(typeFont.className, "text-[10.5px] font-bold tracking-[0.25em]")}>NET PAY · TAKE-HOME PER MONTH</p>
        <p className="mt-1 font-display text-[2.2rem] font-black leading-none tabular-nums sm:text-[2.6rem]">{inr(s.net)}<span className="text-base font-medium opacity-60">/mo</span></p>
       </div>
       <p className={cn(handFont.className, "text-[1.1rem]")}>Yearly take-home about {inr(s.net * 12)}</p>
      </div>
     </div>
     {/* torn bottom edge */}
     <div className="h-3" style={{ background: "linear-gradient(-45deg, transparent 6px, oklch(98% 0.008 90) 0) 0 0 / 12px 12px repeat-x, linear-gradient(45deg, transparent 6px, oklch(98% 0.008 90) 0) 0 0 / 12px 12px repeat-x" }} aria-hidden />
    </div>
    <details className="rounded-[4px] border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-4 py-3 text-[13.5px] leading-relaxed text-muted-foreground">
     <summary className={cn(handFont.className, "cursor-pointer text-[1.1rem] text-foreground")}>What is cut from salary?</summary>
     <p className="mt-2">Retirement, medical and tax are already cut above. Overtime and special allowances are extra.</p>
    </details>
   </div>
  </div>
 );
}
