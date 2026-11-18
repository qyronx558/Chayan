import Link from "next/link"
import { Briefcase, ArrowRight, MapPin } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"

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
    <section className="mt-14 print:hidden" aria-label="Related jobs">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-dashed border-[var(--hs-border-strong,var(--color-rule))] pb-3">
        <div>
          <p className={cn(handFont.className, "text-[1.15rem] text-[var(--color-brick)]")}>done reading? put it to use</p>
          <h2 className="flex items-center gap-2 font-display text-[1.5rem] font-black leading-tight text-foreground">
            <Briefcase className="h-5 w-5 text-muted-foreground" /> Jobs related to this guide
          </h2>
        </div>
        <Link href="/jobs" className={cn(handFont.className, "flex items-center gap-1 text-[1.1rem] text-[var(--hs-trust,var(--color-ink))] underline decoration-wavy decoration-1 underline-offset-4 hover:text-[var(--color-brick)]")}>
          all jobs <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {jobs.map((j, i) => (
          <Link
            key={j.id}
            href={`/apply/${j.slug}`}
            className={cn("group relative rounded-[3px] border border-[var(--hs-border,var(--color-rule))] bg-[var(--hs-paper-slip,var(--background))] px-4 pb-4 pt-5 transition-transform duration-300 hover:-translate-y-1", i === 1 ? "rotate-[0.5deg]" : i === 2 ? "-rotate-[0.4deg]" : "")}
            style={{ boxShadow: "0 1px 2px rgb(60 40 10 / .08), 0 16px 28px -22px rgb(60 40 10 / .55)" }}
          >
            <span className={cn(typeFont.className, "absolute -top-2.5 left-4 rotate-[-3deg] bg-[var(--color-brick)] px-1.5 py-0.5 text-[9.5px] font-bold text-[oklch(98%_0.01_90)]")}>GOVT. JOB</span>
            <p className="line-clamp-2 min-h-[2.6rem] font-display text-[1rem] font-bold leading-snug text-foreground group-hover:underline group-hover:decoration-[var(--color-brick)] group-hover:underline-offset-2">{j.title}</p>
            <p className={cn(typeFont.className, "mt-2 flex items-center gap-1 text-[11px] text-muted-foreground")}>
              <MapPin className="h-3 w-3 shrink-0" /> <span className="line-clamp-1">{j.department?.name || "Govt"} {j.state?.name ? `· ${j.state.name}` : ""}</span>
            </p>
            <span className={cn(handFont.className, "mt-2 inline-flex items-center gap-1 text-[1.05rem] text-[var(--hs-trust,var(--color-ink))]")}>read &amp; apply <ArrowRight className="h-3 w-3" /></span>
          </Link>
        ))}
      </div>
    </section>
  )
}
