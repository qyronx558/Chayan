"use client"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { formatINR } from "@/lib/employer-earnings"
import {
  LayoutDashboard, Briefcase, BarChart3, Users, Wallet, ExternalLink, Building2,
} from "lucide-react"
import { ReferralCapture } from "@/components/employer/ReferralCapture"

const NAV = [
  { href: "/employer", label: "Overview", icon: LayoutDashboard },
  { href: "/employer/jobs", label: "Jobs", icon: Briefcase },
  { href: "/employer/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/employer/referrals", label: "Referrals", icon: Users },
  { href: "/employer/earnings", label: "Earnings", icon: Wallet },
]

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [withdrawable, setWithdrawable] = useState<number | null>(null)

  useEffect(() => {
    if (!session?.user) return
    fetch("/api/employer/earnings")
      .then((r) => r.json())
      .then((j) => { if (j.success) setWithdrawable(j.data.withdrawablePaise) })
      .catch(() => {})
  }, [session, pathname])

  return (
    <div className="flex min-h-[100dvh] bg-paper-3 ">
      <Suspense fallback={null}><ReferralCapture /></Suspense>
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-rule bg-background md:flex  ">
        <div className="flex h-16 items-center gap-2 border-b border-rule px-5 ">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper-3 text-paper"><Building2 className="h-5 w-5" /></span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-foreground dark:text-paper">Employer Studio</p>
            <p className="text-[11px] text-brick dark:text-brick">Hire + earn dashboard</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((n) => {
            const active = n.href === "/employer" ? pathname === "/employer" : pathname.startsWith(n.href)
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-paper-3 text-paper"
                    : "text-muted-foreground hover:bg-paper-3 dark:text-muted-foreground dark:hover:bg-background/5"
                )}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="space-y-2 border-t border-rule p-3 ">
          {withdrawable !== null && (
            <div className="rounded-xl bg-paper-3 px-3 py-2 text-center dark:bg-paper-3">
              <p className="text-lg font-extrabold text-foreground dark:text-foreground">{formatINR(withdrawable)}</p>
              <p className="text-[11px] text-foreground dark:text-foreground">withdrawable</p>
            </div>
          )}
          <Link href="/private-jobs" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-brick">
            <ExternalLink className="h-3.5 w-3.5" /> View live site (new tab)
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1">
        {/* Mobile top nav */}
        <div className="sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-b border-rule bg-background/95 px-3 py-2 md:hidden  ">
          {NAV.map((n) => {
            const active = n.href === "/employer" ? pathname === "/employer" : pathname.startsWith(n.href)
            return (
              <Link key={n.href} href={n.href} className={cn("flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold", active ? "bg-paper-3 text-paper" : "text-muted-foreground")}>
                <n.icon className="h-3.5 w-3.5" /> {n.label}
              </Link>
            )
          })}
        </div>
        {children}
      </div>
    </div>
  )
}
