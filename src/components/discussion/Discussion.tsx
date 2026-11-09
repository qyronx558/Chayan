"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import {
 Bell,
 BellOff,
 ChevronDown,
 Flame,
 Image as ImageIcon,
 Lock,
 MessageCircle,
 Search,
 ShieldCheck,
 Sparkles,
 TrendingUp,
 X,
 Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { CommentItem, RedditComposer } from "./CommentItem"
import type {
 CommentDTO,
 FilterKey,
 PostType,
 SortKey,
 ThreadMeta,
} from "./types"

const SORTS: { key: SortKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
 { key: "top", label: "Top", icon: TrendingUp },
 { key: "newest", label: "New", icon: Sparkles },
 { key: "controversial", label: "Hot", icon: Flame },
]

const FILTERS: { key: FilterKey; label: string }[] = [
 { key: "all", label: "All Comments" },
 { key: "questions", label: "Questions" },
 { key: "answers", label: "Answers" },
 { key: "announcements", label: "Official" },
]

async function compressImage(file: File): Promise<Blob> {
 const bitmap = await createImageBitmap(file)
 const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height))
 const canvas = document.createElement("canvas")
 canvas.width = Math.round(bitmap.width * scale)
 canvas.height = Math.round(bitmap.height * scale)
 canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
 return new Promise((resolve) =>
  canvas.toBlob((b) => resolve(b || file), "image/jpeg", 0.7)
 )
}

interface DiscussionProps {
 postId: string
 postType: PostType
 path?: string
}

