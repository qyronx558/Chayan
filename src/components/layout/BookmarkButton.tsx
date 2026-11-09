"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface BookmarkButtonProps {
 jobId?: string | null
 resultId?: string | null
 admitCardId?: string | null
 privateJobId?: string | null
 syllabusId?: string | null
 size?: "sm" | "icon" | "default"
 variant?: "ghost" | "outline"
 className?: string
}

export function BookmarkButton({
 jobId,
 resultId,
 admitCardId,
 privateJobId,
 syllabusId,
 size = "icon",
 variant = "outline",
 className = "",
}: BookmarkButtonProps) {
 const { data: session } = useSession()
 const router = useRouter()
 const [isBookmarked, setIsBookmarked] = useState(false)
 const [loading, setLoading] = useState(false)
 const [checking, setChecking] = useState(true)

 useEffect(() => {
  if (!session?.user) {
   setChecking(false)
   return
  }
  const checkBookmark = async () => {
   try {
    const params = new URLSearchParams()
    if (jobId) params.set("jobId", jobId)
    if (resultId) params.set("resultId", resultId)
    if (admitCardId) params.set("admitCardId", admitCardId)
    if (privateJobId) params.set("privateJobId", privateJobId)
    if (syllabusId) params.set("syllabusId", syllabusId)
    const res = await fetch(`/api/bookmarks/check?${params}`)
    const json = await res.json()
    setIsBookmarked(json.bookmarked)
   } catch {
   } finally {
    setChecking(false)
   }
  }
  checkBookmark()
 }, [session, jobId, resultId, admitCardId, privateJobId, syllabusId])

 const handleToggle = async (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()

  if (!session?.user) {
   router.push("/login")
   return
  }

  setLoading(true)
  try {
   if (isBookmarked) {
    const params = new URLSearchParams()
    if (jobId) params.set("jobId", jobId)
    if (resultId) params.set("resultId", resultId)
    if (admitCardId) params.set("admitCardId", admitCardId)
    if (privateJobId) params.set("privateJobId", privateJobId)
    if (syllabusId) params.set("syllabusId", syllabusId)
    const res = await fetch(`/api/bookmarks/check?${params}`)
    const json = await res.json()
    if (json.id) {
     await fetch(`/api/bookmarks?id=${json.id}`, { method: "DELETE" })
     setIsBookmarked(false)
    }
   } else {
    const res = await fetch("/api/bookmarks", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ jobId, resultId, admitCardId, privateJobId, syllabusId }),
    })
    if (res.ok) setIsBookmarked(true)
   }
  } catch {
  } finally {
   setLoading(false)
  }
 }

 if (checking)
  return (
   <div
    aria-hidden
    className={`h-8 w-8 animate-pulse rounded-lg border border-rule bg-paper-2 ${className}`}
   />
  )

 return (
  <Button
   variant={variant}
   size={size}
   disabled={loading}
   onClick={handleToggle}
   className={`h-8 w-8 !px-0 !py-0 rounded-lg border-rule bg-background text-muted-foreground hover:border-rule hover:bg-paper-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-rule focus-visible:ring-offset-1 ${className}`}
   aria-label={isBookmarked ? "Saved. Remove bookmark" : "Save this item"}
   title={isBookmarked ? "Saved" : "Save"}
  >
   {isBookmarked ? (
    <BookmarkCheck className="h-4 w-4 text-brick" />
   ) : (
    <Bookmark className="h-4 w-4" />
   )}
  </Button>
 )
}
