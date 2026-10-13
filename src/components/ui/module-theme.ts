import {
  Briefcase,
  FileCheck2,
  Ticket,
  KeyRound,
  BookOpen,
  GraduationCap,
  Newspaper,
  Building2,
  type LucideIcon,
} from "lucide-react"

export type UniversalModule =
  | "government"
  | "result"
  | "admitCard"
  | "answerKey"
  | "syllabus"
  | "admission"
  | "blog"
  | "privateJob"

export interface ModuleTheme {
  icon: LucideIcon
  /** gradient classes for the 44px rounded icon square */
  iconBg: string
  /** CTA defaults */
  ctaLabel: string
  /** solid accent button */
  ctaClasses: string
  /** status pill */
  statusLabel: string
  statusClasses: string
  /** status dot (decorative, always paired with text) */
  statusDot: string
  /** hover border accent */
  hoverBorder: string
  /** grid for homepage sections */
  homeGrid: string
  /** grid for listing pages (denser) */
  listGrid: string
}

/**
 * Single source of truth for module accents.
 * All class strings are static so Tailwind v4 JIT can detect them.
 * Cards are icon-free: accent is used ONLY for status pill, primary CTA, hover border.
 * icon/iconBg are header-only (SectionHeader/SectionHero wayfinding).
 * Everything else stays neutral slate.
 */
export const moduleTheme: Record<UniversalModule, ModuleTheme> = {
  government: {
    icon: Briefcase,
    iconBg: "from-blue-600 to-blue-800",
    ctaLabel: "Apply Now",
    ctaClasses: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    statusLabel: "Active",
    statusClasses: "bg-blue-50 text-blue-700 border-blue-100",
    statusDot: "bg-blue-500",
    hoverBorder: "hover:border-blue-200",
    homeGrid: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    listGrid: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  },
  result: {
    icon: FileCheck2,
    iconBg: "from-emerald-600 to-teal-700",
    ctaLabel: "View Result",
    ctaClasses: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
    statusLabel: "Result",
    statusClasses: "bg-emerald-50 text-emerald-700 border-emerald-100",
    statusDot: "bg-emerald-500",
    hoverBorder: "hover:border-emerald-200",
    homeGrid: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
    listGrid: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  },
  admitCard: {
    icon: Ticket,
    iconBg: "from-violet-600 to-purple-800",
    ctaLabel: "Get Admit Card",
    ctaClasses: "bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500",
    statusLabel: "Admit Card",
    statusClasses: "bg-violet-50 text-violet-700 border-violet-100",
    statusDot: "bg-violet-500",
    hoverBorder: "hover:border-violet-200",
    homeGrid: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
    listGrid: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  },
  answerKey: {
    icon: KeyRound,
    iconBg: "from-cyan-600 to-teal-700",
    ctaLabel: "View Answer Key",
    ctaClasses: "bg-cyan-700 text-white hover:bg-cyan-800 focus-visible:ring-cyan-600",
    statusLabel: "Answer Key",
    statusClasses: "bg-cyan-50 text-cyan-800 border-cyan-100",
    statusDot: "bg-cyan-600",
    hoverBorder: "hover:border-cyan-200",
    homeGrid: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
    listGrid: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  },
  syllabus: {
    icon: BookOpen,
    iconBg: "from-orange-500 to-amber-700",
    ctaLabel: "View Syllabus",
    ctaClasses: "bg-orange-600 text-white hover:bg-orange-700 focus-visible:ring-orange-500",
    statusLabel: "Syllabus",
    statusClasses: "bg-orange-50 text-orange-700 border-orange-100",
    statusDot: "bg-orange-500",
    hoverBorder: "hover:border-orange-200",
    homeGrid: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
    listGrid: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  },
  admission: {
    icon: GraduationCap,
    iconBg: "from-rose-500 to-pink-700",
    ctaLabel: "View Admission",
    ctaClasses: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500",
    statusLabel: "Admission",
    statusClasses: "bg-rose-50 text-rose-700 border-rose-100",
    statusDot: "bg-rose-500",
    hoverBorder: "hover:border-rose-200",
    homeGrid: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
    listGrid: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  },
  blog: {
    icon: Newspaper,
    iconBg: "from-amber-500 to-orange-700",
    ctaLabel: "Read More",
    ctaClasses: "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500",
    statusLabel: "Article",
    statusClasses: "bg-amber-50 text-amber-800 border-amber-100",
    statusDot: "bg-amber-500",
    hoverBorder: "hover:border-amber-200",
    homeGrid: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    listGrid: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
  },
  privateJob: {
    icon: Building2,
    iconBg: "from-sky-600 to-blue-800",
    ctaLabel: "Apply Now",
    ctaClasses: "bg-sky-700 text-white hover:bg-sky-800 focus-visible:ring-sky-600",
    statusLabel: "Hiring",
    statusClasses: "bg-sky-50 text-sky-700 border-sky-100",
    statusDot: "bg-sky-600",
    hoverBorder: "hover:border-sky-200",
    homeGrid: "grid gap-5 sm:grid-cols-2",
    listGrid: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  },
}

export const moduleList: UniversalModule[] = [
  "government",
  "result",
  "admitCard",
  "answerKey",
  "syllabus",
  "admission",
  "blog",
  "privateJob",
]
