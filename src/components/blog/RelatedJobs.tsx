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
    <section className="mt-10 overflow-hidden rounded-2xl border border-rule bg-paper-2 print:hidden dark:border-ink dark:bg-ink/60" aria-label="Related jobs">
      <div className="flex items-center justify-between px-5 pt-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground dark:text-paper">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-paper"><Briefcase className="h-4 w-4" /></span>
          Jobs related to this guide
        </h2>
        <Link href="/jobs" className="flex items-center gap-1 text-xs font-bold text-brick hover:text-foreground dark:text-brick">
          All jobs <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {jobs.map((j) => (
          <Link key={j.id} href={`/apply/${j.slug}`} className="group rounded-xl border border-rule bg-background p-4 transition-colors  hover:border-brick dark:border-ink dark:bg-ink">
            <p className="line-clamp-2 min-h-[2.6rem] text-sm font-semibold leading-snug text-foreground group-hover:text-brick dark:text-paper">{j.title}</p>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground dark:text-muted-foreground">
              <MapPin className="h-3 w-3" /> {j.department?.name || "Govt"} {j.state?.name ? `· ${j.state.name}` : ""}
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brick dark:text-brick">Apply <ArrowRight className="h-3 w-3 transition-colors " /></span>
          </Link>
        ))}
      </div>
    </section>
  )
}
