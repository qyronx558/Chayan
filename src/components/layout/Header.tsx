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
 LifeBuoy,
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
import { handFont } from "@/components/home/fonts"

/* Active page: a marigold pen stroke under the word, the way you'd mark
 * where you are on a printed contents page. Hover gets a faint pencil line. */
function PenUnderline({ active }: { active: boolean }) {
 return (
  <svg
   className={cn(
    "pointer-events-none absolute -bottom-0.5 left-1.5 right-1.5 h-[7px] w-[calc(100%-0.75rem)] overflow-visible transition-opacity duration-200",
    active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
   )}
   viewBox="0 0 100 8"
   preserveAspectRatio="none"
   aria-hidden
  >
   <path
    d="M2 5 C 22 2, 45 7, 65 4 S 92 3, 98 5"
    fill="none"
    stroke={active ? "oklch(78% 0.14 78)" : "currentColor"}
    strokeWidth={active ? 3.2 : 1.4}
    strokeLinecap="round"
    vectorEffect="non-scaling-stroke"
   />
  </svg>
 )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
 const pathname = usePathname()
 const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
 return (
  <Link
   href={href}
   className={cn(
    "group relative whitespace-nowrap px-2 py-2 text-sm font-medium transition-colors duration-200",
    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
   )}
  >
   {children}
   <PenUnderline active={isActive} />
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
     "group relative inline-flex items-center gap-1 whitespace-nowrap px-2 py-2 text-sm font-medium transition-colors duration-200",
     isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    )}
   >
    <PenUnderline active={isActive} />
    {label}
    <ChevronDown
     className={cn(
      "h-3.5 w-3.5 transition-transform duration-200",
      open && "rotate-180"
     )}
    />
   </button>
   {open && (
    <div className="absolute left-0 top-full z-50 pt-2">
     <div
      className="relative w-64 -rotate-[0.6deg] rounded-[3px] border border-rule bg-background py-2 animate-in fade-in slide-in-from-top-1 duration-150"
      style={{ boxShadow: "0 1px 2px rgb(60 40 10 / .08), 0 18px 34px -18px rgb(60 40 10 / .45)" }}
     >
      {/* a strip of tape holding the slip up */}
      <span
       className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[3deg]"
       style={{ background: "oklch(82% 0.14 78 / .5)", clipPath: "polygon(3% 0, 97% 4%, 100% 50%, 96% 100%, 2% 96%, 0 45%)" }}
       aria-hidden
      />
      {children}
     </div>
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
   className="group/item mx-1.5 flex items-center gap-2.5 rounded-[3px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-paper-2"
  >
   <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover/item:text-brick" />
   <span className="decoration-[oklch(78%_0.14_78)] decoration-2 underline-offset-4 group-hover/item:underline">{label}</span>
   {newTab && <span className={cn(handFont.className, "ml-auto -rotate-[3deg] text-[0.85rem] text-muted-foreground")}>new tab</span>}
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
 const moreActive = pathname.startsWith("/syllabus") || pathname.startsWith("/admissions") || pathname.startsWith("/notifications") || pathname.startsWith("/blog") || pathname.startsWith("/exam-calendar") || pathname.startsWith("/careers") || pathname.startsWith("/docs")

 return (
  <>
   <header
    className={cn(
     "sticky top-[env(safe-area-inset-top)] z-50 w-full max-w-[100vw] overflow-x-clip bg-background/95 transition-shadow duration-200",
     scrolled && "shadow-[0_8px_18px_-14px_rgb(60_40_10/.35)]"
    )}
   >
    {/* bottom edge: the double rule printed at the top of a notebook page */}
    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[4px] border-y border-rule" aria-hidden />
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
        <DropdownItem href="/docs" icon={LifeBuoy} label="Help Centre" />
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

       {/* Phones: the theme switch lives in the side menu, so the account button has room */}
       <div className="hidden sm:contents">
        <ThemeToggle />
       </div>

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
        <>
        <Button size="sm" asChild className="h-9 shrink-0 px-3 sm:hidden">
         <Link href="/login">Log in</Link>
        </Button>
        <div className="hidden items-center gap-2 sm:flex">
         <Button variant="outline" size="sm" asChild>
          <Link href="/login">Log in</Link>
         </Button>
         <span className="relative">
          <Button size="sm" asChild>
           <Link href="/register">Register</Link>
          </Button>
          <span
           className={cn(handFont.className, "pointer-events-none absolute -bottom-[1.15rem] right-0 hidden whitespace-nowrap -rotate-[4deg] text-[0.8rem] leading-none text-brick xl:block")}
           aria-hidden
          >
           it&apos;s free ↑
          </span>
         </span>
        </div>
        </>
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