export function Discussion({ postId, postType, path }: DiscussionProps) {
 const { data: session } = useSession()
 const currentUserId = session?.user?.id

 const [comments, setComments] = useState<CommentDTO[]>([])
 const [meta, setMeta] = useState<ThreadMeta>({
  total: 0,
  locked: false,
  following: false,
  isAdmin: false,
  pinnedComment: null,
 })
 const [nextCursor, setNextCursor] = useState<string | null>(null)
 const [loading, setLoading] = useState(true)
 const [sort, setSort] = useState<SortKey>("top")
 const [filter, setFilter] = useState<FilterKey>("all")
 const [search, setSearch] = useState("")
 const [searchInput, setSearchInput] = useState("")
 const [searchOpen, setSearchOpen] = useState(false)
 const [connected, setConnected] = useState(false)
 const [reconnecting, setReconnecting] = useState(false)
 const [sortDropdown, setSortDropdown] = useState(false)
 const eventSourceRef = useRef<EventSource | null>(null)
 const sortRef = useRef<HTMLDivElement>(null)

 const [content, setContent] = useState("")
 const [kind, setKind] = useState<"GENERAL" | "QUESTION">("GENERAL")
 const [imageUrl, setImageUrl] = useState<string | null>(null)
 const [uploading, setUploading] = useState(false)
 const [submitting, setSubmitting] = useState(false)
 const [composerExpanded, setComposerExpanded] = useState(false)
 const [captcha, setCaptcha] = useState<{
  required: boolean
  question?: string
  token?: string
 }>({ required: false })
 const [captchaAnswer, setCaptchaAnswer] = useState("")

 useEffect(() => {
  function handleClick(e: MouseEvent) {
   if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortDropdown(false)
  }
  if (sortDropdown) document.addEventListener("mousedown", handleClick)
  return () => document.removeEventListener("mousedown", handleClick)
 }, [sortDropdown])

 const handleSSEEvent = useCallback((data: any) => {
  console.debug("SSE event:", data.type)
 }, [])

 async function loadReplies(parentId: string, cursor?: string) {
  const params = new URLSearchParams({ postType, postId, parentId })
  if (cursor) params.set("cursor", cursor)
  const res = await fetch(`/api/comments?${params}`)
  const json = await res.json()
  return json.success ? { comments: json.data.comments, nextCursor: json.data.nextCursor } : { comments: [], nextCursor: null }
 }

 const fetchComments = useCallback(
  async (opts?: { cursor?: string; append?: boolean }) => {
   setLoading(true)
   try {
    const params = new URLSearchParams({ postType, postId, sort, filter })
    if (search) params.set("q", search)
    if (opts?.cursor) params.set("cursor", opts.cursor)
    const res = await fetch(`/api/comments?${params}`)
    const json = await res.json()
    if (json.success) {
     setComments((prev) =>
      opts?.append ? [...prev, ...json.data.comments] : json.data.comments
     )
     setNextCursor(json.data.nextCursor)
     if (!opts?.append) setMeta(json.data.meta)
    }
   } finally {
    setLoading(false)
   }
  },
  [postType, postId, sort, filter, search]
 )

 const fetchCommentsRef = useRef(fetchComments)
 useEffect(() => { fetchCommentsRef.current = fetchComments }, [fetchComments])
 useEffect(() => {
  const t = setTimeout(fetchComments, 0)
  return () => clearTimeout(t)
 }, [fetchComments])

 useEffect(() => {
  const t = setTimeout(() => setSearch(searchInput), 300)
  return () => clearTimeout(t)
 }, [searchInput])

 // SSE
 useEffect(() => {
  let disposed = false
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined

  const connect = () => {
   if (disposed) return
   if (eventSourceRef.current) eventSourceRef.current.close()

   const es = new EventSource(`/api/comments/stream?postType=${postType}&postId=${postId}`)
   eventSourceRef.current = es

   es.onopen = () => { setConnected(true); setReconnecting(false) }
   es.onmessage = (event) => {
    try { handleSSEEvent(JSON.parse(event.data)) } catch {}
   }
   es.addEventListener("thread-update", (event) => {
    try {
     const data = JSON.parse(event.data)
     setMeta((m) => ({ ...m, total: data.commentCount }))
     fetchCommentsRef.current()
    } catch {}
   })
   es.onerror = () => {
    if (disposed) return
    setConnected(false)
    setReconnecting(true)
    es.close()
    reconnectTimer = setTimeout(connect, 5000)
   }
  }

  connect()
  return () => {
   disposed = true
   if (reconnectTimer) clearTimeout(reconnectTimer)
   if (eventSourceRef.current) eventSourceRef.current.close()
  }
 }, [postType, postId, handleSSEEvent])

 async function uploadImage(file: File) {
  setUploading(true)
  try {
   const compressed = await compressImage(file)
   const fd = new FormData()
   fd.append("image", new File([compressed], "comment.jpg", { type: "image/jpeg" }))
   const res = await fetch("/api/comments/upload", { method: "POST", body: fd })
   const json = await res.json()
   if (json.success) setImageUrl(json.data.url)
   else toast(json.error || "Upload failed", "destructive")
  } catch {
   toast("Image processing failed", "destructive")
  } finally {
   setUploading(false)
  }
 }

 async function submit(parentId?: string, parentReplyText?: string) {
  if (!currentUserId) return
  const bodyContent = parentId ? parentReplyText : content
  if (!bodyContent?.trim()) return
  setSubmitting(true)
  try {
   const res = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     content: bodyContent.trim(),
     postType,
     postId,
     parentId: parentId || undefined,
     kind: parentId ? "ANSWER" : kind,
     imageUrl: parentId ? undefined : imageUrl,
     captchaToken: captcha.required ? captcha.token : undefined,
     captchaAnswer: captcha.required ? captchaAnswer : undefined,
     path: path || window.location.pathname,
    }),
   })
   const json = await res.json()

   if (res.status === 429 || json.code === "CAPTCHA_REQUIRED") {
    if (json.code === "CAPTCHA_REQUIRED" || res.status === 429) {
     const capRes = await fetch("/api/comments/captcha")
     const capJson = await capRes.json()
     setCaptcha({ required: true, question: capJson.data.question, token: capJson.data.token })
    }
    toast(json.error || "Please verify you are human", "destructive")
    return
   }

   if (!json.success) {
    toast(json.error || "Failed to post", "destructive")
    return
   }

   if (parentId) {
    setComments((prev) =>
     prev.map((c) =>
      c.id === parentId
       ? {
         ...c,
         replyCount: c.replyCount + 1,
         replies: [...(c.replies || []), json.data],
         visibleReplyCount: (c.visibleReplyCount || 0) + 1,
        }
       : c
     )
    )
   } else if (json.data.pendingReview) {
    toast("Your comment is held for review by moderators", "default")
   } else {
    setComments((prev) => [
     { ...json.data, replies: [], visibleReplyCount: 0 },
     ...prev.filter((c) => c.id !== json.data.id),
    ])
    setMeta((m) => ({ ...m, total: m.total + 1 }))
   }

   if (!parentId) {
    setContent("")
    setImageUrl(null)
    setKind("GENERAL")
    setComposerExpanded(false)
   }
   if (captcha.required && !json.code) {
    setCaptcha({ required: false })
    setCaptchaAnswer("")
   }
  } catch {
   toast("Failed to post comment", "destructive")
  } finally {
   setSubmitting(false)
  }
 }

 async function handleUpvote(id: string) {
  const res = await fetch(`/api/comments/${id}/upvote`, { method: "POST" })
  const json = await res.json()
  if (json.success) {
   const updateComment = (c: CommentDTO): CommentDTO => {
    if (c.id === id) {
     return {
      ...c,
      hasUpvoted: json.data.hasUpvoted,
      upvoteCount: c.upvoteCount + (json.data.hasUpvoted ? 1 : -1),
     }
    }
    return { ...c, replies: c.replies?.map(updateComment) }
   }
   setComments((prev) => prev.map(updateComment))
  } else {
   toast(json.error, "destructive")
  }
 }

 async function handleReport(id: string) {
  if (!confirm("Report this comment for moderation review?")) return
  const res = await fetch(`/api/comments/${id}/report`, { method: "POST" })
  const json = await res.json()
  if (json.success) toast("Reported — our moderators will review it.", "success")
  else toast(json.error, "destructive")
 }

 async function handleDelete(id: string) {
  const res = await fetch(`/api/comments/${id}`, { method: "DELETE" })
  const json = await res.json()
  if (json.success) {
   setComments((prev) =>
    prev
     .filter((c) => c.id !== id)
     .map((c) =>
      c.replies?.some((r) => r.id === id)
       ? { ...c, replyCount: c.replyCount - 1, replies: c.replies!.filter((r) => r.id !== id) }
       : c.replies?.some((r) => r.parentId === id)
        ? { ...c, replyCount: Math.max(0, c.replyCount - 1), replies: c.replies!.filter((r) => r.parentId !== id) }
        : c
     )
   )
   setMeta((m) => ({ ...m, total: Math.max(0, m.total - 1) }))
   toast("Comment deleted", "success")
  } else {
   toast(json.error, "destructive")
  }
 }

 function handleEdit(id: string, newContent: string) {
  if (!newContent) return
  fetch(`/api/comments/${id}`, {
   method: "PATCH",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ content: newContent }),
  })
   .then((r) => r.json())
   .then((json) => {
    if (json.success) {
     const update = (c: CommentDTO): CommentDTO =>
      c.id === id
       ? { ...c, content: newContent, editedAt: new Date().toISOString() }
       : { ...c, replies: c.replies?.map(update) }
     setComments((prev) => prev.map(update))
     toast("Comment updated", "success")
    } else {
     toast(json.error, "destructive")
    }
   })
 }

 function handleBestAnswer(id: string) {
  fetch(`/api/comments/${id}/best-answer`, { method: "POST" })
   .then((r) => r.json())
   .then((json) => {
    if (json.success) {
     fetchComments()
     toast(json.data.isBestAnswer ? "Marked as best answer" : "Best answer removed", "success")
    } else {
     toast(json.error, "destructive")
    }
   })
 }

 async function toggleFollow() {
  const res = await fetch("/api/comments/follow", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ postType, postId }),
  })
  const json = await res.json()
  if (json.success) {
   setMeta((m) => ({ ...m, following: json.data.following }))
   toast(json.data.following ? "You'll be notified of new comments" : "Unfollowed", "success")
  } else {
   toast(json.error, "destructive")
  }
 }

 async function toggleLock() {
  const res = await fetch("/api/admin/discussion", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ action: meta.locked ? "unlock" : "lock", postType, postId }),
  })
  const json = await res.json()
  if (json.success) setMeta((m) => ({ ...m, locked: json.data.locked }))
 }

 async function bulkDeleteFlagged() {
  const res = await fetch(`/api/admin/discussion?postType=${postType}&postId=${postId}`)
  const json = await res.json()
  if (!json.success || json.data.length === 0) {
   toast("No flagged comments pending review", "default")
   return
  }
  if (!confirm(`Delete ${json.data.length} flagged comment(s)?`)) return
  const del = await fetch("/api/admin/discussion", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ action: "bulkDelete", commentIds: json.data.map((c: CommentDTO) => c.id) }),
  })
  const delJson = await del.json()
  if (delJson.success) {
   toast(`Deleted ${delJson.data.deleted} flagged comments`, "success")
   fetchComments()
  }
 }

 const currentSort = SORTS.find((s) => s.key === sort) || SORTS[0]

 return (
  <section className="mt-8">
   <div className="overflow-hidden border border-rule bg-background dark:border-ink dark:bg-ink">
    {/* ─── Header ─── */}
    <div className="border-b border-rule bg-ink px-4 py-3 dark:border-ink dark:bg-paper-2">
     <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-display text-base font-bold text-paper dark:text-foreground">
       <MessageCircle className="h-5 w-5" />
       Discussion
       <span className="border border-paper/30 px-2 py-0.5 text-xs font-bold tabular-nums text-paper/80 dark:border-rule dark:text-muted-foreground">
        {meta.total}
       </span>
      </h2>
      <div className="flex items-center gap-2">
       {/* Live indicator */}
       <span className="flex items-center gap-1.5 border border-paper/20 px-2 py-0.5 dark:border-rule">
        <span className={cn(
         "h-2 w-2",
         connected
          ? "bg-brick-ink dark:bg-brick animate-pulse"
          : "bg-brick dark:bg-brick"
        )} style={connected ? { boxShadow: "0 0 4px var(--color-brick)" } : undefined} />
        <span className="text-[11px] font-semibold text-paper/90 dark:text-muted-foreground">
         {connected ? "Live" : reconnecting ? "Reconnecting…" : "Offline"}
        </span>
       </span>
       {/* Follow */}
       {currentUserId && (
        <button
         type="button"
         onClick={toggleFollow}
         className={cn(
          "flex items-center gap-1 border px-2.5 py-1 text-[11px] font-bold transition-colors",
          meta.following
           ? "border-brick bg-brick text-brick-ink"
           : "border-paper/30 text-paper hover:bg-paper/10 dark:border-rule dark:text-foreground dark:hover:bg-paper-3"
         )}
        >
         {meta.following ? <BellOff className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
         {meta.following ? "Following" : "Follow"}
        </button>
       )}
      </div>
     </div>
    </div>

    {/* ─── Sort bar + filters ─── */}
    <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-paper-2/50 px-4 py-2 dark:border-ink dark:bg-paper-2/50">
     {/* Sort dropdown */}
     <div className="relative" ref={sortRef}>
      <button
       type="button"
       onClick={() => setSortDropdown((v) => !v)}
       className="flex items-center gap-1.5 border border-rule bg-paper-3 px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-paper-2 dark:border-ink dark:bg-paper-3 dark:text-foreground dark:hover:bg-paper-2"
      >
       <currentSort.icon className="h-3.5 w-3.5" />
       {currentSort.label}
       <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {sortDropdown && (
       <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden border border-rule bg-background dark:border-ink dark:bg-ink">
        {SORTS.map((s) => (
         <button
          key={s.key}
          type="button"
          onClick={() => { setSort(s.key); setSortDropdown(false) }}
          className={cn(
           "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
           sort === s.key
            ? "bg-brick text-brick-ink font-bold"
            : "text-foreground hover:bg-paper-2 dark:text-foreground dark:hover:bg-paper-3"
          )}
         >
          <s.icon className="h-3.5 w-3.5" />
          {s.label}
         </button>
        ))}
       </div>
      )}
     </div>

     {/* Filter pills */}
     <div className="flex items-center gap-1">
      {FILTERS.map((f) => (
       <button
        key={f.key}
        type="button"
        onClick={() => setFilter(f.key)}
        className={cn(
         "border px-2.5 py-1 text-[11px] font-bold transition-colors",
         filter === f.key
          ? "border-ink bg-ink text-paper dark:border-rule dark:bg-foreground dark:text-background"
          : "border-rule text-muted-foreground hover:border-ink hover:text-foreground dark:border-ink dark:text-muted-foreground dark:hover:border-rule dark:hover:text-foreground"
        )}
       >
        {f.label}
       </button>
      ))}
     </div>

     {/* Search */}
     <div className="ml-auto flex items-center gap-1.5">
      {searchOpen ? (
       <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
         value={searchInput}
         onChange={(e) => setSearchInput(e.target.value)}
         placeholder="Search comments…"
         className="h-8 w-48 pl-8 text-xs"
         autoFocus
        />
        <button
         type="button"
         onClick={() => { setSearchOpen(false); setSearchInput(""); setSearch("") }}
         className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
         <X className="h-3 w-3" />
        </button>
       </div>
      ) : (
       <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="p-1.5 text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground"
       >
        <Search className="h-4 w-4" />
       </button>
      )}

      {/* Admin controls */}
      {meta.isAdmin && (
       <>
        <button
         type="button"
         onClick={toggleLock}
         className="flex items-center gap-1 border border-brick px-2.5 py-1 text-[11px] font-bold text-brick transition-colors hover:bg-brick hover:text-brick-ink"
        >
         <Lock className="h-3 w-3" />
         {meta.locked ? "Unlock" : "Lock"}
        </button>
        <button
         type="button"
         onClick={bulkDeleteFlagged}
         className="border border-rule px-2.5 py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:border-ink hover:text-foreground"
        >
         Review flagged
        </button>
       </>
      )}
     </div>
    </div>

    {/* Locked banner */}
    {meta.locked && (
     <div className="flex items-center gap-2 border-b border-brick bg-brick/10 px-4 py-2 text-sm font-semibold text-brick">
      <Lock className="h-4 w-4 shrink-0" />
      This discussion has been locked by moderators. New comments are disabled.
     </div>
    )}

    {/* ─── Composer ─── */}
    <div className="border-b border-rule px-4 py-3 dark:border-ink">
     {currentUserId ? (
      meta.locked ? null : composerExpanded ? (
       <div className="space-y-2">
        {/* Type toggle */}
        <div className="flex items-center gap-2">
         <div className="flex overflow-hidden border border-rule dark:border-ink">
          {(["GENERAL", "QUESTION"] as const).map((k) => (
           <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
             "px-3 py-1 text-xs font-bold transition-colors",
             kind === k
              ? "bg-ink text-paper dark:bg-foreground dark:text-background"
              : "text-muted-foreground hover:bg-paper-2 dark:hover:bg-paper-3"
            )}
           >
            {k === "GENERAL" ? "Comment" : "Question"}
           </button>
          ))}
         </div>
         {imageUrl && (
          <div className="relative">
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img src={imageUrl} alt="" className="h-10 w-10 border border-rule object-cover" />
           <button
            type="button"
            onClick={() => setImageUrl(null)}
            className="absolute -right-1 -top-1 bg-brick p-0.5 text-brick-ink"
           >
            <X className="h-2.5 w-2.5" />
           </button>
          </div>
         )}
        </div>

        {/* Rich composer */}
        <RedditComposer
         value={content}
         onChange={setContent}
         placeholder={kind === "QUESTION" ? "Ask a question about this post…" : "What are your thoughts?"}
         onSubmit={() => submit()}
         onCancel={() => { setComposerExpanded(false); setContent("") }}
         submitLabel={submitting ? "Posting…" : "Comment"}
         disabled={submitting || uploading}
         autoFocus
        />

        {/* Extra actions */}
        <div className="flex items-center gap-2">
         <label className="inline-flex cursor-pointer items-center gap-1.5 border border-rule px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-ink hover:text-foreground dark:border-ink dark:hover:border-rule dark:hover:text-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          {uploading ? "Uploading…" : "Add Image"}
          <input
           type="file"
           accept="image/*"
           className="hidden"
           disabled={uploading || Boolean(imageUrl)}
           onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
          />
         </label>
         {captcha.required && (
          <div className="flex items-center gap-2 border border-rule bg-paper-2 px-3 py-1.5 dark:border-ink dark:bg-paper-2">
           <ShieldCheck className="h-4 w-4 text-muted-foreground" />
           <span className="text-xs text-foreground">{captcha.question}</span>
           <Input
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
            className="h-7 w-20 text-xs"
            placeholder="Answer"
           />
          </div>
         )}
        </div>
       </div>
      ) : (
       /* Collapsed composer — click to expand */
       <div className="flex items-center gap-3">
        <UserBubble session={session} />
        <button
         type="button"
         onClick={() => setComposerExpanded(true)}
         className="flex-1 border border-rule bg-paper-2/50 px-4 py-2.5 text-left text-sm text-muted-foreground transition-all hover:border-ink hover:bg-paper-2 dark:border-ink dark:bg-paper-2 dark:hover:border-rule dark:hover:bg-paper-3"
        >
         Add a comment…
        </button>
       </div>
      )
     ) : (
      <div className="flex items-center gap-3 bg-paper-2/50 px-4 py-3 dark:bg-paper-2">
       <MessageCircle className="h-5 w-5 text-muted-foreground" />
       <p className="text-sm text-foreground">
        <a href="/login" className="font-bold text-brick underline hover:text-brick/80">
         Log in
        </a>{" "}
        or{" "}
        <a href="/register" className="font-bold text-brick underline hover:text-brick/80">
         Sign up
        </a>{" "}
        to join the discussion
       </p>
      </div>
     )}
    </div>

    {/* ─── Pinned comment ─── */}
    {meta.pinnedComment && !search && filter === "all" && (
     <div className="border-b border-l-2 border-b-rule border-l-brick bg-paper-2/50 px-4 dark:border-b-ink">
      <div className="flex items-center gap-1.5 py-1.5">
       <PinIcon className="h-3 w-3 text-brick" />
       <span className="text-[11px] font-bold uppercase tracking-wide text-brick">Pinned by moderators</span>
      </div>
      <CommentItem
       comment={{ ...meta.pinnedComment, replies: [], visibleReplyCount: 0 }}
       depth={0}
       postType={postType}
       postId={postId}
       currentUserId={currentUserId}
       isAdmin={meta.isAdmin}
       locked={meta.locked}
       canMarkBestAnswer={false}
       onUpvote={handleUpvote}
       onReply={submit}
       onReport={handleReport}
       onDelete={handleDelete}
       onEdit={handleEdit}
       onBestAnswer={handleBestAnswer}
       onLoadReplies={loadReplies}
      />
     </div>
    )}

    {/* ─── Comment list ─── */}
    <div className="divide-y divide-rule/50 dark:divide-ink/50">
     {loading && comments.length === 0 ? (
      <div className="space-y-3 px-4 py-4">
       {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-3">
         <div className="h-8 w-8 animate-pulse bg-paper-3 dark:bg-paper-3" />
         <div className="flex-1 space-y-2">
          <div className="h-3 w-32 animate-pulse bg-paper-3 dark:bg-paper-3" />
          <div className="h-4 w-full animate-pulse bg-paper-3 dark:bg-paper-3" />
          <div className="h-4 w-3/4 animate-pulse bg-paper-3 dark:bg-paper-3" />
         </div>
        </div>
       ))}
      </div>
     ) : comments.length === 0 ? (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
       <div className="bg-paper-3 p-4 dark:bg-paper-3">
        <MessageCircle className="h-8 w-8 text-muted-foreground" />
       </div>
       <div>
        <p className="text-sm font-bold text-foreground">No comments yet</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
         Be the first to share your thoughts!
        </p>
       </div>
      </div>
     ) : (
      <div className="px-4">
       {comments.map((comment) => (
        <CommentItem
         key={comment.id}
         comment={comment}
         depth={0}
         postType={postType}
         postId={postId}
         currentUserId={currentUserId}
         isAdmin={meta.isAdmin}
         locked={meta.locked}
         canMarkBestAnswer={false}
         onUpvote={handleUpvote}
         onReply={(parentId, text) => submit(parentId, text)}
         onReport={handleReport}
         onDelete={handleDelete}
         onEdit={handleEdit}
         onBestAnswer={handleBestAnswer}
         onLoadReplies={loadReplies}
        />
       ))}
      </div>
     )}
    </div>

    {/* Load more */}
    {nextCursor && (
     <div className="border-t border-rule px-4 py-3 text-center dark:border-ink">
      <Button
       variant="outline"
       onClick={() => fetchComments({ cursor: nextCursor, append: true })}
       className="px-6 text-xs font-bold"
      >
       Load more comments
      </Button>
     </div>
    )}

    {/* Footer */}
    <div className="flex items-center justify-between border-t border-rule bg-paper-2/30 px-4 py-2 dark:border-ink dark:bg-paper-2/30">
     <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
      <span className="font-semibold">{meta.total} comment{meta.total !== 1 && "s"}</span>
      <span>·</span>
      <span className="flex items-center gap-1">
       <Zap className="h-3 w-3" />
       Real-time {connected ? "active" : "paused"}
      </span>
     </div>
     <span className="text-[11px] text-muted-foreground">
      Sorted by {currentSort.label.toLowerCase()}
     </span>
    </div>
   </div>
  </section>
 )
}

function UserBubble({ session }: { session: any }) {
 const user = session?.user
 if (!user) return null
 if (user.image) {
  return (
   /* eslint-disable-next-line @next/next/no-img-element */
   <img src={user.image} alt={user.name || ""} className="h-8 w-8 object-cover" />
  )
 }
 const name = user.name || "U"
 return (
  <span className="flex h-8 w-8 items-center justify-center bg-ink text-xs font-bold text-paper dark:bg-paper-3 dark:text-foreground">
   {name.charAt(0).toUpperCase()}
  </span>
 )
}

function PinIcon({ className }: { className?: string }) {
 return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
   <line x1="12" y1="17" x2="12" y2="22" />
   <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
  </svg>
 )
}
