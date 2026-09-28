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
import { Menu, LogOut, User, ExternalLink } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface AdminHeaderProps {
  onMenuClick: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const crumb = (pathname || "/admin").split("/").filter(Boolean).slice(1).join(" / ") || "dashboard"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur lg:px-6 dark:border-gray-800 dark:bg-gray-900/90">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold capitalize text-gray-900 dark:text-gray-100">{crumb.replaceAll("-", " ")}</p>
        <p className="hidden text-xs text-gray-400 sm:block">Manage content - plain text or styled HTML, previewed exactly as readers see it</p>
      </div>

      <div className="flex-1" />

      <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
        <Link href="/" target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View site
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback>
                {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                {session?.user?.name || "Admin"}
                {session?.user?.role && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase tracking-wide">
                    {session.user.role}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-500">{session?.user?.email}</div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
