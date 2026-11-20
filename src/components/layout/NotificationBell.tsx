"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, BellRing, Check, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { notificationHref } from "@/lib/notifications"

interface UserNotification {
 id: string
 type: string
 title: string
 slug: string
 message: string | null
 read: boolean
 createdAt: string
}

const typeLabel: Record<string, string> = {
 JOB: "New Job",
 PRIVATE_JOB: "New Private Job",
 RESULT: "New Result",
 ADMIT_CARD: "New Admit Card",
 ADMISSION: "New Admission",
 SYLLABUS: "New Syllabus",
 ANSWER_KEY: "New Answer Key",
 BLOG: "New Blog Post",
 GENERAL: "Announcement",
}

const NOTIFICATION_POLL_MS = 5 * 60_000

export function NotificationBell() {
 const { data: session } = useSession()
 const userId = session?.user?.id
 const [open, setOpen] = React.useState(false)
 const [notifications, setNotifications] = React.useState<UserNotification[]>([])
 const [unreadCount, setUnreadCount] = React.useState(0)
 const [loading, setLoading] = React.useState(false)

 const fetchNotifications = React.useCallback(async () => {
  if (!userId) return
  setLoading(true)
  try {
   const res = await fetch("/api/user/notifications?limit=10")
   if (res.ok) {
    const json = await res.json()
    if (json.success) {
     setNotifications(json.data)
     setUnreadCount(json.unreadCount)
     try {
      sessionStorage.setItem(`cj_notif:${userId}`, JSON.stringify({ at: Date.now(), data: json.data, unread: json.unreadCount }))
     } catch {}
    }
   }
  } catch {
  } finally {
   setLoading(false)
  }
 }, [userId])

 React.useEffect(() => {
  if (open) fetchNotifications()
 }, [open, fetchNotifications])

 React.useEffect(() => {
  if (!userId) return

  // No held-open stream (it kept a server function running for every open
  // tab). Poll slowly, only while the tab is visible, and share the last
  // answer across page loads in this tab so navigating costs no request.
  const key = `cj_notif:${userId}`
  const apply = (data: UserNotification[], unread: number) => {
   setNotifications(data)
   setUnreadCount(unread)
  }
  const readCache = (): { at: number; data: UserNotification[]; unread: number } | null => {
   try {
    return JSON.parse(sessionStorage.getItem(key) || "null")
   } catch {
    return null
   }
  }
  const poll = () => {
   if (document.visibilityState !== "visible") return
   const cached = readCache()
   if (cached && Date.now() - cached.at < NOTIFICATION_POLL_MS) {
    apply(cached.data, cached.unread)
    return
   }
   fetch("/api/user/notifications?limit=10")
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => {
     if (json && json.success) {
      apply(json.data, json.unreadCount)
      try {
       sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data: json.data, unread: json.unreadCount }))
      } catch {}
     }
    })
    .catch(() => {})
  }

  poll()
  const timer = setInterval(poll, NOTIFICATION_POLL_MS)
  document.addEventListener("visibilitychange", poll)
  return () => {
   clearInterval(timer)
   document.removeEventListener("visibilitychange", poll)
  }
 }, [userId])

 const markRead = async (id: string) => {
  try {
   await fetch(`/api/user/notifications/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ read: true }),
   })
   setNotifications((prev) =>
    prev.map((n) => (n.id === id ? { ...n, read: true } : n))
   )
   setUnreadCount((prev) => Math.max(0, prev - 1))
   try {
    if (userId) sessionStorage.removeItem(`cj_notif:${userId}`)
   } catch {}
  } catch {
  }
 }

 // Always visible in the header: guests get a bell linking to the public
 // notifications page, signed-in users get the live popover.
 if (!session?.user) {
  return (
   <Button
    variant="ghost"
    size="icon"
    asChild
    className="text-muted-foreground dark:text-muted-foreground hover:text-brick dark:hover:text-brick"
   >
    <Link href="/notifications" aria-label="Notifications">
     <Bell className="h-5 w-5" />
    </Link>
   </Button>
  )
 }

 return (
  <Popover open={open} onOpenChange={setOpen}>
   <PopoverTrigger asChild>
    <Button
     variant="ghost"
     size="icon"
     className="relative text-muted-foreground dark:text-muted-foreground hover:text-brick dark:hover:text-brick"
    >
     {unreadCount > 0 ? (
      <BellRing className="h-5 w-5" />
     ) : (
      <Bell className="h-5 w-5" />
     )}
     {unreadCount > 0 && (
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-paper-2 px-1 text-[10px] font-bold text-paper">
       {unreadCount > 9 ? "9+" : unreadCount}
      </span>
     )}
    </Button>
   </PopoverTrigger>
   <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
    <div className="flex items-center justify-between border-b px-4 py-3">
     <h3 className="text-sm font-semibold">Notifications</h3>
     {unreadCount > 0 && (
      <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
     )}
    </div>
    <div className="max-h-80 overflow-y-auto">
     {loading ? (
      <div className="flex items-center justify-center py-8">
       <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
     ) : notifications.length === 0 ? (
      <div className="py-8 text-center text-sm text-muted-foreground">
       No notifications yet
      </div>
     ) : (
      notifications.map((n) => (
       <div
        key={n.id}
        className={cn(
         "group flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-0",
         n.read ? "bg-background" : "bg-paper-3"
        )}
       >
        <Link
         href={notificationHref(n.type, n.slug) || "/notifications"}
         className="min-w-0 flex-1"
         onClick={() => {
          if (!n.read) markRead(n.id)
          setOpen(false)
         }}
        >
         <p
          className={cn(
           "text-sm leading-snug",
           n.read ? "text-muted-foreground" : "font-medium text-foreground"
          )}
         >
          {n.title}
         </p>
         {n.message && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
         )}
         <p className="mt-0.5 text-xs text-muted-foreground">
          {typeLabel[n.type] || "Update"}
         </p>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
         {!n.read && (
          <button
           onClick={() => markRead(n.id)}
           className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-paper-3 hover:text-muted-foreground group-hover:opacity-100"
           title="Mark as read"
          >
           <Check className="h-3.5 w-3.5" />
          </button>
         )}
        </div>
       </div>
      ))
     )}
    </div>
    <Link
     href="/profile"
     className="block border-t px-4 py-2.5 text-center text-xs font-medium text-brick hover:bg-paper-2 dark:hover:bg-ink"
    >
     Manage notification preferences
    </Link>
   </PopoverContent>
  </Popover>
 )
}