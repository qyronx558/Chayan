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
import { SectionHeader } from "@/components/ui/section-header"

interface QuickLink {
 title: string
 description: string
 href: string
 icon: React.ReactNode
}

const links: QuickLink[] = [
 { title: "Active jobs", description: "Live vacancies and application windows", href: "/jobs", icon: <Briefcase className="h-4 w-4" /> },
 { title: "Admit cards", description: "Hall tickets and exam dates", href: "/admit-cards", icon: <FileText className="h-4 w-4" /> },
 { title: "Exam results", description: "Published result notifications and PDFs", href: "/results", icon: <Award className="h-4 w-4" /> },
 { title: "Answer keys", description: "Official keys and response sheets", href: "/answer-keys", icon: <Key className="h-4 w-4" /> },
 { title: "Syllabus", description: "Exam patterns and course outlines", href: "/syllabus", icon: <BookOpen className="h-4 w-4" /> },
 { title: "Admissions", description: "University and college entry notices", href: "/admissions", icon: <GraduationCap className="h-4 w-4" /> },
 { title: "Exam calendar", description: "Deadlines, exams and result dates", href: "/exam-calendar", icon: <CalendarDays className="h-4 w-4" /> },
 { title: "Notifications", description: "All official announcements", href: "/notifications", icon: <Bell className="h-4 w-4" /> },
]

export function QuickLinks({ className }: { className?: string }) {
 return (
  <section className={cn("py-16", className)} data-tour="quicklinks">
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeader
     icon={Briefcase}
     title="Quick access"
     subtitle="Everything you need to track your government job applications"
    />

    <div className="grid min-w-0 border-b border-rule sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-8">
     {links.map((link, i) => (
      <Link
       key={link.title}
       href={link.href}
       data-tour={i === 0 ? "quicklink-jobs" : undefined}
       className="group flex min-w-0 items-start gap-3 border-t border-rule py-4 transition-colors"
      >
       <span className="agate w-5 shrink-0 pt-1 text-xs text-muted-foreground">
        {String(i + 1).padStart(2, "0")}
       </span>
       <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>
        {link.icon}
       </span>
       <span className="min-w-0">
        <span className="block break-words font-display text-[1.05rem] font-bold leading-snug text-foreground transition-colors group-hover:text-brick">
         {link.title}
        </span>
        <span className="mt-0.5 block line-clamp-2 break-words text-[0.8125rem] leading-snug text-muted-foreground">
         {link.description}
        </span>
       </span>
      </Link>
     ))}
    </div>
   </div>
  </section>
 )
}
