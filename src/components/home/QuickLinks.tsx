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
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickLink {
  title: string
  href: string
  icon: React.ReactNode
}

const links: QuickLink[] = [
  { title: "Active jobs", href: "/jobs", icon: <Briefcase className="h-4 w-4" /> },
  { title: "Admit cards", href: "/admit-cards", icon: <FileText className="h-4 w-4" /> },
  { title: "Exam results", href: "/results", icon: <Award className="h-4 w-4" /> },
  { title: "Answer keys", href: "/answer-keys", icon: <Key className="h-4 w-4" /> },
  { title: "Syllabus", href: "/syllabus", icon: <BookOpen className="h-4 w-4" /> },
  { title: "Admissions", href: "/admissions", icon: <GraduationCap className="h-4 w-4" /> },
  { title: "Exam calendar", href: "/exam-calendar", icon: <CalendarDays className="h-4 w-4" /> },
  { title: "Notifications", href: "/notifications", icon: <Bell className="h-4 w-4" /> },
]

/** Slim, single-row navigation strip that sits directly under the masthead. */
export function QuickLinks({ className }: { className?: string }) {
  return (
    <section
      className={cn("w-full max-w-[100vw] overflow-x-clip border-b border-rule bg-paper-2", className)}
      data-tour="quicklinks"
      aria-label="Explore the desk"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="no-scrollbar flex min-w-0 items-stretch overflow-x-auto">
          <span className="agate hidden shrink-0 items-center pr-5 text-[10px] text-muted-foreground lg:inline-flex">
            Explore the desk
          </span>
          {links.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              data-tour={i === 0 ? "quicklink-jobs" : undefined}
              className="group flex shrink-0 items-center gap-2 border-r border-rule px-4 py-3 transition-colors first:pl-0 last:border-r-0 last:pr-0"
            >
              <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-brick" aria-hidden>
                {link.icon}
              </span>
              <span className="whitespace-nowrap font-display text-sm font-bold text-foreground transition-colors group-hover:text-brick">
                {link.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
