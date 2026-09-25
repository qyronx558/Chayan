"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  Search,
  User,
  LogOut,
  Bookmark,
  LayoutDashboard,
  ClipboardList,
  ChevronDown,
  Briefcase,
  Building2,
  BookOpen,
  GraduationCap,
  Bell,
  Newspaper,
  CalendarDays,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "./ThemeToggle"
import { MobileNav } from "./MobileNav"
import { SearchDialog, useSearchDialog } from "@/components/layout/SearchDialog"
import { SearchTrigger } from "@/components/search/SearchTrigger"
import { LogoSmall } from "@/components/layout/LogoSmall"
import { NotificationBell } from "./NotificationBell"
import { AshokaChakra } from "./AshokaChakra"

function DateTimeDisplay() {
  const [display, setDisplay] = React.useState("")

  React.useEffect(() => {
    const update = () => {
      const now = new Date()
      const d = now.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      const t = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
      setDisplay(`${d} | ${t}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  if (!display) return null
  return (
    <span className="rounded-full bg-white/65 px-2.5 py-[2px] text-xs text-[#1e3a5f]/90 font-medium tabular-nums shadow-sm backdrop-blur-[1px] dark:bg-black/35 dark:text-white/85">
      {display}
    </span>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={cn(
        "relative whitespace-nowrap rounded-md px-2 py-2 text-sm font-semibold tracking-wide transition-all duration-200",
        isActive
          ? "text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/40"
          : "text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 dark:text-gray-300 dark:hover:text-blue-300 dark:hover:bg-blue-950/40"
      )}
    >
      {children}
    </Link>
  )
}

function NavDropdown({
  label,
  isActive,
  children,
}: {
  label: string
  isActive: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={cn(
          "relative inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-2 text-sm font-semibold tracking-wide transition-all duration-200",
          isActive
            ? "text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/40"
            : "text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 dark:text-gray-300 dark:hover:text-blue-300 dark:hover:bg-blue-950/40"
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-0 w-48 bg-white dark:bg-gray-950 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  )
}

function DropdownItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 dark:text-gray-300 dark:hover:text-blue-300 dark:hover:bg-blue-950/40 transition-colors rounded-md mx-1"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { open: searchOpen, setOpen: setSearchOpen } = useSearchDialog()
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const jobsActive = pathname.startsWith("/jobs") || pathname.startsWith("/private-jobs")
  const toolsActive = pathname.startsWith("/tools")
  const moreActive = pathname.startsWith("/syllabus") || pathname.startsWith("/admissions") || pathname.startsWith("/notifications") || pathname.startsWith("/blog") || pathname.startsWith("/exam-calendar")

  return (
    <>
      <header
        className={cn(
          "sticky top-[env(safe-area-inset-top)] z-50 w-full transition-shadow duration-200",
          "bg-gradient-to-r from-orange-50 via-white to-green-50",
          "dark:from-[#231303] dark:via-gray-950 dark:to-[#071a0e]",
          scrolled && "shadow-md"
        )}
      >
        {/* Indian Tricolour — top strip with slow flowing-air sheen */}
        <div
          aria-hidden="true"
          className="relative h-1.5 w-full overflow-hidden bg-[linear-gradient(to_right,#FF9933_0%,#FF9933_33.3%,#F8F8F8_33.3%,#F8F8F8_66.6%,#138808_66.6%,#138808_100%)]"
        >
          <div className="animate-flag-sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        </div>
        {/* Indian flag band — authentic horizontal saffron / white / green with light Ashoka Chakra + slow air flow */}
        <div className="relative overflow-hidden border-b border-[#06038D]/20 bg-[linear-gradient(to_bottom,#FF9933_0%,#FF9933_33.3%,#FFFDF7_33.3%,#FFFDF7_66.6%,#138808_66.6%,#138808_100%)] dark:bg-[linear-gradient(to_bottom,#8a4d0e_0%,#8a4d0e_33.3%,#1c1c1e_33.3%,#1c1c1e_66.6%,#0b5a22_66.6%,#0b5a22_100%)]">
          {/* Ashoka Chakra — light colour, centered */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AshokaChakra className="h-8 w-8 text-[#06038D]/20 dark:text-white/25" />
          </div>
          {/* Flowing-air waves — slow drift across the flag */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-flag-sheen absolute inset-y-[-20%] left-0 w-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <div className="animate-flag-sheen absolute inset-y-[-20%] left-0 w-1/4 bg-gradient-to-r from-transparent via-white/25 to-transparent [animation-delay:1.8s]" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 flex items-center justify-between h-9">
            <div className="w-[200px] hidden sm:block" />
            <span className="flex-1 sm:flex-none rounded-full bg-white/65 px-3 py-[2px] text-xs text-[#1e3a5f] dark:bg-black/35 dark:text-white font-semibold text-center shadow-sm backdrop-blur-[1px]">
              Welcome to Chayan{session?.user?.name ? `, ${session.user.name}` : ""}
            </span>
            <div className="hidden md:block">
              <DateTimeDisplay />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between gap-2 xl:gap-3">
            <div className="flex shrink-0 items-center gap-1">
              <MobileNav />
              <LogoSmall />
            </div>

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex">
              <NavLink href="/">Home</NavLink>

              <NavDropdown label="Jobs" isActive={jobsActive}>
                <DropdownItem href="/jobs" icon={Briefcase} label="Gov Jobs" />
                <DropdownItem href="/private-jobs" icon={Building2} label="Private Jobs" />
              </NavDropdown>

              <NavLink href="/results">Results</NavLink>
              <NavLink href="/admit-cards">Admit Cards</NavLink>
              <NavLink href="/answer-keys">Answer Keys</NavLink>

              <NavDropdown label="Tools" isActive={toolsActive}>
                <DropdownItem href="/tools" icon={Wrench} label="All Free Tools" />
                <DropdownItem href="/tools/age-calculator" icon={CalendarDays} label="Age Calculator" />
                <DropdownItem href="/tools/salary-calculator" icon={Briefcase} label="Salary Explorer" />
                <DropdownItem href="/tools/photo-resizer" icon={Newspaper} label="Photo Resizer" />
                <DropdownItem href="/tools/eligibility-checker" icon={Bell} label="Eligibility Checker" />
              </NavDropdown>

              <NavDropdown label="More" isActive={moreActive}>
                <DropdownItem href="/syllabus" icon={BookOpen} label="Syllabus" />
                <DropdownItem href="/admissions" icon={GraduationCap} label="Admissions" />
                <DropdownItem href="/exam-calendar" icon={CalendarDays} label="Exam Calendar" />
                <DropdownItem href="/blog" icon={Newspaper} label="Blog" />
                <DropdownItem href="/notifications" icon={Bell} label="Notifications" />
              </NavDropdown>
            </nav>

            <div className="flex shrink-0 items-center gap-1">
              {/* Compact pill on wide screens — easy to spot & tap, no crowding */}
              <SearchTrigger
                onTrigger={() => setSearchOpen(true)}
                placeholder="Search..."
                showKbd={false}
                className="hidden h-9 w-40 shrink-0 xl:flex"
              />
              {/* Icon fallback for lg–xl where the pill would squeeze the nav */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="hidden text-gray-600 hover:text-blue-600 lg:inline-flex xl:hidden dark:text-gray-400 dark:hover:text-blue-400"
              >
                <Search className="h-5 w-5" />
              </Button>

              <NotificationBell />

              <ThemeToggle />

              {session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={session.user.image ?? ""}
                          alt={session.user.name ?? "User"}
                        />
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                          {session.user.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{session.user.name}</span>
                        <span className="text-xs font-normal text-gray-500">
                          {session.user.email}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    {(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/dashboard" className="flex items-center gap-2 cursor-pointer">
                            <LayoutDashboard className="h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/applications" className="flex items-center gap-2 cursor-pointer">
                        <ClipboardList className="h-4 w-4" />
                        My Applications
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookmarks" className="flex items-center gap-2 cursor-pointer">
                        <Bookmark className="h-4 w-4" />
                        Bookmarks
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="flex items-center gap-2 text-red-600 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/50" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                    <Link href="/register">Register</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="pb-3 lg:hidden">
            <SearchTrigger
              onTrigger={() => setSearchOpen(true)}
              placeholder="Search jobs, results, admit cards..."
              className="w-full"
            />
          </div>
        </div>
        {/* Indian Tricolour — bottom strip with slow flowing-air sheen */}
        <div
          aria-hidden="true"
          className="relative h-[3px] w-full overflow-hidden bg-[linear-gradient(to_right,#FF9933_0%,#FF9933_33.3%,#F8F8F8_33.3%,#F8F8F8_66.6%,#138808_66.6%,#138808_100%)] dark:opacity-90"
        >
          <div className="animate-flag-sheen absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent [animation-delay:0.9s]" />
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
