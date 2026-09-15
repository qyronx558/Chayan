import type { Metadata } from "next";
import { ToolShell } from "@/components/tools/ToolShell";
import EligibilityCheckerClient from "@/components/tools/EligibilityCheckerClient";

export const metadata: Metadata = {
  title: "Am I Eligible? - Govt Exam Eligibility Checker by Age, Qualification",
  description: "Enter DOB, category and qualification to instantly see which exams you can apply for: UPSC, SSC CGL/CHSL/MTS/GD, IBPS, SBI, RRB, Police, Teaching, Agniveer.",
  keywords: ["am i eligible ssc", "eligibility checker sarkari", "ssc gd age limit obc", "upsc eligibility age"],
  alternates: { canonical: "/tools/eligibility-checker" },
};

export default function Page() {
  return (
    <ToolShell toolKey="eligibility" badge="Age + qualification + category" title="Eligibility Checker - Am I Eligible?" subtitle="One profile, every exam family. Combines exact age math with qualification mapping and category relaxation - then tells you where to apply next." faq={[
      { q: "How accurate is this?", a: "Age math is exact; qualification mapping uses standard norms (e.g., Graduate unlocks CGL/PO/NTPC). Post-wise exceptions exist - confirm in the PDF." },
      { q: "Does it cover state exams?", a: "Core families (UPSC/SSC/Bank/Railway/Police/Teaching/Agniveer) are covered. State PSC limits are similar to UPSC with local reservation - use Custom mode with notification values." },
    ]}>
      <EligibilityCheckerClient />
    </ToolShell>
  );
}
