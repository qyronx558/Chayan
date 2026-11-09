import Link from "next/link"
import { ArrowUpRight, BellRing, Building2, UserPlus } from "lucide-react"
import { Newsletter } from "@/components/layout/Newsletter"

const paths = [
  {
    icon: UserPlus,
    title: "For job seekers",
    copy: "Create a free account to save roles, track applications and receive matched alerts.",
    href: "/register",
    cta: "Create an account",
  },
  {
    icon: Building2,
    title: "For employers",
    copy: "Publish a verified opening and reach candidates already researching government careers.",
    href: "/employer",
    cta: "Post a job",
  },
]

export function HomeCTA({ className }: { className?: string }) {
  return (
    <section
      className={`scroll-mt-24 border-y border-rule bg-background${className ? ` ${className}` : ""}`}
      id="alerts"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid min-w-0 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-7">
            <p className="agate flex items-center gap-1.5 text-[11px] text-brick">
              <BellRing className="h-3.5 w-3.5" aria-hidden />
              Stay ahead
            </p>
            <h2 className="mt-2 break-words font-display text-[1.9rem] font-bold leading-tight text-foreground sm:text-[2.3rem]">
              Never miss a notification.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              One concise email when a verified job, result or admit card lands. No noise,
              no spam, unsubscribe anytime.
            </p>
            <div className="mt-5 max-w-md">
              <Newsletter />
            </div>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <div className="border-t-2 border-rule-2">
              {paths.map((path) => (
                <Link
                  key={path.href}
                  href={path.href}
                  className="group block border-b border-rule py-4 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-rule bg-paper-2 text-foreground">
                      <path.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-bold text-foreground transition-colors group-hover:text-brick">
                        {path.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {path.copy}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brick underline decoration-1 underline-offset-4 group-hover:decoration-2">
                        {path.cta}
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
