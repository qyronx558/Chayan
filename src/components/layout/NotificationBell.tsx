"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, BellRing, Check, X, Loader2, ExternalLink } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface UserNotification {
  id: string
  type: string
  title: string
  slug: string
  message: string | null
  read: boolean
  createdAt: string
}

const typeHref: Record<string, string> = {
  JOB: "/apply",
  PRIVATE_JOB: "/private-jobs",
  RESULT: "/result",
  ADMIT_CARD: "/admit-card",
  ADMISSION: "/admission",
  SYLLABUS: "/syllabus",
  ANSWER_KEY: "/answer-key",
  BLOG: "/blog",
  GENERAL: "/notifications",
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

export function NotificationBell() {
  const { data: session } = useSession()
  const [open, setOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<UserNotification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [loading, setLoading] = React.useState(false)

  const fetchNotifications = React.useCallback(async () => {
    if (!session?.user?.id) return
    setLoading(true)
    try {
      const res = await fetch("/api/user/notifications?limit=10")
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setNotifications(json.data)
          setUnreadCount(json.unreadCount)
        }
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  React.useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  React.useEffect(() => {
    if (!session?.user?.id) return

    const pushNotification = (n: UserNotification) => {
      setNotifications((prev) => {
        if (prev.some((x) => x.id === n.id)) return prev
        return [n, ...prev].slice(0, 10)
      })
      setUnreadCount((prev) => prev + 1)
    }

    let source: EventSource | null = null
    try {
      source = new EventSource("/api/notifications/stream")
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data && data.type && data.title) pushNotification(data)
        } catch {
          /* ignore malformed events */
        }
      }
    } catch {
      source = null
    }

    const poll = setInterval(() => {
      fetch("/api/user/notifications?limit=10")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json && json.success) {
            setNotifications(json.data)
            setUnreadCount(json.unreadCount)
          }
        })
        .catch(() => {})
    }, 45000)

    return () => {
      source?.close()
      clearInterval(poll)
    }
  }, [session?.user?.id])

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
    } catch {
    }
  }

  if (!session?.user) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-gray-500">{unreadCount} unread</span>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "group flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-0",
                  n.read ? "bg-white" : "bg-teal-50/60"
                )}
              >
                <Link
                  href={n.type === "GENERAL" ? "/notifications" : `${typeHref[n.type] || "/notifications"}/${n.slug}`}
                  className="min-w-0 flex-1"
                  onClick={() => {
                    if (!n.read) markRead(n.id)
                    setOpen(false)
                  }}
                >
                  <p
                    className={cn(
                      "text-sm leading-snug",
                      n.read ? "text-gray-600" : "font-medium text-gray-900"
                    )}
                  >
                    {n.title}
                  </p>
                  {n.message && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.message}</p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-400">
                    {typeLabel[n.type] || "Update"}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
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
          className="block border-t px-4 py-2.5 text-center text-xs font-medium text-teal-600 hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          Manage notification preferences
        </Link>
      </PopoverContent>
    </Popover>
  )
}