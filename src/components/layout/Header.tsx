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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
 const pathname = usePathname()
 const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
 return (
  <Link
   href={href}
   className={cn(
    "relative whitespace-nowrap border-b-2 px-2 py-2 text-sm font-medium transition-colors duration-200",
    isActive
     ? "border-brick text-foreground"
     : "border-transparent text-muted-foreground hover:border-rule-2 hover:text-foreground"
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
     "relative inline-flex items-center gap-1 whitespace-nowrap border-b-2 px-2 py-2 text-sm font-medium transition-colors duration-200",
     isActive
      ? "border-brick text-foreground"
      : "border-transparent text-muted-foreground hover:border-rule-2 hover:text-foreground"
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
    <div className="absolute left-0 top-full z-50 mt-0 w-52 border border-rule bg-background py-1 animate-in fade-in slide-in-from-top-1 duration-150">
     {children}
    </div>
   )}
  </div>
 )
}

function DropdownItem({ href, icon: Icon, label, newTab }: { href: string; icon: React.ElementType; label: string; newTab?: boolean }) {
 return (
  <Link
   href={href}
   {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
   className="mx-1 flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-paper-2 hover:text-brick"
  >
   <Icon className="h-4 w-4" />
   {label}
   {newTab && <span className="agate ml-auto text-[10px] text-muted-foreground">new tab</span>}
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
 const moreActive = pathname.startsWith("/syllabus") || pathname.startsWith("/admissions") || pathname.startsWith("/notifications") || pathname.startsWith("/blog") || pathname.startsWith("/exam-calendar") || pathname.startsWith("/careers")

 return (
  <>
   <header
    className={cn(
     "sticky top-[env(safe-area-inset-top)] z-50 w-full max-w-[100vw] overflow-x-clip border-b border-rule bg-background/95 transition-colors duration-200",
     scrolled && "border-rule-2"
    )}
   >
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
     <div className="flex h-16 items-center justify-between gap-2 xl:gap-3 min-w-0">
      <div className="flex min-w-0 shrink-0 items-center gap-1">
       <MobileNav />
       <LogoSmall />
      </div>

      <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex">
       <NavLink href="/">Home</NavLink>

       <NavDropdown label="Jobs" isActive={jobsActive}>
        <DropdownItem href="/jobs" icon={Briefcase} label="Gov Jobs" />
        <DropdownItem href="/private-jobs" icon={Building2} label="Private Jobs" />
        <DropdownItem href="/employer" icon={Building2} label="For Employers" newTab />
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
        <DropdownItem href="/careers" icon={Briefcase} label="Careers" />
       </NavDropdown>
      </nav>

      <div className="flex shrink-0 items-center gap-1">
       {/* Compact pill on wide screens - easy to spot & tap, no crowding */}
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
        className="hidden text-muted-foreground hover:text-foreground lg:inline-flex xl:hidden"
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
           className="rounded-none"
          >
           <Avatar className="h-8 w-8 rounded-none">
            <AvatarImage
             src={session.user.image ?? ""}
             alt={session.user.name ?? "User"}
            />
            <AvatarFallback className="rounded-none bg-paper-3 text-xs text-foreground">
             {session.user.name?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
           </Avatar>
          </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
           <div className="flex flex-col">
            <span>{session.user.name}</span>
            <span className="text-xs font-normal text-muted-foreground">
             {session.user.email}
            </span>
           </div>
          </DropdownMenuLabel>
          {(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") && (
           <>
            <DropdownMenuItem asChild>
             <Link href="/admin/dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
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
           className="flex items-center gap-2 text-brick cursor-pointer"
          >
           <LogOut className="h-4 w-4" />
           Sign Out
          </DropdownMenuItem>
         </DropdownMenuContent>
        </DropdownMenu>
       ) : (
        <div className="hidden items-center gap-2 sm:flex">
         <Button variant="outline" size="sm" asChild>
          <Link href="/login">Log in</Link>
         </Button>
         <Button size="sm" asChild>
          <Link href="/register">Register</Link>
         </Button>
        </div>
       )}
      </div>
     </div>
     <div className="pb-3 lg:hidden min-w-0">
      <SearchTrigger
       onTrigger={() => setSearchOpen(true)}
       placeholder="Search jobs, results, admit cards..."
       className="w-full min-w-0"
      />
     </div>
    </div>
   </header>

   <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
  </>
 )
}
