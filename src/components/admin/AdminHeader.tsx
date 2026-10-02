"use client"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Menu,
  LogOut,
  User,
  ExternalLink,
  Search,
  ChevronRight,
  LayoutDashboard,
  Home,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

interface AdminHeaderProps {
  onMenuClick: () => void
}

function formatCrumb(segment: string) {
  return segment.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const segments = (pathname || "/admin").split("/").filter(Boolean).slice(1)

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/admin/jobs?search=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0b1220]/85">
      {/* Brand accent line */}
      <div className="h-[3px] w-full bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500" aria-hidden="true" />
      <div className="flex h-[65px] items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb + title */}
        <div className="min-w-0">
          <nav className="flex min-w-0 items-center gap-1 text-[11.5px] font-medium text-slate-400 dark:text-slate-500" aria-label="Breadcrumb">
            <Link href="/admin/dashboard" className="flex shrink-0 items-center gap-1 transition-colors hover:text-teal-600">
              <Home className="h-3 w-3" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
            {segments.map((seg, i) => {
              const href = "/admin/" + segments.slice(0, i + 1).join("/")
              const isLast = i === segments.length - 1
              return (
                <span key={href} className="flex min-w-0 items-center gap-1">
                  <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
                  {isLast ? (
                    <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{formatCrumb(seg)}</span>
                  ) : (
                    <Link href={href} className="truncate transition-colors hover:text-teal-600">
                      {formatCrumb(seg)}
                    </Link>
                  )}
                </span>
              )
            })}
            {segments.length === 0 && (
              <span className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-slate-300" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">Dashboard</span>
              </span>
            )}
          </nav>
          <p className="hidden truncate text-[11.5px] text-slate-400 sm:block dark:text-slate-500">
            ChayanJobs Admin Console - publish & manage content
          </p>
        </div>

        <div className="flex-1" />

        {/* Global search (desktop) */}
        <form onSubmit={onSearch} className="relative hidden w-64 shrink-0 md:block xl:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, results…  (↵)"
            className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-9 text-[13px] shadow-none focus-visible:ring-teal-600/30 dark:border-white/10 dark:bg-white/[0.04]"
          />
        </form>

        <Badge className="hidden h-6 items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 hover:bg-emerald-50 lg:inline-flex dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live
        </Badge>

        <ThemeToggle />

        <Button
          variant="outline"
          size="sm"
          asChild
          className="hidden h-9 shrink-0 rounded-xl border-slate-200 font-semibold shadow-none hover:border-teal-600/40 hover:text-teal-700 sm:inline-flex dark:border-white/10"
        >
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View site
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-10 shrink-0 items-center gap-2 rounded-xl px-2 hover:bg-slate-100 dark:hover:bg-white/[0.06]">
              <Avatar className="h-8 w-8 border border-slate-200 dark:border-white/10">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "Admin"} />
                <AvatarFallback className="bg-teal-600 text-xs font-bold text-white">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left leading-tight xl:block">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                  <span className="max-w-[120px] truncate">{session?.user?.name || "Admin"}</span>
                  {session?.user?.role && (
                    <Badge className="h-4 bg-teal-600 px-1 text-[9px] font-bold uppercase tracking-wide text-white hover:bg-teal-600">
                      {session.user.role === "SUPER_ADMIN" ? "Super" : "Admin"}
                    </Badge>
                  )}
                </span>
                <span className="block max-w-[150px] truncate text-[11px] text-slate-400">{session?.user?.email}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1.5">
            <DropdownMenuLabel className="px-2.5 py-2">
              <p className="truncate text-[13px] font-semibold">{session?.user?.name || "Admin"}</p>
              <p className="truncate text-xs font-normal text-slate-400">{session?.user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-xl">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl">
              <Link href="/profile" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <User className="mr-0 h-4 w-4" /> My profile
                <ExternalLink className="ml-auto h-3 w-3 text-slate-400" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-xl text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
