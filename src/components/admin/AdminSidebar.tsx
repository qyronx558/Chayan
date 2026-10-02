"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { isSuperAdmin } from "@/lib/roles"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogoSmall } from "@/components/layout/LogoSmall"
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  IdCard,
  KeyRound,
  GraduationCap,
  BookOpen,
  FolderKanban,
  Users,
  BarChart3,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  X,
  Newspaper,
  Building2,
  SlidersHorizontal,
  BellRing,
  ExternalLink,
  Eye,
  ShieldCheck,
  DatabaseZap,
  ClipboardCheck,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const sidebarLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { href: "/admin/jobs", label: "Gov Jobs", icon: Briefcase, group: "Content" },
  { href: "/admin/private-jobs", label: "Private Jobs", icon: Building2, group: "Content" },
  { href: "/admin/referrals", label: "Referrals", icon: Building2, group: "Content" },
  { href: "/admin/reports", label: "Scam Reports", icon: ShieldCheck, group: "Content" },
  { href: "/admin/referral-payouts", label: "Referral Payouts", icon: BarChart3, group: "Manage", superOnly: true },
  { href: "/admin/results", label: "Results", icon: FileText, group: "Content" },
  { href: "/admin/admit-cards", label: "Admit Cards", icon: IdCard, group: "Content" },
  { href: "/admin/answer-keys", label: "Answer Keys", icon: KeyRound, group: "Content" },
  { href: "/admin/admissions", label: "Admissions", icon: GraduationCap, group: "Content" },
  { href: "/admin/syllabus", label: "Syllabus", icon: BookOpen, group: "Content" },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, group: "Content" },
  { href: "/admin/categories", label: "Categories", icon: FolderKanban, group: "Manage" },
  { href: "/admin/notifications", label: "Notifications", icon: BellRing, group: "Manage" },
  { href: "/admin/review", label: "Content Verification", icon: ClipboardCheck, superOnly: true, group: "Manage" },
  { href: "/admin/uploads", label: "Admin Uploads (Read Only)", icon: Eye, superOnly: true, group: "Manage" },
  { href: "/admin/users", label: "Users & Roles", icon: Users, superOnly: true, group: "Manage" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, superOnly: true, group: "Manage" },
  { href: "/admin/featured-slider", label: "Featured Slider", icon: SlidersHorizontal, superOnly: true, group: "Manage" },
  { href: "/admin/import-data", label: "Import Data", icon: DatabaseZap, superOnly: true, group: "System" },
  { href: "/admin/logs", label: "Activity Logs", icon: ScrollText, group: "System" },
]

interface SidebarLink {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  superOnly?: boolean
  group?: string
}

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

function NavItem({
  link,
  active,
  collapsed,
  onNavigate,
}: {
  link: SidebarLink
  active: boolean
  collapsed: boolean
  onNavigate: () => void
}) {
  const Icon = link.icon
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      title={collapsed ? link.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200",
        active
          ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-[0_4px_14px_-4px_rgba(13,148,136,0.6)]"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-white/20 text-white"
            : "bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600 dark:bg-white/[0.06] dark:text-slate-400 dark:group-hover:bg-teal-500/10 dark:group-hover:text-teal-300"
        )}
      >
        <Icon className="h-[17px] w-[17px]" />
      </span>
      {!collapsed && <span className="truncate">{link.label}</span>}
      {!collapsed && active && (
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-white/25">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        </span>
      )}
      {active && (
        <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-white/0" aria-hidden="true" />
      )}
    </Link>
  )
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { data: session } = useSession()
  const visibleLinks = (sidebarLinks as SidebarLink[]).filter(
    (link) => !link.superOnly || isSuperAdmin(session?.user?.role)
  )

  const sidebarBody = (
    <div className="flex h-full flex-col">
      {/* Brand - same logo as homepage (left top corner) */}
      <div
        className={cn(
          "flex h-[68px] shrink-0 items-center gap-2 border-b border-slate-200/80 px-4 dark:border-white/[0.06]",
          collapsed && "justify-center px-2"
        )}
      >
        {collapsed ? (
          <Link
            href="/admin/dashboard"
            title="Chayan Admin"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 shadow-sm"
          >
            <svg viewBox="0 0 80 80" className="h-5 w-5">
              <path d="M20 48 L30 58 L55 28" fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : (
          <div className="min-w-0 flex-1">
            <LogoSmall href="/admin/dashboard" />
          </div>
        )}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden h-8 w-8 text-slate-400 hover:text-slate-700 lg:flex dark:hover:text-slate-200"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div className="shrink-0 px-4 pb-1 pt-3">
          <div className="flex items-center gap-2 rounded-xl border border-teal-600/15 bg-gradient-to-br from-teal-50 to-emerald-50/60 px-3 py-2.5 dark:border-teal-400/20 dark:from-teal-500/[0.08] dark:to-emerald-500/[0.05]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">Admin Console</p>
              <p className="truncate text-[11px] font-medium text-teal-700 dark:text-teal-300">
                {session?.user?.role === "SUPER_ADMIN" ? "Super Admin access" : "Content manager access"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
        {(["Overview", "Content", "Manage", "System"] as const).map((group) => {
          const items = visibleLinks.filter((l) => (l.group ?? "Manage") === group)
          if (items.length === 0) return null
          return (
            <div key={group}>
              {!collapsed && (
                <p className="mb-1.5 flex items-center gap-2 px-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  {group}
                  <span className="h-px flex-1 bg-slate-200/70 dark:bg-white/[0.06]" />
                </p>
              )}
              <div className="space-y-1">
                {items.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
                  return (
                    <NavItem key={link.href} link={link} active={isActive} collapsed={collapsed} onNavigate={onClose} />
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-200/80 p-3 dark:border-white/[0.06]">
        {!collapsed ? (
          <div className="space-y-2.5">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-600 transition-colors hover:border-teal-600/30 hover:text-teal-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:text-teal-300"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View live site
            </Link>
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-white/[0.04]">
              <Avatar className="h-8 w-8 border border-slate-200 dark:border-white/10">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "Admin"} />
                <AvatarFallback className="bg-teal-600 text-[11px] font-bold text-white">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
                  {session?.user?.name || "Admin"}
                </p>
                <p className="truncate text-[11px] text-slate-400">{session?.user?.email || ""}</p>
              </div>
              {session?.user?.role && (
                <Badge className="h-5 shrink-0 bg-teal-600 px-1.5 text-[9px] font-bold uppercase tracking-wide text-white hover:bg-teal-600">
                  {session.user.role === "SUPER_ADMIN" ? "Super" : "Admin"}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-9 w-9 border border-slate-200 dark:border-white/10">
              <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "Admin"} />
              <AvatarFallback className="bg-teal-600 text-xs font-bold text-white">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col bg-white shadow-2xl lg:hidden dark:bg-[#0b1220]"
          >
            {sidebarBody}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop rail */}
      <aside
        className={cn(
          "sticky top-0 hidden h-[100dvh] shrink-0 flex-col border-r border-slate-200/80 bg-white transition-[width] duration-300 lg:flex dark:border-white/[0.06] dark:bg-[#0b1220]",
          collapsed ? "w-[84px]" : "w-[280px]"
        )}
      >
        {sidebarBody}
      </aside>
    </>
  )
}
