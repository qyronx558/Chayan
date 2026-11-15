"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
 Home,
 Briefcase,
 Building2,
 Award,
 CreditCard,
 FileText,
 BookOpen,
 GraduationCap,
 Bell,
 CalendarDays,
 LogIn,
 UserPlus,
 User,
 LogOut,
 Bookmark,
 ClipboardList,
 LayoutDashboard,
 Menu,
 X,
 Wrench,
 LifeBuoy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { mainNav } from "@/lib/constants"
import { isAdmin } from "@/lib/roles"
import { ThemeToggle } from "./ThemeToggle"
import { LogoSmall } from "@/components/layout/LogoSmall"

const navIconMap: Record<string, React.ElementType> = {
 Home,
 Jobs: Briefcase,
 "Private Jobs": Building2,
 Results: Award,
 "Admit Cards": CreditCard,
 "Answer Keys": FileText,
 "Free Tools": Wrench,
 Syllabus: BookOpen,
 Admissions: GraduationCap,
 "Exam Calendar": CalendarDays,
 Notifications: Bell,
 Careers: Briefcase,
 "Help Centre": LifeBuoy,
}

// "Gov Jobs" uses Jobs' href (/jobs) - not a separate mainNav entry

export function MobileNav() {
 const pathname = usePathname()
 const { data: session } = useSession()
 const [open, setOpen] = React.useState(false)

 return (
  <Sheet open={open} onOpenChange={setOpen}>
   <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="xl:hidden">
     {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
     <span className="sr-only">Toggle navigation menu</span>
    </Button>
   </SheetTrigger>
   <SheetContent side="left" className="w-[300px] p-0">
    <div className="flex h-full flex-col">
     <div className="flex items-center justify-between border-b border-rule py-4 pl-4 pr-14">
      <div onClick={() => setOpen(false)}>
       <LogoSmall />
      </div>
      <ThemeToggle />
     </div>

     <div className="flex-1 overflow-y-auto py-2">
      <div className="px-3 py-2">
       <p className="agate px-2 text-xs text-muted-foreground">Menu</p>
      </div>
      <nav className="space-y-0.5 px-2">
       {mainNav.map((link) => {
        const Icon = navIconMap[link.title] || Briefcase
        const isActive =
         link.href === "/"
          ? pathname === "/"
          : pathname.startsWith(link.href)
        return (
         <SheetClose key={link.href} asChild>
          <Link
           href={link.href}
           className={cn(
            "flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
            isActive
             ? "border-brick bg-paper-2 text-foreground"
             : "border-transparent text-muted-foreground hover:bg-paper-2 hover:text-foreground"
           )}
          >
           <Icon className="h-4 w-4" />
           {link.title}
          </Link>
         </SheetClose>
        )
       })}
      </nav>

      <Separator className="my-3" />

      <div className="px-3 py-2">
       <p className="agate px-2 text-xs text-muted-foreground">
        Quick categories
       </p>
      </div>
      <div className="space-y-0.5 px-2">
       {[
        { label: "Central Govt Jobs", href: "/category/central" },
        { label: "State Govt Jobs", href: "/category/state" },
        { label: "Bank Jobs", href: "/category/bank" },
        { label: "Railway Jobs", href: "/category/railway" },
        { label: "Defence Jobs", href: "/category/defence" },
       ].map((cat) => (
        <SheetClose key={cat.href} asChild>
         <Link
          href={cat.href}
          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-paper-2 hover:text-foreground"
         >
          {cat.label}
         </Link>
        </SheetClose>
       ))}
      </div>

      <Separator className="my-3" />

      <div className="space-y-0.5 px-2">
       {session?.user ? (
        <>
         {isAdmin(session.user.role) && (
          <SheetClose asChild>
           <Link
            href="/admin/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-brick transition-colors hover:bg-paper-2"
           >
            <LayoutDashboard className="h-4 w-4" />
            Admin panel
            <span className="ml-auto border border-rule px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
             New tab
            </span>
           </Link>
          </SheetClose>
         )}
         <SheetClose asChild>
          <Link
           href="/profile"
           className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-paper-2"
          >
           <User className="h-4 w-4" />
           My Profile
          </Link>
         </SheetClose>
         <SheetClose asChild>
          <Link
           href="/applications"
           className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-paper-2"
          >
           <ClipboardList className="h-4 w-4" />
           My Applications
          </Link>
         </SheetClose>
         <SheetClose asChild>
          <Link
           href="/bookmarks"
           className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-paper-2"
          >
           <Bookmark className="h-4 w-4" />
           Bookmarks
          </Link>
         </SheetClose>
         <button
          onClick={() => {
           signOut()
           setOpen(false)
          }}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-brick transition-colors hover:bg-paper-2"
         >
          <LogOut className="h-4 w-4" />
          Sign Out
         </button>
        </>
       ) : (
        <>
         <SheetClose asChild>
          <Link
           href="/login"
           className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-paper-2"
          >
           <LogIn className="h-4 w-4" />
           Login
          </Link>
         </SheetClose>
         <SheetClose asChild>
          <Link
           href="/register"
           className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brick transition-colors hover:bg-paper-2"
          >
           <UserPlus className="h-4 w-4" />
           Register
          </Link>
         </SheetClose>
        </>
       )}
      </div>
     </div>
    </div>
   </SheetContent>
  </Sheet>
 )
}
