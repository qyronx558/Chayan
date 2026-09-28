"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { isSuperAdmin } from "@/lib/roles"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  IdCard,
  Key,
  GraduationCap,
  Book,
  Folder,
  Users,
  BarChart3,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  Newspaper,
  Building2,
  SlidersHorizontal,
  Bell,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const sidebarLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase, group: "Content" },
  { href: "/admin/private-jobs", label: "Private Jobs", icon: Building2, group: "Content" },
  { href: "/admin/results", label: "Results", icon: FileText, group: "Content" },
  { href: "/admin/admit-cards", label: "Admit Cards", icon: IdCard, group: "Content" },
  { href: "/admin/answer-keys", label: "Answer Keys", icon: Key, group: "Content" },
  { href: "/admin/admissions", label: "Admissions", icon: GraduationCap, group: "Content" },
  { href: "/admin/syllabus", label: "Syllabus", icon: Book, group: "Content" },
  { href: "/admin/categories", label: "Categories", icon: Folder, group: "Manage" },
  { href: "/admin/users", label: "Users", icon: Users, superOnly: true, group: "Manage" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, superOnly: true, group: "Manage" },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, group: "Manage" },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, group: "Manage" },
  { href: "/admin/featured-slider", label: "Featured Slider", icon: SlidersHorizontal, superOnly: true, group: "Manage" },
  { href: "/admin/import-data", label: "Import Data", icon: Briefcase, superOnly: true, group: "Manage" },
  { href: "/admin/logs", label: "Logs", icon: List, group: "Manage" },
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

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { data: session } = useSession()
  const visibleLinks = (sidebarLinks as SidebarLink[]).filter(
    (link) => !link.superOnly || isSuperAdmin(session?.user?.role)
  )

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white shadow-sm transition-all duration-300 lg:static lg:z-auto dark:border-gray-800 dark:bg-gray-900",
          collapsed ? "w-16" : "w-64",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4 dark:border-gray-800">
          {!collapsed && (
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">C</span>
              <span className="leading-tight">
                <span className="block text-sm font-bold tracking-tight text-gray-900 dark:text-white">Chayan Admin</span>
                <span className="block text-[11px] font-medium text-teal-600">Pro Panel</span>
              </span>
            </Link>
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {(["Overview", "Content", "Manage"] as const).map((group) => {
            const items = visibleLinks.filter((l) => (l.group ?? "Manage") === group)
            if (items.length === 0) return null
            return (
              <div key={group}>
                {!collapsed && (
                  <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {group}
                  </p>
                )}
                <div className="space-y-1">
                  {items.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        title={collapsed ? link.label : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                          isActive
                            ? "bg-teal-600 text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && <span className="truncate">{link.label}</span>}
                        {!collapsed && isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {!collapsed && (
          <div className="border-t border-gray-100 p-4 dark:border-gray-800">
            <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Chayan Admin Pro</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400">Content + HTML-safe publishing</p>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
