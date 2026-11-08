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
 Minus,
 MoreHorizontal,
 Pencil,
 Pin,
 Plus,
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

 return <span className="agate text-[11px] text-muted-foreground">{timeAgo}</span>
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

/**
 * Reddit-style comment row: slim vote rail on the left, single meta
 * line (avatar + user + time), collapsible body, thread line for
 * nested replies. All data handling unchanged - presentation only.
 */
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
 const [collapsed, setCollapsed] = useState(false)

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
 const childCount = Math.max(comment.replyCount, replyList.length)

 return (
  <div
   className={cn(
    "py-2",
    isNested && "ml-1 border-l border-rule pl-2 hover:border-rule-2",
    depth > MAX_INDENT_LEVEL && "max-w-[calc(100%-1.5rem)]"
   )}
   style={depth > MAX_INDENT_LEVEL ? { marginLeft: `${MAX_INDENT_LEVEL * 1.5}rem` } : undefined}
  >
   <div className="flex gap-1.5">
    {/* ── Vote rail ── */}
    <div className="flex w-6 shrink-0 flex-col items-center pt-0.5">
     <button
      type="button"
      onClick={() => onUpvote(comment.id)}
      disabled={!currentUserId}
      aria-label="Upvote"
      className={cn(
       "rounded p-0.5 transition-colors",
       currentUserId
        ? comment.hasUpvoted
         ? "text-brick"
         : "text-muted-foreground hover:text-brick"
        : "cursor-not-allowed opacity-50"
      )}
     >
      <ArrowBigUp className={cn("h-4 w-4", comment.hasUpvoted && "fill-current")} />
     </button>
     <span className={cn(
      "text-[11px] font-bold tabular-nums",
      comment.hasUpvoted ? "text-brick" : "text-muted-foreground"
     )}>
      {comment.upvoteCount > 0 ? comment.upvoteCount : "•"}
     </span>
    </div>

    {/* ── Content ── */}
    <div className="min-w-0 flex-1">
     {/* Meta line */}
     <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <button
       type="button"
       onClick={() => setCollapsed((v) => !v)}
       aria-label={collapsed ? "Expand comment" : "Collapse comment"}
       className="p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      >
       {collapsed ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      </button>
      <span
       className={cn(
        "flex h-5 w-5 items-center justify-center text-[8px] font-bold select-none",
        comment.isOfficial
         ? "bg-ink text-paper"
         : "border border-rule text-muted-foreground"
       )}
      >
       {comment.isOfficial ? <ShieldCheck className="h-3 w-3" /> : initials(comment.user.name)}
      </span>
      <span className="text-xs font-medium text-foreground">{comment.user.name}</span>

      {!comment.isOfficial && comment.user.helpfulCount >= REPUTATION_THRESHOLD && (
       <span className="agate inline-flex items-center gap-0.5 border border-rule px-1.5 py-px text-[10px] text-muted-foreground">
        <BadgeCheck className="h-2.5 w-2.5" />
        {Math.floor(comment.user.helpfulCount / REPUTATION_THRESHOLD) * REPUTATION_THRESHOLD}+ helpful
       </span>
      )}

      {comment.isOfficial && (
       <span className="agate border border-brick px-1.5 py-px text-[10px] text-brick">
        ChayanJobs team
       </span>
      )}

      {comment.isBestAnswer && (
       <span className="agate inline-flex items-center gap-0.5 border border-rule px-1.5 py-px text-[10px] text-muted-foreground">
        <CheckCircle2 className="h-2.5 w-2.5" /> Best answer
       </span>
      )}

      {comment.kind === "QUESTION" && depth === 0 && (
       <span className="agate border border-rule px-1.5 py-px text-[10px] text-muted-foreground">
        Question
       </span>
      )}

      <TimeAgo date={comment.createdAt} />
      {comment.editedAt && (
       <span className="agate text-[11px] italic text-muted-foreground">(edited)</span>
      )}
      {collapsed && childCount > 0 && (
       <span className="agate text-[11px] text-muted-foreground">({childCount} {childCount === 1 ? "reply" : "replies"})</span>
      )}
     </div>

     {!collapsed && (
      <>
       {/* Body */}
       <div className={cn(
        "mt-1 rounded-lg px-2.5 py-1.5",
        comment.isOfficial && "border border-brick bg-paper-2"
       )}>
        {editing ? (
         <div className="space-y-1.5 py-1">
          <Textarea
           value={editText}
           onChange={(e) => setEditText(e.target.value)}
           rows={2}
           className="bg-background text-[13px]"
          />
          <div className="flex justify-end gap-1.5">
           <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
             onEdit(comment.id, editText.trim())
             setEditing(false)
            }}
           >
            Save
           </Button>
           <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>
            Cancel
           </Button>
          </div>
         </div>
        ) : (
         <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground">
          {comment.content.split(/(@[\w\s.-]{2,40}?)(?=\s|$)/g).map((part, i) =>
           part.startsWith("@") ? (
            <span key={i} className="font-medium text-brick">
             {part}
            </span>
           ) : (
            part
           )
          )}
         </p>
        )}

        {comment.imageUrl && (
         <a href={comment.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
           src={comment.imageUrl}
           alt="Attachment"
           className="max-h-36 max-w-[240px] cursor-zoom-in border border-rule object-cover"
          />
         </a>
        )}

        {comment.status === "PENDING_REVIEW" && (
         <p className="mt-1.5 border border-brick bg-paper-2 px-2 py-1 text-[11px] text-brick">
          Held for moderation review{comment.flaggedReasons.length > 0 ? ` (${comment.flaggedReasons.join(", ").replace(/_/g, " ")})` : ""}.
         </p>
        )}
       </div>

       {/* Action row */}
       {comment.status === "APPROVED" && !editing && (
        <div className="mt-0.5 flex flex-wrap items-center">
         {showThreadControls && (
          <button
           type="button"
           onClick={() => setReplyOpen((v) => !v)}
           className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-brick"
          >
           <MessageSquare className="h-3 w-3" />
           Reply
          </button>
         )}

         {canMarkBestAnswer && comment.parentId && (
          <button
           type="button"
           onClick={() => onBestAnswer(comment.id)}
           className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors",
            comment.isBestAnswer
             ? "text-foreground dark:text-foreground"
             : "text-muted-foreground hover:text-brick"
           )}
          >
           <CheckCircle2 className="h-3 w-3" />
           {comment.isBestAnswer ? "Unmark" : "Best answer"}
          </button>
         )}

         {(withinEditWindow || isAdmin) && (
          <div className="relative">
           <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="More actions"
           >
            <MoreHorizontal className="h-3.5 w-3.5" />
           </button>
           {menuOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 w-36 overflow-hidden border border-rule bg-background">
             {withinEditWindow && (
              <button
               type="button"
               onClick={() => {
                setMenuOpen(false)
                setEditText(comment.content)
                setEditing(true)
               }}
               className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground hover:bg-paper-2"
              >
               <Pencil className="h-3.5 w-3.5" /> Edit
               <span className="agate ml-auto text-[10px] text-muted-foreground">15 min</span>
              </button>
             )}
             <button
              type="button"
              onClick={() => {
               setMenuOpen(false)
               if (confirm("Delete this comment?")) onDelete(comment.id)
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-brick hover:bg-paper-2"
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
           className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-brick"
          >
           <Flag className="h-3 w-3" />
           Report
          </button>
         )}

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
           className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-brick transition-colors hover:underline"
          >
           <Pin className="h-3 w-3" />
           {comment.isPinned ? "Unpin" : "Pin"}
          </button>
         )}
        </div>
       )}

       {/* Reply composer */}
       {replyOpen && currentUserId && (
        <div className="mt-1.5 flex gap-1.5">
         <div className="relative flex-1">
          <Textarea
           value={replyText}
           onChange={(e) => setReplyText(e.target.value)}
           placeholder={`Reply to ${comment.user.name}…`}
           rows={2}
           className="bg-background pr-16 text-[13px]"
          />
          <Button
           size="sm"
           onClick={submitReply}
           disabled={!replyText.trim()}
           className="absolute bottom-1 right-1 h-7 px-3 text-xs"
          >
           Reply
          </Button>
         </div>
        </div>
       )}
      </>
     )}
    </div>
   </div>

   {/* Nested replies */}
   {!collapsed && replyList.length > 0 && (
    <div className="mt-0.5">
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

   {/* Load more replies */}
   {!collapsed && hasMoreReplies && (
    <button
     type="button"
     onClick={loadMoreReplies}
     disabled={loadingReplies}
     className="ml-8 mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brick hover:underline disabled:opacity-50"
    >
     <CornerDownRight className="h-3 w-3" />
     {loadingReplies ? "Loading…" : `View ${Math.min(REPLIES_PAGE_SIZE, comment.replyCount - replyList.length)} more ${comment.replyCount - replyList.length === 1 ? "reply" : "replies"}`}
    </button>
   )}

   {!collapsed && !hasMoreReplies && replyList.length > 0 && comment.replyCount > replyList.length && (
    <p className="ml-8 mt-1 agate text-[11px] text-muted-foreground">
     {comment.replyCount - replyList.length} more {comment.replyCount - replyList.length === 1 ? "reply" : "replies"} hidden
    </p>
   )}
  </div>
 )
}
