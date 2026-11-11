"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Bookmark, X, Calendar, MapPin, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"

interface BookmarkedJob {
  id: string
  title: string
  slug: string
  department: { name: string }
  location: string | null
  lastDate: string | null
  status: string
}

interface BookmarkedResult {
  id: string
  title: string
  slug: string
  department: { name: string }
  resultDate: string | null
  status: string | null
}

interface BookmarkedAdmitCard {
  id: string
  title: string
  slug: string
  department: { name: string }
  examDate: string | null
  status: string | null
}

interface BookmarkedPrivateJob {
  id: string
  title: string
  slug: string
  company: { name: string }
  location: string | null
  salary: string | null
  status: string
}

interface BookmarkedSyllabus {
  id: string
  title: string
  slug: string
  department: { name: string }
  status: string | null
}

interface BookmarkItem {
  id: string
  createdAt: string
  job: BookmarkedJob | null
  result: BookmarkedResult | null
  admitCard: BookmarkedAdmitCard | null
  privateJob: BookmarkedPrivateJob | null
  syllabus: BookmarkedSyllabus | null
}

export default function BookmarksPage() {
  const { status } = useSession()
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await fetch("/api/bookmarks")
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setBookmarks(json.data)
        }
      }
    } catch {
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      fetchBookmarks()
    }
  }, [status, router, fetchBookmarks])

  async function removeBookmark(id: string) {
    setRemovingId(id)
    try {
      const res = await fetch(`/api/bookmarks?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id))
        toast("Bookmark removed", "success")
      } else {
        toast("Failed to remove bookmark", "destructive")
      }
    } catch {
      toast("Failed to remove bookmark", "destructive")
    } finally {
      setRemovingId(null)
    }
  }

  const savedJobs = bookmarks.filter((b) => b.job)
  const savedResults = bookmarks.filter((b) => b.result)
  const savedAdmitCards = bookmarks.filter((b) => b.admitCard)
  const savedPrivateJobs = bookmarks.filter((b) => b.privateJob)
  const savedSyllabus = bookmarks.filter((b) => b.syllabus)

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="mb-4 h-10 w-80" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-6 flex items-center gap-3">
          <Bookmark className="h-6 w-6 text-brick" />
          <h1 className="text-2xl font-bold text-foreground">
            My Bookmarks ({bookmarks.length})
          </h1>
        </div>

        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="jobs">
              Saved Jobs ({savedJobs.length})
            </TabsTrigger>
            <TabsTrigger value="results">
              Saved Results ({savedResults.length})
            </TabsTrigger>
            <TabsTrigger value="admitCards">
              Saved Admit Cards ({savedAdmitCards.length})
            </TabsTrigger>
            <TabsTrigger value="privateJobs">
              Private Jobs ({savedPrivateJobs.length})
            </TabsTrigger>
            <TabsTrigger value="syllabus">
              Syllabus ({savedSyllabus.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            {savedJobs.length === 0 ? (
              <EmptyState type="jobs" />
            ) : (
              <div className="space-y-4">
                {savedJobs.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    id={bookmark.id}
                    title={bookmark.job!.title}
                    slug={bookmark.job!.slug}
                    department={bookmark.job!.department.name}
                    location={bookmark.job!.location}
                    date={bookmark.job!.lastDate}
                    status={bookmark.job!.status}
                    href={`/apply/${bookmark.job!.slug}`}
                    onRemove={removeBookmark}
                    isRemoving={removingId === bookmark.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="results">
            {savedResults.length === 0 ? (
              <EmptyState type="results" />
            ) : (
              <div className="space-y-4">
                {savedResults.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    id={bookmark.id}
                    title={bookmark.result!.title}
                    slug={bookmark.result!.slug}
                    department={bookmark.result!.department.name}
                    date={bookmark.result!.resultDate}
                    status={bookmark.result!.status}
                    href={`/result/${bookmark.result!.slug}`}
                    onRemove={removeBookmark}
                    isRemoving={removingId === bookmark.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="admitCards">
            {savedAdmitCards.length === 0 ? (
              <EmptyState type="admit cards" />
            ) : (
              <div className="space-y-4">
                {savedAdmitCards.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    id={bookmark.id}
                    title={bookmark.admitCard!.title}
                    slug={bookmark.admitCard!.slug}
                    department={bookmark.admitCard!.department.name}
                    date={bookmark.admitCard!.examDate}
                    status={bookmark.admitCard!.status}
                    href={`/admit-card/${bookmark.admitCard!.slug}`}
                    onRemove={removeBookmark}
                    isRemoving={removingId === bookmark.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="privateJobs">
            {savedPrivateJobs.length === 0 ? (
              <EmptyState type="private jobs" />
            ) : (
              <div className="space-y-4">
                {savedPrivateJobs.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    id={bookmark.id}
                    title={bookmark.privateJob!.title}
                    slug={bookmark.privateJob!.slug}
                    department={bookmark.privateJob!.company.name}
                    location={bookmark.privateJob!.location}
                    date={null}
                    status={bookmark.privateJob!.status}
                    href={`/private-jobs/${bookmark.privateJob!.slug}`}
                    onRemove={removeBookmark}
                    isRemoving={removingId === bookmark.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="syllabus">
            {savedSyllabus.length === 0 ? (
              <EmptyState type="syllabus" />
            ) : (
              <div className="space-y-4">
                {savedSyllabus.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    id={bookmark.id}
                    title={bookmark.syllabus!.title}
                    slug={bookmark.syllabus!.slug}
                    department={bookmark.syllabus!.department.name}
                    date={null}
                    status={bookmark.syllabus!.status}
                    href={`/syllabus/${bookmark.syllabus!.slug}`}
                    onRemove={removeBookmark}
                    isRemoving={removingId === bookmark.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

function EmptyState({ type }: { type: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-16">
        <Bookmark className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">No bookmarks yet</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          You haven&apos;t saved any {type} yet. Start browsing and save items you&apos;re interested in.
        </p>
        <Button asChild>
          <Link href="/jobs">Browse Jobs</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

interface BookmarkCardProps {
  id: string
  title: string
  slug: string
  department: string
  location?: string | null
  date?: string | null
  status?: string | null
  href: string
  onRemove: (id: string) => void
  isRemoving: boolean
}

function BookmarkCard({ id, title, department, location, date, status, href, onRemove, isRemoving }: BookmarkCardProps) {
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Card className="group relative border-rule transition-colors hover:border-rule">
        <CardContent className="flex items-start justify-between p-5">
          <Link href={href} className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{department}</Badge>
              {status && (
                <Badge
                  variant={
                    status === "ACTIVE"
                      ? "default"
                      : status === "EXPIRED"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {status}
                </Badge>
              )}
            </div>
            <h3 className="mb-2 text-base font-semibold text-foreground transition-colors group-hover:text-brick">
              {title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </span>
              )}
              {date && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(date)}
                </span>
              )}
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-brick"
            onClick={() => onRemove(id)}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
