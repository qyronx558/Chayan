"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { Image as ImageIcon, Lock, MessageSquare, Search, ShieldCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { CommentItem } from "./CommentItem"
import type {
  CommentDTO,
  FilterKey,
  PostType,
  SortKey,
  ThreadMeta,
} from "./types"

const SORTS: { key: SortKey; label: string }[] = [
  { key: "top", label: "Top" },
  { key: "newest", label: "Newest" },
  { key: "controversial", label: "Controversial" },
]

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "questions", label: "Questions" },
  { key: "answers", label: "Answers" },
  { key: "announcements", label: "Announcements" },
]

/** Client-side image compression: max 1280px, JPEG q0.7 - keeps uploads small before Cloudinary */
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
  const [sort, setSort] = useState<SortKey>("newest")
  const [filter, setFilter] = useState<FilterKey>("all")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  const [content, setContent] = useState("")
  const [kind, setKind] = useState<"GENERAL" | "QUESTION">("GENERAL")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [captcha, setCaptcha] = useState<{
    required: boolean
    question?: string
    token?: string
  }>({ required: false })
  const [captchaAnswer, setCaptchaAnswer] = useState("")

  // SSE event handler - defined before useEffect
  const handleSSEEvent = useCallback((data: any) => {
    // Kept for future granular events, but we now refetch on thread-update
    console.debug("SSE event:", data.type)
  }, [])

  async function loadReplies(parentId: string, cursor?: string) {
    const params = new URLSearchParams({
      postType,
      postId,
      parentId,
    })
    if (cursor) params.set("cursor", cursor)
    const res = await fetch(`/api/comments?${params}`)
    const json = await res.json()
    return json.success ? { comments: json.data.comments, nextCursor: json.data.nextCursor } : { comments: [], nextCursor: null }
  }

  const fetchComments = useCallback(
    async (opts?: { cursor?: string; append?: boolean }) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          postType,
          postId,
          sort,
          filter,
        })
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

  // Keep the live stream listener in sync with the active filters without
  // reconnecting the stream whenever a user changes sort or search.
  const fetchCommentsRef = useRef(fetchComments)
  useEffect(() => {
    fetchCommentsRef.current = fetchComments
  }, [fetchComments])

  useEffect(() => {
    const t = setTimeout(fetchComments, 0)
    return () => clearTimeout(t)
  }, [fetchComments])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // SSE Connection for real-time updates
  useEffect(() => {
    let disposed = false
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined

    const connect = () => {
      if (disposed) return
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const es = new EventSource(`/api/comments/stream?postType=${postType}&postId=${postId}`)
      eventSourceRef.current = es

      es.onopen = () => {
        setConnected(true)
        setReconnecting(false)
      }

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleSSEEvent(data)
        } catch {
          // ignore parse errors
        }
      }

      es.addEventListener("thread-update", (event) => {
        try {
          const data = JSON.parse(event.data)
          setMeta((m) => ({ ...m, total: data.commentCount }))
          // Refetch comments to get latest nested replies
          fetchCommentsRef.current()
        } catch {
          // ignore
        }
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
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
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
      if (json.success) {
        setImageUrl(json.data.url)
      } else {
        toast(json.error || "Upload failed", "destructive")
      }
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
          setCaptcha({
            required: true,
            question: capJson.data.question,
            token: capJson.data.token,
          })
        }
        toast(json.error || "Please verify you are human", "destructive")
        return
      }

      if (!json.success) {
        toast(json.error || "Failed to post", "destructive")
        return
      }

      if (parentId) {
        // Insert reply into the right comment thread
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
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                hasUpvoted: json.data.hasUpvoted,
                upvoteCount: c.upvoteCount + (json.data.hasUpvoted ? 1 : -1),
              }
            : {
                ...c,
                replies: c.replies?.map((r) =>
                  r.id === id
                    ? {
                        ...r,
                        hasUpvoted: json.data.hasUpvoted,
                        upvoteCount: r.upvoteCount + (json.data.hasUpvoted ? 1 : -1),
                      }
                    : r
                ),
              }
        )
      )
    } else {
      toast(json.error, "destructive")
    }
  }

  async function handleReport(id: string) {
    if (!confirm("Report this comment for moderation review?")) return
    const res = await fetch(`/api/comments/${id}/report`, { method: "POST" })
    const json = await res.json()
    if (json.success) toast("Reported. Our moderators will review it.", "success")
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
              ? {
                  ...c,
                  replyCount: c.replyCount - 1,
                  replies: c.replies!.filter((r) => r.id !== id),
                }
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
          // Best answer ordering lives server-side; refresh to re-sort threads
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
      toast(json.data.following ? "Following this discussion" : "Unfollowed", "success")
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
    const res = await fetch(
      `/api/admin/discussion?postType=${postType}&postId=${postId}`
    )
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

  const adminControls = meta.isAdmin

  return (
    <section className="mt-8">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Compact header */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-gray-100 px-3 py-2.5 sm:px-4 dark:border-gray-800">
          <h2 className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100">
            <MessageSquare className="h-4 w-4 text-orange-500" />
            Discussion
            <span className="rounded-full bg-gray-100 px-1.5 py-px text-[11px] font-bold tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {meta.total}
            </span>
          </h2>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="flex overflow-hidden rounded-full border border-gray-200 dark:border-gray-700">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSort(s.key)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    sort === s.key
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {currentUserId && (
              <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={toggleFollow}>
                {meta.following ? "Following" : "Follow"}
              </Button>
            )}
            {adminControls && (
              <>
                <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={toggleLock}>
                  <Lock className="mr-1 h-3 w-3" />
                  {meta.locked ? "Unlock" : "Lock"}
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={bulkDeleteFlagged}>
                  Review flagged
                </Button>
              </>
            )}
            <span className="flex items-center gap-1" title={connected ? "Live updates on" : "Live updates off"}>
              <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-green-500" : "bg-red-500")} />
              <span className="text-[11px] text-gray-400">
                {connected ? "Live" : reconnecting ? "…" : "Off"}
              </span>
            </span>
          </div>
        </div>

        {/* Slim filters + search */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 px-3 py-2 sm:px-4 dark:border-gray-800">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
                filter === f.key
                  ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
                  : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-100"
              )}
            >
              {f.label}
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-48">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search comments…"
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>

        {meta.locked && (
          <div className="flex items-center gap-1.5 border-b border-gray-100 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 sm:px-4 dark:border-gray-800">
            <Lock className="h-3 w-3" /> Locked - new comments are disabled.
          </div>
        )}

        {/* Pinned official comment */}
        {meta.pinnedComment && !search && filter === "all" && (
          <div className="border-b border-l-2 border-b-gray-100 border-l-blue-600 bg-blue-50/60 px-1 py-0.5 sm:px-2 dark:border-gray-800 dark:bg-blue-950/30">
            <CommentItem
              comment={{ ...meta.pinnedComment, replies: [], visibleReplyCount: 0 }}
              depth={0}
              postType={postType}
              postId={postId}
              currentUserId={currentUserId}
              isAdmin={adminControls}
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

        {/* Composer */}
        <div className="border-b border-gray-100 bg-gray-50/60 px-3 py-2.5 sm:px-4 dark:border-gray-800 dark:bg-gray-800/30">
          {currentUserId ? (
            meta.locked ? null : (
              <div className="space-y-1.5">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Join the discussion…"
                  rows={2}
                  maxLength={5000}
                  className="bg-white text-[13px] dark:bg-gray-900"
                />
                {imageUrl && (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="" className="h-20 w-20 rounded-md border border-gray-200 object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-gray-900 p-0.5 text-white"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {captcha.required && (
                  <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                    <ShieldCheck className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{captcha.question}</span>
                    <Input
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      className="h-8 w-20"
                      placeholder="Answer"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                      <ImageIcon className="h-3 w-3" />
                      {uploading ? "…" : "Image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading || Boolean(imageUrl)}
                        onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                      />
                    </label>
                    {!content && (
                      <div className="flex overflow-hidden rounded-full border border-gray-200 dark:border-gray-700">
                        {(["GENERAL", "QUESTION"] as const).map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setKind(k)}
                            className={cn(
                              "px-2 py-1 text-[11px] font-semibold",
                              kind === k ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400"
                            )}
                          >
                            {k === "GENERAL" ? "Comment" : "Question"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button className="h-7 px-3 text-xs" onClick={() => submit()} disabled={!content.trim() || submitting || uploading}>
                    {submitting ? "Posting…" : "Post"}
                  </Button>
                </div>
              </div>
            )
          ) : (
            <p className="rounded-md bg-gray-50 px-3 py-2 text-[13px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <a href="/login" className="font-medium text-blue-700 hover:underline">
                Sign in
              </a>{" "}
              to join the discussion.
            </p>
          )}
        </div>

        {/* Comment list */}
        <div className="divide-y divide-gray-100 px-3 sm:px-4 dark:divide-gray-800">
          {loading && comments.length === 0 ? (
            <div className="space-y-1.5 py-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-50 dark:bg-gray-800" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-gray-500">
              No comments yet - be the first to share.
            </p>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={0}
                postType={postType}
                postId={postId}
                currentUserId={currentUserId}
                isAdmin={adminControls}
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
            ))
          )}
        </div>

        {/* Load more */}
        {nextCursor && (
          <div className="border-t border-gray-100 px-3 py-2 text-center sm:px-4 dark:border-gray-800">
            <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => fetchComments({ cursor: nextCursor, append: true })}>
              Load more comments
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
