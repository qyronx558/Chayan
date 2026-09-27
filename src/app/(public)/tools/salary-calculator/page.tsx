import type { Metadata } from "next";
import { ToolShell } from "@/components/tools/ToolShell";
import SalaryCalculatorClient from "@/components/tools/SalaryCalculatorClient";

export const metadata: Metadata = {
  title: "Sarkari Salary Calculator - 7th Pay In-Hand + 8th Pay Projector",
  description: "Check real in-hand sarkari salary by pay level: basic, DA, HRA, TA, NPS, tax. Plus 8th CPC projector with adjustable fitment factor.",
  keywords: ["7th pay commission salary calculator", "sarkari salary calculator", "8th pay commission fitment", "in-hand salary level 6"],
  alternates: { canonical: "/tools/salary-calculator" },
};

export default function Page() {
  return (
    <ToolShell toolKey="salary" badge="See take-home pay" title="Salary Explorer" subtitle="Choose pay level and city to see monthly take-home pay." faq={[
      { q: "Is 8th CPC salary final?", a: "No. 8th CPC is not notified as of 2026. The projector multiplies 7th CPC basic by your fitment factor (default 1.92x staff-side demand) so you can compare scenarios." },
      { q: "Does in-hand include NPS and tax?", a: "Yes - 10% NPS on Basic+DA, CGHS/CGEGIS, and new-regime income-tax estimate are deducted from gross." },
      { q: "Which level is SSC CGL / SBI PO?", a: "CGL ASO/Inspector posts are typically Level 6-7, AAO Level 8; SBI PO basic maps near Level 7. Confirm post-wise matrix in the notification." },
    ]}>
      <SalaryCalculatorClient />
    </ToolShell>
  );
}
