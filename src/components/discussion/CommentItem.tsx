"use client"

import { useState } from "react"
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
import type { CommentDTO, PostType } from "./types"

const REPUTATION_THRESHOLD = 50

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

/** Renders content with @mentions highlighted */
function renderContent(content: string): React.ReactNode[] {
  return content.split(/(@[\w\s.-]{2,40}?)(?=\s|$)/g).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-medium text-blue-700">
        {part}
      </span>
    ) : (
      part
    )
  )
}

interface CommentItemProps {
  comment: CommentDTO
  isReply?: boolean
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
  onLoadReplies: (parentId: string) => Promise<CommentDTO[]>
}

export function CommentItem({
  comment,
  isReply = false,
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
  const [allLoaded, setAllLoaded] = useState(
    (comment.visibleReplyCount || 0) >= comment.replyCount
  )
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [menuOpen, setMenuOpen] = useState(false)

  const withinEditWindow = comment.canEdit ?? false

  async function submitReply() {
    if (!replyText.trim()) return
    await onReply(comment.id, replyText.trim())
    setReplyText("")
    setReplyOpen(false)
  }

  async function loadMoreReplies() {
    const all = await onLoadReplies(comment.id)
    setReplyList(all)
    setAllLoaded(true)
  }

  const showThreadControls =
    !isReply && !locked && currentUserId && comment.status === "APPROVED"

  return (
    <div className={isReply ? "" : "py-4 first:pt-0"}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className={
            isReply
              ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600"
              : comment.isOfficial
                ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white"
                : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700"
          }
        >
          {comment.isOfficial ? <ShieldCheck className="h-4 w-4" /> : initials(comment.user.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={
              comment.isPinned || isReply
                ? ""
                : "rounded-lg rounded-tl-none border border-transparent px-3 py-2"
            }
          >
            {/* Name row */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-medium text-gray-900">{comment.user.name}</span>
              {comment.isOfficial && (
                <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">
                  <ShieldCheck className="h-3 w-3" /> Chayan team
                </span>
              )}
              {!comment.isOfficial && comment.user.helpfulCount >= REPUTATION_THRESHOLD && (
                <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                  <BadgeCheck className="h-3 w-3" />
                  {Math.floor(comment.user.helpfulCount / REPUTATION_THRESHOLD) * REPUTATION_THRESHOLD}
                  + helpful answers
                </span>
              )}
              {comment.isBestAnswer && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Best answer
                </span>
              )}
              {comment.kind === "QUESTION" && !isReply && (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                  Question
                </span>
              )}
              <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
              {comment.editedAt && <span className="text-xs italic text-gray-400">(edited)</span>}
            </div>

            {/* Body */}
            {editing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onEdit(comment.id, editText.trim())
                      setEditing(false)
                    }}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600">
                {renderContent(comment.content)}
              </p>
            )}

            {/* Image attachment */}
            {comment.imageUrl && (
              <a href={comment.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={comment.imageUrl}
                  alt="Attachment"
                  className="max-h-48 max-w-xs cursor-zoom-in rounded-md border border-gray-200 object-cover"
                />
              </a>
            )}
          </div>

          {/* Action row — no downvotes by design */}
          {comment.status === "APPROVED" && !editing && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-gray-500">
              <button
                type="button"
                onClick={() => onUpvote(comment.id)}
                disabled={!currentUserId}
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 ${
                  comment.hasUpvoted ? "text-blue-700" : ""
                }`}
              >
                <ArrowBigUp className={`h-4 w-4 ${comment.hasUpvoted ? "fill-blue-100" : ""}`} />
                {comment.upvoteCount > 0 ? comment.upvoteCount : "Helpful"}
              </button>

              {showThreadControls && (
                <button
                  type="button"
                  onClick={() => setReplyOpen((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Reply
                </button>
              )}

              {canMarkBestAnswer && isReply && comment.parentId && (
                <button
                  type="button"
                  onClick={() => onBestAnswer(comment.id)}
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-gray-100 hover:text-gray-900 ${
                    comment.isBestAnswer ? "text-emerald-700" : ""
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {comment.isBestAnswer ? "Unmark" : "Best answer"}
                </button>
              )}

              {(withinEditWindow || isAdmin) && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                  {menuOpen && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                      {withinEditWindow && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false)
                            setEditText(comment.content)
                            setEditing(true)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                          <span className="ml-auto text-[10px] text-gray-400">15 min</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          if (confirm("Delete this comment?")) onDelete(comment.id)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!comment.isOwn && currentUserId && (
                <button
                  type="button"
                  onClick={() => onReport(comment.id)}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <Flag className="h-3.5 w-3.5" /> Report
                </button>
              )}

              {isAdmin && !isReply && (
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
                  className="ml-1 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-blue-700 transition-colors hover:bg-blue-50"
                >
                  <Pin className="h-3.5 w-3.5" /> {comment.isPinned ? "Unpin" : "Pin"}
                </button>
              )}
            </div>
          )}

          {comment.status === "PENDING_REVIEW" && (
            <p className="mt-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
              This comment is held for moderation review{comment.flaggedReasons.length > 0 ? ` (${comment.flaggedReasons.join(", ").replace(/_/g, " ")})` : ""}.
            </p>
          )}

          {/* Reply composer */}
          {replyOpen && currentUserId && (
            <div className="mt-2 flex gap-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${comment.user.name}… use @name to mention`}
                rows={2}
                className="min-h-0 text-sm"
              />
              <Button size="sm" onClick={submitReply} disabled={!replyText.trim()}>
                Send
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies — one level deep */}
      {replyList.length > 0 && (
        <div className="ml-6 mt-3 space-y-3 border-l border-gray-100 pl-4 sm:ml-12">
          {replyList.map((r) => (
            <CommentItem
              key={r.id}
              comment={{ ...r, replies: [] }}
              isReply
              postType={postType}
              postId={postId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              locked={locked}
              canMarkBestAnswer={
                (currentUserId && currentUserId === comment.user.id) || isAdmin
              }
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

      {!isReply && !allLoaded && comment.replyCount > (comment.visibleReplyCount || 0) && (
        <button
          type="button"
          onClick={loadMoreReplies}
          className="ml-6 mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:underline sm:ml-12"
        >
          <CornerDownRight className="h-3.5 w-3.5" />
          View {comment.replyCount - Math.max(replyList.length, comment.visibleReplyCount || 0)} more{" "}
          {comment.replyCount - (comment.visibleReplyCount || 0) === 1 ? "reply" : "replies"}
        </button>
      )}
      {isReply && <span className="hidden" aria-hidden />}
    </div>
  )
}
