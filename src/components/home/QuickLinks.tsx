import Link from "next/link"
import {
  Briefcase,
  FileText,
  Award,
  Key,
  BookOpen,
  GraduationCap,
  CalendarDays,
  Bell,
  ArrowUpRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionHeader } from "@/components/ui/section-header"

interface QuickLink {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  gradient: string
  tag: string
  tagClassName: string
}

const links: QuickLink[] = [
  {
    title: "Active Jobs",
    description: "Live vacancies & applications",
    href: "/jobs",
    icon: <Briefcase className="h-6 w-6" />,
    gradient: "from-blue-600 to-indigo-800",
    tag: "Hot",
    tagClassName: "bg-amber-100 text-amber-700",
  },
  {
    title: "Admit Cards",
    description: "Hall tickets & exam dates",
    href: "/admit-cards",
    icon: <FileText className="h-6 w-6" />,
    gradient: "from-violet-600 to-purple-800",
    tag: "Released",
    tagClassName: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Exam Results",
    description: "Published result PDFs",
    href: "/results",
    icon: <Award className="h-6 w-6" />,
    gradient: "from-emerald-600 to-teal-800",
    tag: "New",
    tagClassName: "bg-sky-100 text-sky-700",
  },
  {
    title: "Answer Keys",
    description: "Key responses & solutions",
    href: "/answer-keys",
    icon: <Key className="h-6 w-6" />,
    gradient: "from-amber-500 to-orange-700",
    tag: "Updated",
    tagClassName: "bg-rose-100 text-rose-700",
  },
  {
    title: "Syllabus",
    description: "Exam patterns & courses",
    href: "/syllabus",
    icon: <BookOpen className="h-6 w-6" />,
    gradient: "from-rose-500 to-pink-700",
    tag: "Guides",
    tagClassName: "bg-violet-100 text-violet-700",
  },
  {
    title: "Admissions",
    description: "University & college entry",
    href: "/admissions",
    icon: <GraduationCap className="h-6 w-6" />,
    gradient: "from-cyan-600 to-sky-800",
    tag: "Open",
    tagClassName: "bg-orange-100 text-orange-700",
  },
  {
    title: "Exam Calendar",
    description: "Deadlines, exams & results",
    href: "/exam-calendar",
    icon: <CalendarDays className="h-6 w-6" />,
    gradient: "from-teal-600 to-emerald-800",
    tag: "Track",
    tagClassName: "bg-teal-100 text-teal-700",
  },
  {
    title: "Notifications",
    description: "All official announcements",
    href: "/notifications",
    icon: <Bell className="h-6 w-6" />,
    gradient: "from-slate-600 to-gray-800",
    tag: "Live",
    tagClassName: "bg-blue-100 text-blue-700",
  },
]

export function QuickLinks({ className }: { className?: string }) {
  return (
    <section className={cn("py-16", className)} data-tour="quicklinks">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          icon={Briefcase}
          title="Quick Access"
          subtitle="Everything you need to track your government job applications"
        />

        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 lg:gap-4">
          {links.map((link, i) => (
            <Link
              key={link.title}
              href={link.href}
              data-tour={i === 0 ? "quicklink-jobs" : undefined}
              className={cn(
                "group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10 sm:p-4",
                "animate-fade-in-up"
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="mb-3 flex min-w-0 items-start justify-between gap-2">
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110",
                    link.gradient
                  )}
                >
                  {link.icon}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    link.tagClassName
                  )}
                >
                  {link.tag}
                </span>
              </div>

              <h3 className="break-words text-sm font-bold text-gray-900 transition-colors group-hover:text-blue-700">
                {link.title}
              </h3>
              <p className="mt-1 line-clamp-2 break-words text-[11px] leading-snug text-gray-500">{link.description}</p>

              <span className="mt-3 inline-flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 opacity-70 transition-all duration-300 group-hover:gap-1.5 group-hover:opacity-100">
                Explore <ArrowUpRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}