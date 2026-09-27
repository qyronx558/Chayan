import type { Metadata } from "next";
import { ToolShell } from "@/components/tools/ToolShell";
import AgeCalculatorClient from "@/components/tools/AgeCalculatorClient";

export const metadata: Metadata = {
  title: "Universal Age Calculator for Govt Exams - UPSC SSC Railway Bank Police",
  description: "Calculate exact age in years-months-days on any cutoff date. Check eligibility for UPSC, SSC CGL/CHSL/MTS/GD, IBPS, SBI, RRB NTPC, Police, Agniveer with category-wise relaxation.",
  keywords: ["age calculator", "sarkari age calculator", "ssc age limit calculator", "upsc age calculator", "railway age relaxation"],
  alternates: { canonical: "/tools/age-calculator" },
};

export default function Page() {
  return (
    <ToolShell toolKey="age" badge="Free • No signup" title="Age Calculator" subtitle="Enter birth date and cutoff date to see your exact age." faq={[
      { q: "Which date should I enter as cutoff?", a: "Use the notification's 'crucial date for age' (often 01-01, 01-07 or 01-08 of exam year). Using today's date gives wrong results." },
      { q: "Is OBC/SC/ST relaxation included?", a: "Yes - standard 3y OBC, 5y SC/ST, 10y PwBD applied on top of base max age. ESM/PwBD sub-rules vary; check PDF for combined relaxations." },
      { q: "Why does SSC CGL show 18-32 but posts differ?", a: "CGL has post-wise limits (e.g., JSO 18-32, others 18-27). We show the widest band; confirm your post's row in the PDF." },
    ]}>
      <AgeCalculatorClient />
    </ToolShell>
  );
}
