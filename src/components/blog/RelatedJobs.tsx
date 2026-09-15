import Link from "next/link"
import { Briefcase, ArrowRight, MapPin } from "lucide-react"
import { prisma } from "@/lib/prisma"

export async function RelatedJobs({ tags, excludeSlug }: { tags: string[]; excludeSlug?: string }) {
  const keywords = tags.map((t) => t.toLowerCase()).filter(Boolean).slice(0, 4)
  let jobs: { id: string; title: string; slug: string; department: { name: string } | null; state: { name: string } | null }[] = []

  try {
    if (keywords.length > 0) {
      jobs = await prisma.job.findMany({
        where: {
          OR: keywords.flatMap((k) => [
            { title: { contains: k, mode: "insensitive" } },
            { education: { contains: k, mode: "insensitive" } },
          ]),
        },
        take: 3,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, slug: true, department: { select: { name: true } }, state: { select: { name: true } } },
      })
    }
    if (jobs.length === 0) {
      jobs = await prisma.job.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, slug: true, department: { select: { name: true } }, state: { select: { name: true } } },
      })
    }
  } catch {
    return null
  }

  if (jobs.length === 0) return null
  void excludeSlug

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-[#E5DCC8] bg-[#F7F4EC] print:hidden dark:border-gray-700 dark:bg-gray-800/60" aria-label="Related jobs">
      <div className="flex items-center justify-between px-5 pt-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-[#17233B] dark:text-gray-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#101E33] text-[#E8C87A]"><Briefcase className="h-4 w-4" /></span>
          Jobs related to this guide
        </h2>
        <Link href="/jobs" className="flex items-center gap-1 text-xs font-bold text-[#1B3A5C] hover:text-[#101E33] dark:text-blue-300">
          All jobs <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {jobs.map((j) => (
          <Link key={j.id} href={`/jobs/${j.slug}`} className="group rounded-xl border border-[#E5DCC8] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#B08D57] hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <p className="line-clamp-2 min-h-[2.6rem] text-sm font-semibold leading-snug text-gray-900 group-hover:text-[#1B3A5C] dark:text-gray-100">{j.title}</p>
            <p className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="h-3 w-3" /> {j.department?.name || "Govt"} {j.state?.name ? `· ${j.state.name}` : ""}
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#1B3A5C] dark:text-blue-400">Apply <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </div>
    </section>
  )
}
