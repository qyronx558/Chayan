// Universal age norms for major Indian examinations.
// Cutoff = crucial date (usually 1st Jan / 1st July / 1st Aug of exam year or notification last-date).
// Relaxations are standard DoPT norms; exams may vary - UI always shows disclaimer.

export interface ExamNorm {
  id: string;
  label: string;
  short: string;
  minAge: number;
  maxAge: number;
  cutoffRule: string;
  defaultCutoffMonth: number; // 0-indexed
  defaultCutoffDay: number;
  relaxations: Record<string, number>; // category -> extra years
  notes: string;
}

export const CATEGORIES = [
  { value: "UR", label: "General / UR", color: "blue" },
  { value: "EWS", label: "EWS", color: "teal" },
  { value: "OBC", label: "OBC (NCL)", color: "amber" },
  { value: "SC", label: "SC", color: "violet" },
  { value: "ST", label: "ST", color: "emerald" },
  { value: "PwBD", label: "PwBD", color: "rose" },
  { value: "ESM", label: "Ex-Serviceman", color: "slate" },
] as const;

export const EXAM_NORMS: ExamNorm[] = [
  { id: "upsc-cse", label: "UPSC CSE (IAS/IPS)", short: "UPSC", minAge: 21, maxAge: 32, cutoffRule: "1st August of exam year", defaultCutoffMonth: 7, defaultCutoffDay: 1, relaxations: { UR: 0, EWS: 0, OBC: 3, SC: 5, ST: 5, PwBD: 10, ESM: 5 }, notes: "Max 6 attempts UR, 9 OBC, unlimited SC/ST (upto age)." },
  { id: "ssc-cgl", label: "SSC CGL", short: "CGL", minAge: 18, maxAge: 32, cutoffRule: "1st August of exam year (post-wise 18-27/30/32)", defaultCutoffMonth: 7, defaultCutoffDay: 1, relaxations: { UR: 0, EWS: 0, OBC: 3, SC: 5, ST: 5, PwBD: 10, ESM: 3 }, notes: "Age varies by post - JSO/AAO upto 30-32, others 18-27." },
  { id: "ssc-chsl", label: "SSC CHSL (12th)", short: "CHSL", minAge: 18, maxAge: 27, cutoffRule: "1st January of exam year", defaultCutoffMonth: 0, defaultCutoffDay: 1, relaxations: { UR: 0, EWS: 0, OBC: 3, SC: 5, ST: 5, PwBD: 10, ESM: 3 }, notes: "12th pass; LDC/JSA/DEO posts." },
  { id: "ssc-mts", label: "SSC MTS / Havaldar", short: "MTS", minAge: 18, maxAge: 25, cutoffRule: "1st January of exam year", defaultCutoffMonth: 0, defaultCutoffDay: 1, relaxations: { UR: 0, EWS: 0, OBC: 3, SC: 5, ST: 5, PwBD: 10, ESM: 3 }, notes: "10th pass; Havaldar 18-27." },
  { id: "ssc-gd", label: "SSC GD Constable", short: "GD", minAge: 18, maxAge: 23, cutoffRule: "1st January of exam year", defaultCutoffMonth: 0, defaultCutoffDay: 1, relaxations: { UR: 0, EWS: 0, OBC: 3, SC: 5, ST: 5, PwBD: 0, ESM: 3 }, notes: "10th pass; PET/PST after CBT." },
  { id: "ibps-po", label: "IBPS PO / SBI PO", short: "PO", minAge: 20, maxAge: 30, cutoffRule: "1st August (IBPS) / 1st April (SBI)", defaultCutoffMonth: 7, defaultCutoffDay: 1, relaxations: { UR: 0, EWS: 0, OBC: 3, SC: 5, ST: 5, PwBD: 10, ESM: 5 }, notes: "Graduation; SBI PO 21-30." },
  { id: "ibps-clerk", label: "IBPS Clerk / SBI Clerk", short: "Clerk", minAge: 20, maxAge: 28, cutoffRule: "1st July of exam year", defaultCutoffMonth: 6, defaultCutoffDay: 1, relaxations: { UR: 0, EWS: 0, OBC: 3, SC: 5, ST: 5, PwBD: 10, ESM: 9 }, notes: "Graduation; local language test." },
  { id: "rrb-ntpc", label: "Railway RRB NTPC", short: "NTPC", minAge: 18, maxAge: 30, cutoffRule: "1st January (UG 18-30 / Graduate 18-33)", defaultCutoffMonth: 0, defaultCutoffDay: 1, relaxations: { UR: 0, EWS: 0, OBC: 3, SC: 5, ST: 5, PwBD: 10, ESM: 3 }, notes: "12th (UG posts) / Graduate posts differ." },
  { id: "rrb-alp", label: "Railway ALP / Group D", short: "ALP", minAge: 18, maxAge: 30, cutoffRule: "1st July of exam year", defaultCutoffMonth: 6, defaultCutoffDay: 1, relaxations: { UR: 0, EWS: 0, OBC: 3, SC: 5, ST: 5, PwBD: 10, ESM: 3 }, notes: "ITI/Apprenticeship for ALP; 10th for Group D (18-33)." },
  { id: "up-police", label: "UP Police / State Police", short: "Police", minAge: 18, maxAge: 22, cutoffRule: "1st July of exam year", defaultCutoffMonth: 6, defaultCutoffDay: 1, relaxations: { UR: 0, EWS: 0, OBC: 3, SC: 5, ST: 5, PwBD: 0, ESM: 3 }, notes: "Male 18-22, Female 18-25 in UP; varies by state." },
  { id: "ctet", label: "CTET / Teaching (KVS/DSSSB)", short: "TET", minAge: 17, maxAge: 60, cutoffRule: "No upper cap (retirement age)", defaultCutoffMonth: 0, defaultCutoffDay: 1, relaxations: { UR: 0, EWS: 0, OBC: 0, SC: 0, ST: 0, PwBD: 0, ESM: 0 }, notes: "B.Ed/D.El.Ed + graduation; no max age for CTET." },
  { id: "agniveer", label: "Agniveer (Army/Navy/Airforce)", short: "Agniveer", minAge: 17.5, maxAge: 23, cutoffRule: "1st October of rally year", defaultCutoffMonth: 9, defaultCutoffDay: 1, relaxations: { UR: 0, EWS: 0, OBC: 0, SC: 0, ST: 0, PwBD: 0, ESM: 0 }, notes: "17.5-23 years; 10th/12th as per category." },
  { id: "custom", label: "Custom (enter min/max manually)", short: "Custom", minAge: 18, maxAge: 30, cutoffRule: "As per notification", defaultCutoffMonth: 0, defaultCutoffDay: 1, relaxations: { UR: 0, EWS: 0, OBC: 3, SC: 5, ST: 5, PwBD: 10, ESM: 3 }, notes: "Use notification's crucial date for 100% accuracy." },
];

export function calcAge(dob: Date, cutoff: Date) {
  let years = cutoff.getFullYear() - dob.getFullYear();
  let months = cutoff.getMonth() - dob.getMonth();
  let days = cutoff.getDate() - dob.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(cutoff.getFullYear(), cutoff.getMonth(), 0).getDate();
    days += prevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalDays = Math.floor((cutoff.getTime() - dob.getTime()) / 86400000);
  const decimalYears = totalDays / 365.2425;
  return { years, months, days, totalDays, decimalYears };
}
