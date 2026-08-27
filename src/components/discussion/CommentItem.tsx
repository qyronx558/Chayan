"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  ArrowBigUp,
  BadgeCheck,
  CheckCircle2,
  CornerDownRight,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import type { CommentDTO, PostType } from "./types"

const REPUTATION_THRESHOLD = 50
const MAX_INDENT_LEVEL = 6
const REPLIES_PAGE_SIZE = 5

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function TimeAgo({ date }: { date: string | Date }) {
  const [timeAgo, setTimeAgo] = useState("")

  useEffect(() => {
    const update = () => setTimeAgo(formatDistanceToNow(new Date(date), { addSuffix: true }))
    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [date])

  return <span className="text-xs text-gray-400">{timeAgo}</span>
}

interface CommentItemProps {
  comment: CommentDTO
  depth: number
  postType: PostType
  postId: string
  currentUserId?: string | null
  isAdmin: boolean
  locked: boolean
  canMarkBestAnswer: boolean
  onUpvote: (id: string) => void
  onReply: (parentId: string, content: string) => Promise<void>
  onReport: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, content: string) => void
  onBestAnswer: (id: string) => void
  onLoadReplies: (parentId: string, cursor?: string) => Promise<{ comments: CommentDTO[]; nextCursor: string | null }>
}

