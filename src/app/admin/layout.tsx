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
    <div className="flex h-screen h-[100dvh] w-full overflow-hidden bg-paper-3 ">
      <div className="hidden w-[280px] shrink-0 flex-col gap-3 border-r border-rule bg-background p-4 lg:flex  ">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-xl" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[68px] items-center gap-3 border-b border-rule bg-background px-6  ">
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
    <div className="flex h-screen h-[100dvh] w-full overflow-hidden bg-paper-3 text-foreground antialiased  dark:text-paper">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main id="admin-main" className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-paper-3 ">
          <div className="mx-auto w-full max-w-[1400px] p-3 sm:p-5 lg:p-7">
            <div key={typeof window !== "undefined" ? window.location.pathname : "admin"}>
              {children}
            </div>
            <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-rule/70 pb-4 pt-4 text-[11.5px] text-muted-foreground sm:flex-row  dark:text-muted-foreground">
              <span>ChayanJobs Admin Console · v2.0 - Secure staff area</span>
              <span className="text-brick">Newsprint system · light + dark ready</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}
