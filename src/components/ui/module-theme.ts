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
const homeGrid = "grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
const listGrid = "grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3"

export const moduleTheme: Record<UniversalModule, ModuleTheme> = {
 government: {
  icon: Briefcase,
  iconBg: "",
  ctaLabel: "Apply now",
  ctaClasses: "text-brick",
  statusLabel: "Active",
  statusClasses: "text-foreground",
  statusDot: "bg-brick",
  hoverBorder: "",
  homeGrid,
  listGrid,
 },
 result: {
  icon: FileCheck2,
  iconBg: "",
  ctaLabel: "View result",
  ctaClasses: "text-brick",
  statusLabel: "Result",
  statusClasses: "text-foreground",
  statusDot: "bg-brick",
  hoverBorder: "",
  homeGrid,
  listGrid,
 },
 admitCard: {
  icon: Ticket,
  iconBg: "",
  ctaLabel: "Get admit card",
  ctaClasses: "text-brick",
  statusLabel: "Admit card",
  statusClasses: "text-foreground",
  statusDot: "bg-brick",
  hoverBorder: "",
  homeGrid,
  listGrid,
 },
 answerKey: {
  icon: KeyRound,
  iconBg: "",
  ctaLabel: "View answer key",
  ctaClasses: "text-brick",
  statusLabel: "Answer key",
  statusClasses: "text-foreground",
  statusDot: "bg-brick",
  hoverBorder: "",
  homeGrid,
  listGrid,
 },
 syllabus: {
  icon: BookOpen,
  iconBg: "",
  ctaLabel: "View syllabus",
  ctaClasses: "text-brick",
  statusLabel: "Syllabus",
  statusClasses: "text-foreground",
  statusDot: "bg-brick",
  hoverBorder: "",
  homeGrid,
  listGrid,
 },
 admission: {
  icon: GraduationCap,
  iconBg: "",
  ctaLabel: "View admission",
  ctaClasses: "text-brick",
  statusLabel: "Admission",
  statusClasses: "text-foreground",
  statusDot: "bg-brick",
  hoverBorder: "",
  homeGrid,
  listGrid,
 },
 blog: {
  icon: Newspaper,
  iconBg: "",
  ctaLabel: "Read more",
  ctaClasses: "text-brick",
  statusLabel: "Article",
  statusClasses: "text-foreground",
  statusDot: "bg-brick",
  hoverBorder: "",
  homeGrid,
  listGrid,
 },
 privateJob: {
  icon: Building2,
  iconBg: "",
  ctaLabel: "Apply now",
  ctaClasses: "text-brick",
  statusLabel: "Hiring",
  statusClasses: "text-foreground",
  statusDot: "bg-brick",
  hoverBorder: "",
  homeGrid: "grid gap-x-6 gap-y-9 sm:grid-cols-2",
  listGrid,
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
