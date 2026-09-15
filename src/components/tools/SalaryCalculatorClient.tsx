"use client";
import { useMemo, useState } from "react";
import { PAY_MATRIX_7, calcSalary, inr } from "@/lib/tools/pay-matrix";
import { StatusPill } from "@/components/tools/ToolShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SalaryCalculatorClient() {
  const [level, setLevel] = useState(6);
  const [city, setCity] = useState<"X" | "Y" | "Z">("Y");
  const [daPct, setDaPct] = useState(58);
  const [fitment, setFitment] = useState(1.92);
  const [mode, setMode] = useState<"7th" | "8th">("7th");

  const base = PAY_MATRIX_7.find((p) => p.level === level)!;
  const basic = mode === "7th" ? base.basic7 : Math.round(base.basic7 * fitment / 100) * 100;
  const s = useMemo(() => calcSalary({ basic, daPct: mode === "7th" ? daPct : 0, cityClass: city }), [basic, daPct, city, mode]);

  const rows: [string, number, string][] = [
    ["Basic Pay", s.basic, "font-bold text-gray-900 dark:text-white"],
    [`Dearness Allowance (${mode === "7th" ? daPct : 0}%)`, s.da, ""],
    [`HRA (${city} city)`, s.hra, ""],
    ["Transport Allowance + DA", s.ta, ""],
    ["Gross / CTC monthly", s.gross, "font-semibold text-slate-800 dark:text-slate-200"],
    ["NPS (10% of Basic+DA)", -s.nps, "text-slate-500"],
    ["CGHS + CGEGIS", -(s.cghs + s.cgegis), "text-slate-500"],
    ["Income tax (est./mo)", -s.incomeTaxMonthly, "text-slate-500"],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2 border-[#c2d8cf] dark:border-[#24473d]">
        <CardHeader className="bg-[#e7f0ec] dark:bg-[#17281f]">
          <CardTitle className="text-base text-slate-800 dark:text-slate-100">Pay options</CardTitle>
          <div className="mt-2 flex gap-2">
            {(["7th", "8th"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${mode === m ? "bg-[#4f8577] text-white" : "bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700"}`}>{m === "7th" ? "7th CPC (actual)" : "8th CPC (projected)"}</button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div><Label>Pay Level (1–18)</Label>
            <div className="mt-2 grid grid-cols-6 gap-1.5">
              {PAY_MATRIX_7.map((p) => (
                <button key={p.level} onClick={() => setLevel(p.level)} className={`rounded-lg border py-1.5 text-xs font-medium tabular-nums transition ${level === p.level ? "border-[#4f8577] bg-[#4f8577] text-white" : "border-slate-200 hover:border-[#93bfae] dark:border-slate-700"}`}>L{p.level}</button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500"><span className="font-semibold text-gray-700 dark:text-gray-300">L{base.level}:</span> {base.posts} • Grade pay {base.gradePay}</p>
          </div>
          <div><Label>Posting city</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["X", "Y", "Z"] as const).map((c) => (
                <button key={c} onClick={() => setCity(c)} className={`rounded-xl border p-2.5 text-left transition ${city === c ? "border-[#4f8577] bg-[#e7f0ec] dark:bg-[#17281f] dark:border-[#4f8577]" : "border-slate-200 dark:border-slate-700"}`}>
                  <p className="text-sm font-bold">Class {c}</p>
                  <p className="text-[11px] text-gray-500">{c === "X" ? "Delhi, Mumbai… HRA 27%" : c === "Y" ? "Lucknow, Jaipur… HRA 18%" : "Others… HRA 9%"}</p>
                </button>
              ))}
            </div></div>
          {mode === "7th" ? (
            <div><Label>DA % (current ~58%)</Label><Input type="number" value={daPct} onChange={(e) => setDaPct(+e.target.value)} className="mt-1" /></div>
          ) : (
            <div><Label>8th CPC fitment factor: {fitment.toFixed(2)}x</Label>
              <input type="range" min={1.5} max={2.5} step={0.01} value={fitment} onChange={(e) => setFitment(+e.target.value)} className="mt-2 w-full accent-[#4f8577]" />
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Projected only - 8th CPC not notified. Staff-side demand 1.92x; adjust to compare scenarios.</p></div>
          )}
        </CardContent>
      </Card>

      <div className="lg:col-span-3 space-y-4">
        <Card className="overflow-hidden">
          <div className="bg-[#e7f0ec] p-5 dark:bg-[#17281f]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-[#5c7f74] dark:text-[#7fa897]">Estimated in-hand - Level {level} - {mode} CPC</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-slate-800 sm:text-4xl dark:text-slate-100">{inr(s.net)}<span className="text-base font-medium text-slate-500">/mo</span></p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Gross {inr(s.gross)} - Annual in-hand approx {inr(s.net * 12)}</p>
              </div>
              <StatusPill tone={mode === "7th" ? "ok" : "warn"}>{mode === "7th" ? "Notified rates" : "Projected - not official"}</StatusPill>
            </div>
          </div>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                {rows.map(([k, v, cls]) => (
                  <tr key={k} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{k}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${cls} ${v < 0 ? "" : ""}`}>{v < 0 ? "− " + inr(-v) : inr(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          {[{ l: "Basic", v: inr(s.basic) }, { l: "Gross", v: inr(s.gross) }, { l: "Annual", v: inr(s.net * 12) }].map((c) => (
            <div key={c.l} className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{c.l}</p>
              <p className="text-sm font-extrabold tabular-nums">{c.v}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500">Includes NPS (10%), CGHS/CGEGIS, new-regime tax estimate with rebate. Excludes overtime, night duty, uniform & special allowances (vary by post).</p>
      </div>
    </div>
  );
}
