/**
 * Careers page config for ChayanJobs.
 *
 * HOW TO CONNECT YOUR GOOGLE FORM (1 minute):
 * 1. Create / open your Google Form (for candidate applications)
 * 2. Click Send -> Embed (<>) -> copy the `src` URL.
 *    It looks like: https://docs.google.com/forms/d/e/XXXX/viewform?embedded=true
 * 3. Paste it below as `embedUrl`, and paste the normal share link as `formUrl`.
 * 4. You can also set env var NEXT_PUBLIC_CAREERS_FORM_EMBED_URL to override without code change.
 *
 * The page automatically uses the embed if configured, otherwise shows a
 * placeholder card with instructions + a mailto fallback.
 */

export const careersFormConfig = {
  // TODO: replace with your real Google Form links
  formUrl:
    process.env.NEXT_PUBLIC_CAREERS_FORM_URL ||
    "https://docs.google.com/forms/d/e/PLACEHOLDER/viewform",
  embedUrl:
    process.env.NEXT_PUBLIC_CAREERS_FORM_EMBED_URL ||
    "https://docs.google.com/forms/d/e/PLACEHOLDER/viewform?embedded=true",
  // Set to true once you paste a real form ID - hides the setup notice.
  isConfigured: (process.env.NEXT_PUBLIC_CAREERS_FORM_EMBED_URL || "").includes(
    "/forms/d/e/"
  ),
  contactEmail: "careers@chayanjobs.com",
}

/**
 * Returns a safe in-site embed URL.
 * - Empty unless a real form is configured (so we never load Google's
 *   error page, whose links navigate the whole tab away).
 * - Auto-appends `embedded=true` if you pasted the normal share link.
 */
export function getCareersEmbedUrl(): string {
  if (!careersFormConfig.isConfigured) return ""
  const raw = careersFormConfig.embedUrl.trim()
  if (!raw.includes("docs.google.com/forms")) return ""
  if (raw.includes("embedded=true")) return raw
  return raw.includes("?") ? `${raw}&embedded=true` : `${raw}?embedded=true`
}

export type CareerRole = {
  title: string
  team: string
  type: string
  location: string
  stipend: string
  description: string
  skills: string[]
}

export const openRoles: CareerRole[] = [
  {
    title: "Content Writer (Govt Jobs)",
    team: "Content",
    type: "Remote · Part-time",
    location: "Remote, India",
    stipend: "₹8k–15k / month",
    description:
      "Write clear, accurate Sarkari job notifications from official PDFs. Hindi + English reading required.",
    skills: ["Hindi & English", "Attention to detail", "MS Word / Docs"],
  },
  {
    title: "Job Data Curator",
    team: "Operations",
    type: "Remote · Part-time",
    location: "Remote, India",
    stipend: "₹6k–12k / month",
    description:
      "Track 50+ official sites daily, verify notifications, update results, admit cards and answer keys.",
    skills: ["Web research", "Excel / Sheets", "Consistency"],
  },
  {
    title: "SEO Executive",
    team: "Growth",
    type: "Remote · Full-time",
    location: "Remote / New Delhi",
    stipend: "₹20k–35k / month",
    description:
      "Own on-page SEO for job pages, internal linking, schema and Search Console improvements.",
    skills: ["SEO basics", "Next.js / WordPress", "Analytics"],
  },
  {
    title: "Social Media Intern",
    team: "Growth",
    type: "Remote · Internship",
    location: "Remote, India",
    stipend: "₹5k stipend",
    description:
      "Create daily job-alert creatives for Telegram, Instagram and YouTube Shorts. 3-month internship.",
    skills: ["Canva", "Short-form video", "Hindi captions"],
  },
  {
    title: "Frontend Developer Intern (Next.js)",
    team: "Engineering",
    type: "Remote · Internship",
    location: "Remote, India",
    stipend: "PPO possible",
    description:
      "Ship UI with Next.js + Tailwind + shadcn. Good for students with 1-2 projects on GitHub.",
    skills: ["React / Next.js", "Tailwind CSS", "Git"],
  },
  {
    title: "General Application (Future Roles)",
    team: "Talent Pool",
    type: "Remote / On-site",
    location: "India",
    stipend: "As per role",
    description:
      "Don't see your role? Tell us what you're great at - we review every general application.",
    skills: ["Any skill", "Enthusiasm", "Reliability"],
  },
]

export const perks = [
  {
    title: "100% Remote-friendly",
    description: "Work from anywhere in India with async-first communication.",
  },
  {
    title: "Learn Sarkari ecosystem",
    description: "Deep exposure to UPSC, SSC, Banking, Railway & State PSC workflows.",
  },
  {
    title: "Certificate + LOR",
    description: "Internship certificate and letter of recommendation on completion.",
  },
  {
    title: "Flexible hours",
    description: "College-friendly shifts. Output matters, not punch-in time.",
  },
]

export const hiringSteps = [
  {
    step: "1",
    title: "Apply via Google Form",
    description: "Fill the form below (2–3 mins). Attach resume / portfolio links.",
  },
  {
    step: "2",
    title: "Shortlisting (3–5 days)",
    description: "We review every entry and reply on email - even if it's a no.",
  },
  {
    step: "3",
    title: "Small paid task",
    description: "A 30–60 min real-world task relevant to the role. No free work.",
  },
  {
    step: "4",
    title: "Quick call + Offer",
    description: "15-min video call, then offer letter with start date and stipend.",
  },
]
