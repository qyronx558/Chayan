import type { LlmExtraction } from "@/lib/ingest/schema"

/** A realistic district notice (text layer of the PDF). */
export const NOTICE_TEXT = `
जिला स्वास्थ्य समिति, पटना
District Health Society, Patna
Advertisement No. DHS/PAT/12/2026                 Date: 10/11/2026
Applications are invited for engagement on contract basis for the following posts.
Name of Post: Staff Nurse (GNM)   No. of Posts: 25 (UR-10, EWS-3, BC-4, EBC-5, SC-3)
Remuneration: Rs. 20,000/- per month (consolidated)
Educational Qualification: GNM / B.Sc Nursing from a recognised institute and registration with Bihar Nurses Registration Council.
Age Limit: 21 to 37 years as on 01/01/2026. Relaxation as per Government of Bihar rules.
Selection: Merit based on marks in qualifying examination followed by document verification.
Application Fee: No fee.
How to apply: Download the form from https://patna.nic.in and send it by registered post to the District Health Society, Patna.
Last date for receipt of application: 30/11/2026 till 5:00 PM.
Important Dates: Start of application 12/11/2026, Last date 30/11/2026
`

export function extraction(over: Partial<LlmExtraction> = {}): LlmExtraction {
  return {
    kind: "jobs",
    title: "District Health Society Patna Staff Nurse Recruitment 2026",
    department: "District Health Society, Patna",
    category: "Medical",
    summary:
      "The District Health Society in Patna is hiring 25 Staff Nurses (GNM) on a contract basis for public health facilities in the district. Candidates need a GNM diploma or B.Sc Nursing and registration with the state nursing council, and must be between 21 and 37 years old. Shortlisting is merit-based, there is no application fee, and completed forms must reach the society by post before the end of November 2026.",
    advertisementNo: "DHS/PAT/12/2026",
    totalVacancies: 25,
    salary: "Rs. 20,000 per month (consolidated)",
    ageLimit: "21 to 37 years as on 01/01/2026",
    ageRelaxation: null,
    education: "GNM / B.Sc Nursing from a recognised institute",
    experience: null,
    selectionProcess: "Merit based on marks in qualifying examination followed by document verification",
    applicationFee: "No fee",
    documentsRequired: null,
    howToApply: "Download the form and send it by registered post",
    startDate: "2026-11-12",
    lastDate: "2026-11-30",
    examDate: null,
    resultDate: null,
    importantDates: [
      { label: "Application start", date: "12/11/2026" },
      { label: "Last date", date: "30/11/2026" },
    ],
    applyLink: null,
    officialWebsite: "https://patna.nic.in",
    evidence: {
      salary: "Remuneration: Rs. 20,000/- per month (consolidated)",
      ageLimit: "Age Limit: 21 to 37 years as on 01/01/2026",
      education: "GNM / B.Sc Nursing from a recognised institute",
      selectionProcess: "Merit based on marks in qualifying examination followed by document verification",
      applicationFee: "Application Fee: No fee",
      howToApply: "send it by registered post to the District Health Society, Patna",
    },
    confidence: 0.92,
    ...over,
  }
}
