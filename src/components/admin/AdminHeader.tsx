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
    <header className="sticky top-0 z-30 shrink-0 border-b border-rule/80 bg-background/85  ">
      {/* Brand accent line */}
      <div className="h-[3px] w-full bg-brick" aria-hidden="true" />
      <div className="flex h-[65px] items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb + title */}
        <div className="min-w-0">
          <nav className="flex min-w-0 items-center gap-1 text-[11.5px] font-medium text-muted-foreground dark:text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/admin/dashboard" className="flex shrink-0 items-center gap-1 transition-colors hover:text-brick">
              <Home className="h-3 w-3" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
            {segments.map((seg, i) => {
              const href = "/admin/" + segments.slice(0, i + 1).join("/")
              const isLast = i === segments.length - 1
              return (
                <span key={href} className="flex min-w-0 items-center gap-1">
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground dark:text-muted-foreground" />
                  {isLast ? (
                    <span className="truncate font-semibold text-foreground dark:text-muted-foreground">{formatCrumb(seg)}</span>
                  ) : (
                    <Link href={href} className="truncate transition-colors hover:text-brick">
                      {formatCrumb(seg)}
                    </Link>
                  )}
                </span>
              )
            })}
            {segments.length === 0 && (
              <span className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold text-foreground dark:text-muted-foreground">Dashboard</span>
              </span>
            )}
          </nav>
          <p className="hidden truncate text-[11.5px] text-muted-foreground sm:block dark:text-muted-foreground">
            ChayanJobs Admin Console - publish & manage content
          </p>
        </div>

        <div className="flex-1" />

        {/* Global search (desktop) */}
        <form onSubmit={onSearch} className="relative hidden w-64 shrink-0 md:block xl:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, results…  (↵)"
            className="h-9 rounded-xl border-rule bg-paper-2 pl-9 text-[13px]  focus-visible:ring-rule  dark:bg-background/[0.04]"
          />
        </form>

        <Badge className="hidden h-6 items-center gap-1.5 rounded-full border border-rule bg-paper-3 px-2.5 text-[10.5px] font-bold text-foreground hover:bg-paper-3 lg:inline-flex dark:border-rule dark:bg-paper-3 dark:text-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-paper-3 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-paper-3" />
          </span>
          Live
        </Badge>

        <ThemeToggle />

        <Button
          variant="outline"
          size="sm"
          asChild
          className="hidden h-9 shrink-0 rounded-xl border-rule font-semibold  hover:border-rule hover:text-brick sm:inline-flex "
        >
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View site
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-10 shrink-0 items-center gap-2 rounded-xl px-2 hover:bg-paper-3 dark:hover:bg-background/[0.06]">
              <Avatar className="h-8 w-8 border border-rule ">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "Admin"} />
                <AvatarFallback className="bg-paper-3 text-xs font-bold text-paper">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left leading-tight xl:block">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground dark:text-paper">
                  <span className="max-w-[120px] truncate">{session?.user?.name || "Admin"}</span>
                  {session?.user?.role && (
                    <Badge className="h-4 bg-paper-3 px-1 text-[9px] font-bold text-paper hover:bg-paper-3">
                      {session.user.role === "SUPER_ADMIN" ? "Super" : "Admin"}
                    </Badge>
                  )}
                </span>
                <span className="block max-w-[150px] truncate text-[11px] text-muted-foreground">{session?.user?.email}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1.5">
            <DropdownMenuLabel className="px-2.5 py-2">
              <p className="truncate text-[13px] font-semibold">{session?.user?.name || "Admin"}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{session?.user?.email}</p>
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
                <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-xl text-brick focus:text-brick">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
