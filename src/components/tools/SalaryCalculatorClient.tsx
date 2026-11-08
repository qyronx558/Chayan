"use client";
import { useMemo, useState } from "react";
import { PAY_MATRIX_7, calcSalary, inr } from "@/lib/tools/pay-matrix";
import { StatusPill } from "@/components/tools/ToolShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

 return (
  <div className="grid gap-4 lg:grid-cols-5">
   <Card className="lg:col-span-2 border-rule dark:border-rule">
    <CardHeader className="bg-paper-2 dark:bg-ink">
     <CardTitle className="text-[17px] text-foreground dark:text-paper">Your pay</CardTitle>
     <div className="mt-2 flex gap-2">
      {(["7th", "8th"] as const).map((m) => (
       <button key={m} onClick={() => setMode(m)} className={`min-h-[40px] rounded-full px-4 py-2 text-[13px] font-medium transition ${mode === m ? "bg-ink text-paper" : "bg-background border border-rule text-muted-foreground dark:bg-ink dark:text-muted-foreground dark:border-ink"}`}>{m === "7th" ? "Current" : "8th Pay idea"}</button>
      ))}
     </div>
    </CardHeader>
    <CardContent className="space-y-5 p-5">
     <div>
      <Label className="text-[15px]">Pay level</Label>
      <select value={level} onChange={(e) => setLevel(+e.target.value)} className="mt-1.5 h-12 w-full rounded-md border border-rule bg-background px-3 text-base dark:border-ink dark:bg-ink">
       {PAY_MATRIX_7.map((p) => (
        <option key={p.level} value={p.level}>Level {p.level} - {inr(p.basic7)}</option>
       ))}
      </select>
      <p className="mt-1.5 text-[13px] text-muted-foreground">Most CGL, SI posts are Level 6–7.</p>
     </div>
     <div><Label className="text-[15px]">City</Label>
      <div className="mt-2 grid grid-cols-3 gap-2">
       {(["X", "Y", "Z"] as const).map((c) => (
        <button key={c} onClick={() => setCity(c)} className={`min-h-[64px] rounded-xl border p-2.5 text-left transition ${city === c ? "border-rule bg-paper-2 dark:bg-ink dark:border-rule" : "border-rule dark:border-ink"}`}>
         <p className="text-[15px] font-bold">{CITY_LABEL[c].title}</p>
         <p className="mt-0.5 text-[13px] text-muted-foreground">{CITY_LABEL[c].sub}</p>
        </button>
       ))}
      </div></div>
     {mode === "7th" ? (
      <div><Label className="text-[15px]">DA %</Label><Input type="number" value={daPct} onChange={(e) => setDaPct(+e.target.value)} className="mt-1.5 h-12 text-base" /></div>
     ) : (
      <div><Label className="text-[15px]">Expected hike: {fitment.toFixed(2)}x</Label>
       <input type="range" min={1.5} max={2.5} step={0.01} value={fitment} onChange={(e) => setFitment(+e.target.value)} className="mt-2 w-full accent-[var(--color-brick)]" />
       <p className="mt-1 text-[13px] text-muted-foreground dark:text-muted-foreground">Estimate only - not official yet.</p></div>
     )}
    </CardContent>
   </Card>

   <div className="lg:col-span-3 space-y-4">
    <Card className="overflow-hidden">
     <div className="bg-paper-2 p-6 dark:bg-ink">
      <div className="flex flex-wrap items-center justify-between gap-3">
       <div>
        <p className="text-[13px] font-medium text-muted-foreground dark:text-muted-foreground">Take-home per month</p>
        <p className="mt-1 text-4xl font-bold tabular-nums text-foreground sm:text-[44px] sm:leading-[1.1] dark:text-paper">{inr(s.net)}<span className="text-base font-medium text-muted-foreground">/mo</span></p>
        <p className="mt-1 text-[13px] text-muted-foreground dark:text-muted-foreground">Yearly take-home about {inr(s.net * 12)}</p>
       </div>
       <StatusPill tone={mode === "7th" ? "ok" : "warn"}>{mode === "7th" ? "Actual" : "Estimate"}</StatusPill>
      </div>
     </div>
     <CardContent className="p-0">
      <table className="w-full text-[15px]">
       <tbody>
        {rows.map(([k, v]) => (
         <tr key={k} className="border-b border-rule last:border-0 dark:border-ink">
          <td className="px-4 py-3 text-muted-foreground dark:text-muted-foreground">{k}</td>
          <td className="px-4 py-3 text-right font-semibold tabular-nums">{v < 0 ? "− " + inr(-v) : inr(v)}</td>
         </tr>
        ))}
       </tbody>
      </table>
     </CardContent>
    </Card>
    <details className="rounded-xl border border-rule bg-paper-2 p-4 text-[13px] leading-relaxed text-muted-foreground dark:border-ink dark:bg-ink dark:text-muted-foreground">
     <summary className="cursor-pointer font-semibold">What is cut from salary?</summary>
     <p className="mt-2">Retirement, medical and tax are already cut above. Overtime and special allowances are extra.</p>
    </details>
   </div>
  </div>
 );
}
