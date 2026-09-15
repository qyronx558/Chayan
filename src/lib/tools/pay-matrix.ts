// 7th CPC pay matrix (Level 1-18, first cell) + 8th CPC projector.
// Sources: 7th CPC Gazette. 8th CPC fitment is NOT notified (as of 2026) -
// projector uses user-adjustable fitment factor (default 1.92 per staff-side demand).

export interface PayLevel { level: number; basic7: number; gradePay: string; posts: string; }

export const PAY_MATRIX_7: PayLevel[] = [
  { level: 1, basic7: 18000, gradePay: "1800", posts: "MTS, Group D, Constable entry" },
  { level: 2, basic7: 19900, gradePay: "1900", posts: "LDC, Junior Clerk" },
  { level: 3, basic7: 21700, gradePay: "2000", posts: "Constable, CHSL LDC" },
  { level: 4, basic7: 25500, gradePay: "2400", posts: "Steno D, JSA, ALP" },
  { level: 5, basic7: 29200, gradePay: "2800", posts: "UDC, NTPC Clerk, CGL Auditor" },
  { level: 6, basic7: 35400, gradePay: "4200", posts: "CGL ASO, SI, JE, SBI Clerk officer-track" },
  { level: 7, basic7: 44900, gradePay: "4600", posts: "CGL Inspector, PO scale-I equiv." },
  { level: 8, basic7: 47600, gradePay: "4800", posts: "AAO, Section Officer" },
  { level: 9, basic7: 53100, gradePay: "5400", posts: "Gazetted Gr-B, DANICS entry" },
  { level: 10, basic7: 56100, gradePay: "5400 (PB-3)", posts: "SDM/BDO via PCS, Asst. Commandant" },
  { level: 11, basic7: 67700, gradePay: "6600", posts: "Sr. AO, DSP promotee" },
  { level: 12, basic7: 78800, gradePay: "7600", posts: "Under Secretary, SP" },
  { level: 13, basic7: 123100, gradePay: "8700", posts: "Director, DM (Sr. scale IAS)" },
  { level: 14, basic7: 144200, gradePay: "10000", posts: "IG, Commissioner" },
  { level: 15, basic7: 182200, gradePay: "HAG", posts: "Principal Secretary, ADG" },
  { level: 16, basic7: 205400, gradePay: "HAG+", posts: "Addl. Chief Secretary" },
  { level: 17, basic7: 225000, gradePay: "Apex", posts: "Chief Secretary, DGP" },
  { level: 18, basic7: 250000, gradePay: "Cabinet Sec.", posts: "Cabinet Secretary" },
];

export interface SalaryBreakup {
  basic: number; da: number; hra: number; ta: number;
  gross: number; nps: number; cghs: number; cgegis: number;
  incomeTaxMonthly: number; net: number;
}

export function calcSalary(opts: {
  basic: number; daPct: number; cityClass: "X" | "Y" | "Z";
  taBase?: number; npsPct?: number;
}): SalaryBreakup {
  const { basic, daPct, cityClass, taBase = 3600, npsPct = 10 } = opts;
  const hraPct = cityClass === "X" ? 27 : cityClass === "Y" ? 18 : 9;
  const da = Math.round((basic * daPct) / 100);
  const hra = Math.round((basic * hraPct) / 100);
  const ta = Math.round(taBase * (1 + daPct / 100));
  const gross = basic + da + hra + ta;
  const nps = Math.round(((basic + da) * npsPct) / 100);
  const cghs = basic >= 56100 ? 650 : basic >= 46100 ? 325 : 250;
  const cgegis = basic >= 56100 ? 120 : 60;
  // New-regime FY2025-26 approx slab monthly estimate (0-12L rebate): simplified
  const annual = gross * 12;
  let annualTax = 0;
  const std = 75000;
  const taxable = Math.max(0, annual - std);
  const slabs: [number, number][] = [[400000, 0], [800000, 0.05], [1200000, 0.1], [1600000, 0.15], [2000000, 0.2], [2400000, 0.25], [Infinity, 0.3]];
  let prev = 0;
  for (const [cap, rate] of slabs) {
    if (taxable <= prev) break;
    annualTax += (Math.min(taxable, cap) - prev) * rate;
    prev = cap;
  }
  if (taxable <= 1200000) annualTax = 0; // rebate 87A
  const incomeTaxMonthly = Math.round(annualTax / 12);
  const net = gross - nps - cghs - cgegis - incomeTaxMonthly;
  return { basic, da, hra, ta, gross, nps, cghs, cgegis, incomeTaxMonthly, net };
}

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
