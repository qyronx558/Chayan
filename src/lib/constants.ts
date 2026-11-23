export const siteConfig = {
  name: "ChayanJobs",
  description: "Select right. serve right. Your trusted government job portal. Latest notifications, results, admit cards, answer keys and more.",
  url: (process.env.NEXT_PUBLIC_APP_URL || "https://ChayanJobs.in").replace(/\/+$/, ""),
  ogImage: `${(process.env.NEXT_PUBLIC_APP_URL || "https://ChayanJobs.in").replace(/\/+$/, "")}/og.png`,
  links: {
    twitter: "https://x.com/chayanjobs",
    facebook: "https://www.facebook.com/profile.php?id=61596871797110",
    instagram: "https://www.instagram.com/chayanjobs/",
    whatsapp: "https://chat.whatsapp.com/IskxNyBIF7f2XWSrXQ4UPc",
    telegram: "https://t.me/+lSRpgi47uztlN2Zl",
    youtube: "https://youtube.com/@ChayanJobs",
  },
}

/** Official ChayanJobs community / social channels, in display order. */
export const communityLinks = [
  { key: "whatsapp", label: "WhatsApp Community", href: siteConfig.links.whatsapp },
  { key: "telegram", label: "Telegram", href: siteConfig.links.telegram },
  { key: "instagram", label: "Instagram", href: siteConfig.links.instagram },
  { key: "x", label: "X (Twitter)", href: siteConfig.links.twitter },
  { key: "facebook", label: "Facebook", href: siteConfig.links.facebook },
] as const

export type CommunityKey = (typeof communityLinks)[number]["key"]

export const mainNav = [
  { title: "Home", href: "/" },
  { title: "Jobs", href: "/jobs" },
  { title: "Private Jobs", href: "/private-jobs" },
  { title: "Results", href: "/results" },
  { title: "Admit Cards", href: "/admit-cards" },
  { title: "Answer Keys", href: "/answer-keys" },
  { title: "Admissions", href: "/admissions" },
  { title: "Syllabus", href: "/syllabus" },
  { title: "Exam Calendar", href: "/exam-calendar" },
  { title: "Free Tools", href: "/tools" },
  { title: "Notifications", href: "/notifications" },
  { title: "Blog", href: "/blog" },
  { title: "Careers", href: "/careers" },
  { title: "Help Centre", href: "/docs" },
]

