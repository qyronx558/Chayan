"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { isAdmin } from "@/lib/roles"

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

  if (status === "loading" || !session || !isAdmin(session.user.role)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100/70 dark:bg-gray-950">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