export function CommentItem({
  comment,
  depth = 0,
  postType,
  postId,
  currentUserId,
  isAdmin,
  locked,
  canMarkBestAnswer,
  onUpvote,
  onReply,
  onReport,
  onDelete,
  onEdit,
  onBestAnswer,
  onLoadReplies,
}: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replyList, setReplyList] = useState<CommentDTO[]>(comment.replies || [])
  const [replyCursor, setReplyCursor] = useState<string | null>(comment.replyNextCursor || null)
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [menuOpen, setMenuOpen] = useState(false)

  const withinEditWindow = comment.canEdit ?? false
  const isNested = depth > 0
  const hasMoreReplies = replyCursor !== null && replyList.length < comment.replyCount

  async function submitReply() {
    if (!replyText.trim()) return
    await onReply(comment.id, replyText.trim())
    setReplyText("")
    setReplyOpen(false)
  }

  async function loadMoreReplies() {
    if (loadingReplies || !replyCursor) return
    setLoadingReplies(true)
    try {
      const { comments: newReplies, nextCursor } = await onLoadReplies(comment.id, replyCursor)
      setReplyList((prev) => [...prev, ...newReplies])
      setReplyCursor(nextCursor)
    } finally {
      setLoadingReplies(false)
    }
  }

  const showThreadControls = !locked && currentUserId && comment.status === "APPROVED"

  return (
    <div
      className={cn(
        "group",
        isNested && "pl-4 border-l-2 border-gray-100 dark:border-gray-700",
        depth > MAX_INDENT_LEVEL && "max-w-[calc(100%-1.5rem)]"
      )}
      style={depth > MAX_INDENT_LEVEL ? { marginLeft: `${MAX_INDENT_LEVEL * 1.5}rem` } : undefined}
    >
      <div className="relative flex gap-3">
        {/* Depth indicator line for nested replies */}
        {isNested && (
          <div className="absolute left-[-6px] top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-700 rounded-full" />
        )}

        {/* Avatar column - fixed width for alignment */}
        <div className="flex shrink-0 w-10">
          <div
            className={cn(
              "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold select-none",
              comment.isOfficial
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs shadow-sm shadow-blue-500/30"
                : isNested
                  ? "bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-700"
                  : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-xs text-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700"
            )}
          >
            {comment.isOfficial ? (
              <ShieldCheck className="h-4 w-4 mx-auto" />
            ) : (
              <span className="mx-auto leading-none">{initials(comment.user.name)}</span>
            )}
          </div>
        </div>

        {/* Comment content - flexible width */}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "relative rounded-xl p-3 transition-all duration-200",
              comment.isOfficial
                ? "bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50"
                : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
            )}
          >
            {/* Official badge */}
            {comment.isOfficial && (
              <div className="absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white">
                <ShieldCheck className="h-3 w-3" />
                Chayan team
              </div>
            )}

            {/* Header row */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">{comment.user.name}</span>

              {!comment.isOfficial && comment.user.helpfulCount >= REPUTATION_THRESHOLD && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/80 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-800/50">
                  <BadgeCheck className="h-3 w-3" />
                  {Math.floor(comment.user.helpfulCount / REPUTATION_THRESHOLD) * REPUTATION_THRESHOLD}+ helpful
                </span>
              )}

              {comment.isBestAnswer && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/80 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-800/50">
                  <CheckCircle2 className="h-3 w-3" /> Best answer
                </span>
              )}

              {comment.kind === "QUESTION" && depth === 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50/80 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/50 dark:ring-amber-800/50">
                  Question
                </span>
              )}

              <TimeAgo date={comment.createdAt} />
              {comment.editedAt && (
                <span className="text-xs italic text-gray-400 dark:text-gray-500">(edited)</span>
              )}
            </div>

            {/* Body */}
            {editing ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    onClick={() => {
                      onEdit(comment.id, editText.trim())
                      setEditing(false)
                    }}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {comment.content.split(/(@[\w\s.-]{2,40}?)(?=\s|$)/g).map((part, i) =>
                  part.startsWith("@") ? (
                    <span key={i} className="font-medium text-blue-600 dark:text-blue-400">
                      {part}
                    </span>
                  ) : (
                    part
                  )
                )}
              </p>
            )}

            {/* Image attachment */}
            {comment.imageUrl && (
              <a href={comment.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                <img
                  src={comment.imageUrl}
                  alt="Attachment"
                  className="max-h-48 max-w-xs cursor-zoom-in rounded-lg border border-gray-200 dark:border-gray-700 object-cover shadow-sm"
                />
              </a>
            )}

            {/* Pending review notice */}
            {comment.status === "PENDING_REVIEW" && (
              <div className="mt-2 rounded-lg bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-800/50 px-3 py-2">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  This comment is held for moderation review{comment.flaggedReasons.length > 0 ? ` (${comment.flaggedReasons.join(", ").replace(/_/g, " ")})` : ""}.
                </p>
              </div>
            )}
          </div>

          {/* Action row */}
          {comment.status === "APPROVED" && !editing && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {/* Upvote */}
              <button
                type="button"
                onClick={() => onUpvote(comment.id)}
                disabled={!currentUserId}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  currentUserId
                    ? comment.hasUpvoted
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800/50"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                <ArrowBigUp className={cn("h-4 w-4", comment.hasUpvoted ? "fill-current" : "")} />
                {comment.upvoteCount > 0 ? comment.upvoteCount : "Helpful"}
              </button>

              {/* Reply button */}
              {showThreadControls && (
                <button
                  type="button"
                  onClick={() => setReplyOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Reply
                </button>
              )}

              {/* Best answer */}
              {canMarkBestAnswer && comment.parentId && (
                <button
                  type="button"
                  onClick={() => onBestAnswer(comment.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    comment.isBestAnswer
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-800/50"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {comment.isBestAnswer ? "Unmark" : "Best answer"}
                </button>
              )}

              {/* More menu */}
              {(withinEditWindow || isAdmin) && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full z-10 mt-1.5 w-40 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg ring-1 ring-gray-200/50 dark:ring-gray-700/50">
                      {withinEditWindow && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false)
                            setEditText(comment.content)
                            setEditing(true)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Pencil className="h-4 w-4" /> Edit
                          <span className="ml-auto text-xs text-gray-400">15 min</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          if (confirm("Delete this comment?")) onDelete(comment.id)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Report */}
              {!comment.isOwn && currentUserId && (
                <button
                  type="button"
                  onClick={() => onReport(comment.id)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Report
                </button>
              )}

              {/* Admin pin */}
              {isAdmin && depth === 0 && (
                <button
                  type="button"
                  onClick={() =>
                    fetch("/api/admin/discussion", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(
                        comment.isPinned
                          ? { action: "unpin", commentId: comment.id }
                          : { action: "pin", commentId: comment.id, postType, postId },
                      ),
                    }).then(() => toast(comment.isPinned ? "Comment unpinned" : "Comment pinned", "success"))
                  }
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Pin className="h-3.5 w-3.5" />
                  {comment.isPinned ? "Unpin" : "Pin"}
                </button>
              )}
            </div>
          )}

          {/* Reply composer */}
          {replyOpen && currentUserId && (
            <div className="mt-3 flex gap-2">
              <div className="flex-1 relative">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.user.name}… use @name to mention`}
                  rows={2}
                  className="pr-20 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20"
                />
                <Button
                  size="sm"
                  onClick={submitReply}
                  disabled={!replyText.trim()}
                  className="absolute right-1 bottom-1 h-8 px-3"
                >
                  Send
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {replyList.length > 0 && (
        <div className="mt-3 space-y-3">
          {replyList.map((r) => (
            <CommentItem
              key={r.id}
              comment={{ ...r, replies: r.replies || [] }}
              depth={depth + 1}
              postType={postType}
              postId={postId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              locked={locked}
              canMarkBestAnswer={(currentUserId && currentUserId === comment.user.id) || isAdmin}
              onUpvote={onUpvote}
              onReply={onReply}
              onReport={onReport}
              onDelete={onDelete}
              onEdit={onEdit}
              onBestAnswer={onBestAnswer}
              onLoadReplies={onLoadReplies}
            />
          ))}
        </div>
      )}

      {/* Load more replies button */}
      {hasMoreReplies && (
        <button
          type="button"
          onClick={loadMoreReplies}
          disabled={loadingReplies}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
        >
          <CornerDownRight className="h-3.5 w-3.5" />
          {loadingReplies ? "Loading…" : `View ${Math.min(REPLIES_PAGE_SIZE, comment.replyCount - replyList.length)} more ${comment.replyCount - replyList.length === 1 ? "reply" : "replies"}`}
        </button>
      )}

      {/* Hidden count */}
      {!hasMoreReplies && replyList.length > 0 && comment.replyCount > replyList.length && (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          {comment.replyCount - replyList.length} more {comment.replyCount - replyList.length === 1 ? "reply" : "replies"} hidden
        </p>
      )}
    </div>
  )
}