export const footerLinks = [
  {
    title: "Quick Links",
    links: [
      { label: "Latest Jobs", href: "/jobs" },
      { label: "Private Jobs", href: "/private-jobs" },
      { label: "Exam Results", href: "/results" },
      { label: "Admit Cards", href: "/admit-cards" },
      { label: "Answer Keys", href: "/answer-keys" },
      { label: "Admissions", href: "/admissions" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Syllabus", href: "/syllabus" },
      { label: "Exam Calendar", href: "/exam-calendar" },
      { label: "Notifications", href: "/notifications" },
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
  {
    title: "Free Tools",
    links: [
      { label: "All Free Tools", href: "/tools" },
      { label: "Age Calculator", href: "/tools/age-calculator" },
      { label: "Salary Explorer", href: "/tools/salary-calculator" },
      { label: "Photo Resizer", href: "/tools/photo-resizer" },
      { label: "Eligibility Checker", href: "/tools/eligibility-checker" },
    ],
  },
  {
    title: "Categories",
    links: [
      { label: "Central Govt Jobs", href: "/category/central" },
      { label: "State Govt Jobs", href: "/category/state" },
      { label: "Bank Jobs", href: "/category/bank" },
      { label: "Railway Jobs", href: "/category/railway" },
      { label: "Defence Jobs", href: "/category/defence" },
      { label: "Teaching Jobs", href: "/category/teaching" },
    ],
  },
]

export const trendingTags = [  { label: "Age Calculator", href: "/tools/age-calculator" },
  { label: "Salary Calculator", href: "/tools/salary-calculator" },
  { label: "Railway Jobs", href: "/category/railway" },
  { label: "Bank Jobs", href: "/category/bank" },
  { label: "SSC Exams", href: "/jobs" },
  { label: "UPSC Updates", href: "/notifications" },
  { label: "Latest Results", href: "/results" },
  { label: "Admit Cards", href: "/admit-cards" },
]

export const qualificationOptions = [
  { label: "10th Pass", value: "10th" },
  { label: "12th Pass", value: "12th" },
  { label: "ITI", value: "iti" },
  { label: "Diploma", value: "diploma" },
  { label: "Graduate", value: "graduate" },
  { label: "Post Graduate", value: "post_graduate" },
  { label: "Engineering", value: "engineering" },
  { label: "Medical", value: "medical" },
  { label: "Law", value: "law" },
  { label: "PhD", value: "phd" },
  { label: "CA", value: "ca" },
  { label: "Any", value: "any" },
]

export const salaryRanges = [
  { label: "Up to ₹25,000", value: "0-25000" },
  { label: "₹25,000 - ₹50,000", value: "25000-50000" },
  { label: "₹50,000 - ₹1,00,000", value: "50000-100000" },
  { label: "₹1,00,000 - ₹2,00,000", value: "100000-200000" },
  { label: "Above ₹2,00,000", value: "200000+" },
]

export const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
]

export const categoryTypes = [
  { label: "Central Govt Jobs", value: "central" },
  { label: "State Govt Jobs", value: "state" },
  { label: "Bank Jobs", value: "bank" },
  { label: "Railway Jobs", value: "railway" },
  { label: "Defence Jobs", value: "defence" },
  { label: "Teaching Jobs", value: "teaching" },
  { label: "Police Jobs", value: "police" },
  { label: "Engineering Jobs", value: "engineering" },
  { label: "Medical Jobs", value: "medical" },
  { label: "Post Office Jobs", value: "post_office" },
  { label: "Forest Jobs", value: "forest" },
  { label: "Public Sector", value: "public_sector" },
  { label: "Judiciary", value: "judiciary" },
  { label: "Legislative Assembly", value: "legislative_assembly" },
]

export const jobStatusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Upcoming", value: "UPCOMING" },
]

export const sortOptions = [
  { label: "Latest First", value: "latest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Last Date (Earliest)", value: "last_date_asc" },
  { label: "Last Date (Latest)", value: "last_date_desc" },
  { label: "Most Viewed", value: "most_viewed" },
  { label: "A-Z", value: "name_asc" },
  { label: "Z-A", value: "name_desc" },
]

// Explore band (footer row 2): high-interest discovery links.
// Phase 1 hrefs reuse existing routes only (category pages + /jobs search
// deep-links supported by JobsClient). Phase 2 will repoint these to
// dedicated /exams, /qualification and /state landing pages.
export const exploreFooterLinks = [
  {
    title: "Top Exams",
    links: [
      { label: "UPSC CSE", href: "/jobs?search=UPSC" },
      { label: "SSC CGL", href: "/jobs?search=SSC+CGL" },
      { label: "SSC CHSL", href: "/jobs?search=SSC+CHSL" },
      { label: "SSC GD Constable", href: "/jobs?search=SSC+GD" },
      { label: "IBPS PO", href: "/jobs?search=IBPS" },
      { label: "RRB NTPC", href: "/jobs?search=RRB" },
    ],
  },
  {
    title: "Jobs by Qualification",
    links: [
      { label: "10th Pass Jobs", href: "/jobs?search=10th" },
      { label: "12th Pass Jobs", href: "/jobs?search=12th" },
      { label: "ITI Jobs", href: "/jobs?search=ITI" },
      { label: "Diploma Jobs", href: "/jobs?search=Diploma" },
      { label: "Graduate Jobs", href: "/jobs?search=Graduate" },
      { label: "Post Graduate Jobs", href: "/jobs?search=Post+Graduate" },
    ],
  },
  {
    title: "Jobs by State",
    links: [
      { label: "UP Jobs", href: "/jobs?search=Uttar+Pradesh" },
      { label: "Bihar Jobs", href: "/jobs?search=Bihar" },
      { label: "MP Jobs", href: "/jobs?search=Madhya+Pradesh" },
      { label: "Rajasthan Jobs", href: "/jobs?search=Rajasthan" },
      { label: "Delhi Jobs", href: "/jobs?search=Delhi" },
      { label: "Maharashtra Jobs", href: "/jobs?search=Maharashtra" },
    ],
  },
  {
    title: "Top Departments",
    links: [
      { label: "UPSC", href: "/jobs?search=UPSC" },
      { label: "SSC", href: "/jobs?search=SSC" },
      { label: "Bank Jobs", href: "/category/bank" },
      { label: "Railway Jobs", href: "/category/railway" },
      { label: "Defence Jobs", href: "/category/defence" },
      { label: "Teaching Jobs", href: "/category/teaching" },
    ],
  },
]
