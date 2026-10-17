export type ChannelTopic = {
  value: string
  label: string
  email: string
  reply: string
}

export const CHANNEL_TOPICS: ChannelTopic[] = [
  { value: "general", label: "General question", email: "hello@chayanjobs.com", reply: "within 24 hours" },
  { value: "account", label: "Account or login help", email: "support@chayanjobs.com", reply: "within 12 hours" },
  { value: "report", label: "Report a job or link", email: "support@chayanjobs.com", reply: "within 24 hours" },
  { value: "partnership", label: "Partnership or advertising", email: "business@chayanjobs.com", reply: "within 48 hours" },
  { value: "careers", label: "Careers at ChayanJobs", email: "careers@chayanjobs.com", reply: "within 3 business days" },
  { value: "privacy", label: "Privacy or data request", email: "privacy@chayanjobs.com", reply: "within 72 hours" },
  { value: "security", label: "Security report", email: "security@chayanjobs.com", reply: "within 24 hours" },
]

export function getChannelTopic(value: string): ChannelTopic | undefined {
  return CHANNEL_TOPICS.find((topic) => topic.value === value)
}

export type DirectoryRow = {
  team: string
  email: string
  reply: string
  description: string
}

export const DIRECTORY_ROWS: DirectoryRow[] = [
  { team: "General", email: "hello@chayanjobs.com", reply: "Within 24 hours", description: "Product questions, feedback, and collaboration ideas." },
  { team: "Support", email: "support@chayanjobs.com", reply: "Within 12 hours", description: "Login issues, broken links, profile problems, and bug reports." },
  { team: "Business", email: "business@chayanjobs.com", reply: "Within 48 hours", description: "Employer tie-ups, advertising proposals, and B2B agreements." },
  { team: "Careers", email: "careers@chayanjobs.com", reply: "Within 3 business days", description: "Internships, engineering roles, resumes, and interviews." },
  { team: "Privacy", email: "privacy@chayanjobs.com", reply: "Within 72 hours", description: "Data access, deletion, consent withdrawal, and policy questions." },
  { team: "Security", email: "security@chayanjobs.com", reply: "Within 24 hours", description: "Vulnerability disclosures, phishing, and abuse reports." },
  { team: "Official", email: "contact@chayanjobs.com", reply: "Within 24 hours", description: "Formal letters, institutional queries, and admin requests." },
  { team: "Founder", email: "amit@chayanjobs.com", reply: "Within 48 hours", description: "Investor discussions, key decisions, and founder-level matters." },
]

export type FaqItem = {
  question: string
  answer: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Which email should I use?",
    answer: "Use the form on this page for anything general. To reset your password, use Forgot password on the sign-in page. For bugs or login trouble write to support@chayanjobs.com, for business proposals to business@chayanjobs.com, and for job applications to careers@chayanjobs.com.",
  },
  {
    question: "How fast will I get a reply?",
    answer: "Support replies within about 12 hours, general and official mail within 24 hours, business within 48 hours, and privacy or careers within 72 hours, measured on business days.",
  },
  {
    question: "How do I report a wrong job posting or broken link?",
    answer: "Choose Report a job or link in the form above and include the job title and page URL, or email the details to support@chayanjobs.com. Reports are usually reviewed within 24 hours.",
  },
  {
    question: "How do I request or delete my data?",
    answer: "Email privacy@chayanjobs.com from your registered address with the subject Data deletion request. We verify ownership and confirm once access or deletion is complete, within 72 hours.",
  },
  {
    question: "How do I report a security issue?",
    answer: "Email security@chayanjobs.com with a description and steps to reproduce. Please avoid public disclosure until we have fixed the issue. Reports are acknowledged within 24 hours.",
  },
  {
    question: "How do I advertise or partner with ChayanJobs?",
    answer: "Choose Partnership or advertising in the form above, or write to business@chayanjobs.com with your proposal. The business team replies within 48 hours on business days.",
  },
  {
    question: "How do I apply for a job at ChayanJobs?",
    answer: "Choose Careers at ChayanJobs in the form above, or send your resume to careers@chayanjobs.com. Visit the careers page for open roles and the hiring process.",
  },
]

export const POPULAR_SEARCHES = [
  "Reset password",
  "Report a job",
  "Delete my data",
  "Advertise with us",
  "Security issue",
]

export const SUPPORT_HOURS = "Monday to Saturday, 9:30 AM to 6:30 PM IST"

export const OFFICE_ADDRESS = "42, Sector 14, New Delhi 110070"

export const OFFICE_MAPS_URL = "https://maps.google.com/?q=42+Sector+14+New+Delhi+110070"

export function isSupportOnline(at: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(at)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ""
  const day = get("weekday")
  const minutes = Number(get("hour")) * 60 + Number(get("minute"))
  const weekday = day !== "Sun"
  return weekday && minutes >= 570 && minutes < 1110
}
