"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { isAdmin } from "@/lib/roles"

function AdminLoading() {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-100 dark:bg-[#070d1a]">
      <div className="hidden w-[280px] shrink-0 flex-col gap-3 border-r border-slate-200 bg-white p-4 lg:flex dark:border-white/[0.06] dark:bg-[#0b1220]">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-xl" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[68px] items-center gap-3 border-b border-slate-200 bg-white px-6 dark:border-white/[0.06] dark:bg-[#0b1220]">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <div className="flex-1" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <div className="mx-auto grid w-full max-w-[1400px] gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
          <Skeleton className="h-64 rounded-2xl sm:col-span-2" />
          <Skeleton className="h-64 rounded-2xl sm:col-span-2" />
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || !isAdmin(session.user.role)) {
      router.push("/login")
    }
  }, [session, status, router])

  useEffect(() => {
    document.title = "ChayanJobs Admin Console"
  }, [])

  if (status === "loading" || !session || !isAdmin(session.user.role)) {
    return <AdminLoading />
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-100 text-slate-900 antialiased dark:bg-[#070d1a] dark:text-slate-100">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] p-3 sm:p-5 lg:p-7">
            <div key={typeof window !== "undefined" ? window.location.pathname : "admin"}>
              {children}
            </div>
            <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-200/70 pb-4 pt-4 text-[11.5px] text-slate-400 sm:flex-row dark:border-white/[0.06] dark:text-slate-500">
              <span>ChayanJobs Admin Console · v2.0 - Secure staff area</span>
              <span>Isolated from the main site · opens in a separate tab</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}
