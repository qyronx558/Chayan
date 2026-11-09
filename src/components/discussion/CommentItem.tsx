"use client"

import { useEffect, useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
 ArrowBigDown,
 ArrowBigUp,
 Award,
 BadgeCheck,
 Bold,
 CheckCircle2,
 ChevronDown,
 ChevronUp,
 Code,
 CornerDownRight,
 Flag,
 Italic,
 Link2,
 List,
 ListOrdered,
 MessageSquare,
 MoreHorizontal,
 Pencil,
 Pin,
 Quote,
 Share2,
 ShieldCheck,
 Strikethrough,
 Trash2,
} from "lucide-react"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import type { CommentDTO, PostType } from "./types"

const REPUTATION_THRESHOLD = 50
const MAX_INDENT_LEVEL = 8
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
 return <span>{timeAgo}</span>
}

function formatMarkdown(text: string) {
 return text
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/~~(.+?)~~/g, '<del>$1</del>')
  .replace(/`(.+?)`/g, '<code class="bg-paper-3 px-1 py-0.5 text-xs font-mono text-foreground">$1</code>')
  .replace(/^&gt;\s*(.+)/gm, '<blockquote class="border-l-2 border-rule pl-2 italic text-muted-foreground">$1</blockquote>')
  .replace(/@([\w\s.-]{2,40}?)(?=\s|$)/g, '<span class="font-bold text-brick">@$1</span>')
}

function RedditComposer({
 value,
 onChange,
 placeholder,
 onSubmit,
 onCancel,
 submitLabel = "Comment",
 disabled,
 autoFocus,
 compact,
}: {
 value: string
 onChange: (v: string) => void
 placeholder?: string
 onSubmit: () => void
 onCancel?: () => void
 submitLabel?: string
 disabled?: boolean
 autoFocus?: boolean
 compact?: boolean
}) {
 const textareaRef = useRef<HTMLTextAreaElement>(null)
 const [focused, setFocused] = useState(false)

 useEffect(() => {
  if (autoFocus && textareaRef.current) textareaRef.current.focus()
 }, [autoFocus])

 function wrapSelection(before: string, after: string) {
  const ta = textareaRef.current
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = value.substring(start, end)
  const newText = value.substring(0, start) + before + selected + after + value.substring(end)
  onChange(newText)
  setTimeout(() => {
   ta.focus()
   ta.selectionStart = start + before.length
   ta.selectionEnd = end + before.length
  }, 0)
 }

 function insertAtCursor(text: string) {
  const ta = textareaRef.current
  if (!ta) return
  const start = ta.selectionStart
  const newText = value.substring(0, start) + text + value.substring(start)
  onChange(newText)
  setTimeout(() => {
   ta.focus()
   ta.selectionStart = ta.selectionEnd = start + text.length
  }, 0)
 }

 const toolbarButtons = [
  { icon: Bold, action: () => wrapSelection("**", "**"), title: "Bold" },
  { icon: Italic, action: () => wrapSelection("*", "*"), title: "Italic" },
  { icon: Strikethrough, action: () => wrapSelection("~~", "~~"), title: "Strikethrough" },
  { icon: Code, action: () => wrapSelection("`", "`"), title: "Inline code" },
  { icon: Quote, action: () => insertAtCursor("\n> "), title: "Quote" },
  { icon: List, action: () => insertAtCursor("\n- "), title: "Bullet list" },
  { icon: ListOrdered, action: () => insertAtCursor("\n1. "), title: "Numbered list" },
  { icon: Link2, action: () => wrapSelection("[", "](url)"), title: "Link" },
 ]

 const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onSubmit() }
  if (e.key === "Escape" && onCancel) onCancel()
 }

 return (
  <div
   className={cn(
    "overflow-hidden border transition-colors",
    focused ? "border-brick" : "border-rule dark:border-ink"
   )}
  >
   {/* Toolbar */}
   <div className="flex items-center gap-0.5 border-b border-rule bg-paper-2 px-2 py-1 dark:border-ink dark:bg-paper-2">
    {toolbarButtons.map((btn, i) => (
     <button
      key={i}
      type="button"
      onClick={btn.action}
      title={btn.title}
      className="p-1 text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground"
     >
      <btn.icon className="h-3.5 w-3.5" />
     </button>
    ))}
   </div>
   {/* Text area */}
   <textarea
    ref={textareaRef}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
    onKeyDown={handleKeyDown}
    placeholder={placeholder || "What are your thoughts?"}
    rows={compact ? 3 : 4}
    maxLength={10000}
    className={cn(
     "w-full resize-y bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none dark:bg-ink dark:text-foreground",
     compact && "text-[13px]"
    )}
   />
   {/* Footer */}
   <div className="flex items-center justify-between border-t border-rule bg-paper-2/50 px-3 py-1.5 dark:border-ink dark:bg-paper-2/50">
    <span className="text-[11px] text-muted-foreground">
     {value.length > 0 && `${value.length}/10,000`}
     {!value.length && "Markdown · Ctrl+Enter to submit"}
    </span>
    <div className="flex items-center gap-2">
     {onCancel && (
      <button
       type="button"
       onClick={onCancel}
       className="px-3 py-1 text-xs font-bold text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground"
      >
       Cancel
      </button>
     )}
     <button
      type="button"
      onClick={onSubmit}
      disabled={disabled || !value.trim()}
      className={cn(
       "px-4 py-1 text-xs font-bold transition-all",
       value.trim() && !disabled
        ? "bg-brick text-brick-ink hover:bg-brick/80"
        : "cursor-not-allowed bg-paper-3 text-muted-foreground"
      )}
     >
      {submitLabel}
     </button>
    </div>
   </div>
  </div>
 )
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

export { RedditComposer }

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
 const menuRef = useRef<HTMLDivElement>(null)

 const withinEditWindow = comment.canEdit ?? false
 const hasMoreReplies = replyCursor !== null && replyList.length < comment.replyCount
 const childCount = Math.max(comment.replyCount, replyList.length)

 useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
   if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
  }
  if (menuOpen) document.addEventListener("mousedown", handleClickOutside)
  return () => document.removeEventListener("mousedown", handleClickOutside)
 }, [menuOpen])

 useEffect(() => { setReplyList(comment.replies || []) }, [comment.replies])

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

 function handleShare() {
  const url = `${window.location.origin}${window.location.pathname}#comment-${comment.id}`
  navigator.clipboard.writeText(url).then(() => toast("Link copied!", "success"))
 }

 const showThreadControls = !locked && currentUserId && comment.status === "APPROVED"
 const indentPx = Math.min(depth, MAX_INDENT_LEVEL) * 20

 return (
  <div
   id={`comment-${comment.id}`}
   className="group/comment relative"
   style={{ paddingLeft: depth > 0 ? `${indentPx}px` : undefined }}
  >
   {/* Thread line — click to collapse */}
   {depth > 0 && (
    <button
     type="button"
     onClick={() => setCollapsed((v) => !v)}
     className="absolute left-0 top-0 bottom-0 z-10 flex w-5 cursor-pointer items-center justify-center"
     style={{ left: `${indentPx - 12}px` }}
     aria-label={collapsed ? "Expand thread" : "Collapse thread"}
    >
     <div
      className={cn(
       "h-full w-0.5 transition-colors",
       collapsed
        ? "bg-brick"
        : "bg-rule hover:bg-brick dark:bg-ink dark:hover:bg-brick"
      )}
     />
    </button>
   )}

   <div className={cn("py-2", depth === 0 && "pt-3")}>
    {/* Collapsed */}
    {collapsed ? (
     <div className="flex items-center gap-2 py-1">
      <button
       type="button"
       onClick={() => setCollapsed(false)}
       className="flex items-center gap-1 text-[11px] text-brick hover:underline"
      >
       <ChevronDown className="h-3 w-3" />
       <UserAvatar comment={comment} size="xs" />
       <span className="font-bold text-foreground">{comment.user.name}</span>
       <span className="text-muted-foreground">
        · {comment.upvoteCount} point{comment.upvoteCount !== 1 && "s"} · <TimeAgo date={comment.createdAt} />
        {childCount > 0 && <> · {childCount} {childCount === 1 ? "child" : "children"}</>}
       </span>
      </button>
     </div>
    ) : (
     <>
      {/* Comment header */}
      <div className="flex items-start gap-2">
       {/* Vote column — top-level only */}
       {depth === 0 && (
        <div className="flex flex-col items-center gap-0.5 pt-0.5">
         <button
          type="button"
          onClick={() => onUpvote(comment.id)}
          disabled={!currentUserId}
          aria-label="Upvote"
          className={cn(
           "p-0.5 transition-colors",
           currentUserId
            ? comment.hasUpvoted
             ? "text-brick"
             : "text-muted-foreground hover:text-brick"
            : "cursor-not-allowed opacity-40"
          )}
         >
          <ArrowBigUp className={cn("h-5 w-5", comment.hasUpvoted && "fill-current")} />
         </button>
         <span className={cn(
          "text-xs font-bold tabular-nums",
          comment.hasUpvoted ? "text-brick" : "text-foreground"
         )}>
          {comment.upvoteCount}
         </span>
         <button
          type="button"
          disabled={!currentUserId}
          className="p-0.5 text-muted-foreground transition-colors hover:text-ink-2 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Downvote"
         >
          <ArrowBigDown className="h-5 w-5" />
         </button>
        </div>
       )}

       {/* Content */}
       <div className="min-w-0 flex-1">
        {/* User line */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
         <UserAvatar comment={comment} size="sm" />
         <span className="text-xs font-bold text-foreground">{comment.user.name}</span>

         {comment.isOfficial && (
          <span className="inline-flex items-center gap-0.5 border border-brick px-1.5 py-px text-[10px] font-bold text-brick">
           <ShieldCheck className="h-2.5 w-2.5" /> MOD
          </span>
         )}

         {!comment.isOfficial && comment.user.helpfulCount >= REPUTATION_THRESHOLD && (
          <span className="inline-flex items-center gap-0.5 border border-rule px-1.5 py-px text-[10px] font-semibold text-muted-foreground">
           <BadgeCheck className="h-2.5 w-2.5" />
           {Math.floor(comment.user.helpfulCount / REPUTATION_THRESHOLD) * REPUTATION_THRESHOLD}+ helpful
          </span>
         )}

         {comment.isBestAnswer && (
          <span className="inline-flex items-center gap-0.5 border border-brick bg-brick/10 px-1.5 py-px text-[10px] font-bold text-brick">
           <CheckCircle2 className="h-2.5 w-2.5" /> Best Answer
          </span>
         )}

         {comment.kind === "QUESTION" && depth === 0 && (
          <span className="border border-rule px-1.5 py-px text-[10px] font-bold text-muted-foreground">
           Question
          </span>
         )}

         <span className="text-[11px] text-muted-foreground">
          · <TimeAgo date={comment.createdAt} />
         </span>
         {comment.editedAt && (
          <span className="text-[11px] italic text-muted-foreground">(edited)</span>
         )}
         {comment.isPinned && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brick">
           <Pin className="h-2.5 w-2.5" /> Pinned
          </span>
         )}

         {/* Collapse for top-level */}
         {depth === 0 && (
          <button
           type="button"
           onClick={() => setCollapsed(true)}
           className="ml-auto p-0.5 text-muted-foreground transition-colors hover:text-foreground"
           aria-label="Collapse"
          >
           <ChevronUp className="h-3.5 w-3.5" />
          </button>
         )}
        </div>

        {/* Body */}
        {editing ? (
         <div className="mt-2">
          <RedditComposer
           value={editText}
           onChange={setEditText}
           onSubmit={() => { onEdit(comment.id, editText.trim()); setEditing(false) }}
           onCancel={() => setEditing(false)}
           submitLabel="Save edits"
           compact
           autoFocus
          />
         </div>
        ) : (
         <div className={cn(
          "mt-1 text-sm leading-relaxed text-foreground",
          comment.isOfficial && "border-l-2 border-brick bg-paper-2 px-3 py-2"
         )}>
          <div
           className="break-words [&_blockquote]:my-1 [&_code]:text-[12px] [&_del]:text-muted-foreground [&_strong]:font-bold"
           dangerouslySetInnerHTML={{ __html: formatMarkdown(comment.content) }}
          />

          {comment.imageUrl && (
           <a href={comment.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
             src={comment.imageUrl}
             alt="Attachment"
             className="max-h-48 max-w-xs cursor-zoom-in border border-rule object-cover transition-transform hover:scale-[1.02] dark:border-ink"
            />
           </a>
          )}

          {comment.status === "PENDING_REVIEW" && (
           <div className="mt-2 flex items-center gap-1.5 border border-brick bg-brick/10 px-3 py-2 text-xs font-semibold text-brick">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            Awaiting moderation{comment.flaggedReasons.length > 0 ? ` — ${comment.flaggedReasons.join(", ").replace(/_/g, " ")}` : ""}
           </div>
          )}
         </div>
        )}

        {/* Action bar */}
        {comment.status === "APPROVED" && !editing && (
         <div className="mt-0.5 flex flex-wrap items-center gap-0.5">
          {/* Inline vote for nested */}
          {depth > 0 && (
           <div className="mr-1 flex items-center gap-0.5">
            <button
             type="button"
             onClick={() => onUpvote(comment.id)}
             disabled={!currentUserId}
             className={cn(
              "p-0.5 transition-colors",
              currentUserId
               ? comment.hasUpvoted ? "text-brick" : "text-muted-foreground hover:text-brick"
               : "cursor-not-allowed opacity-40"
             )}
            >
             <ArrowBigUp className={cn("h-4 w-4", comment.hasUpvoted && "fill-current")} />
            </button>
            <span className={cn(
             "text-[11px] font-bold tabular-nums",
             comment.hasUpvoted ? "text-brick" : "text-foreground"
            )}>
             {comment.upvoteCount}
            </span>
            <button
             type="button"
             disabled={!currentUserId}
             className="p-0.5 text-muted-foreground transition-colors hover:text-ink-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
             <ArrowBigDown className="h-4 w-4" />
            </button>
           </div>
          )}

          {showThreadControls && (
           <ActionButton icon={MessageSquare} label="Reply" onClick={() => setReplyOpen((v) => !v)} active={replyOpen} />
          )}

          <ActionButton icon={Share2} label="Share" onClick={handleShare} />

          {canMarkBestAnswer && comment.parentId && (
           <ActionButton
            icon={Award}
            label={comment.isBestAnswer ? "Unmark" : "Best answer"}
            onClick={() => onBestAnswer(comment.id)}
            active={comment.isBestAnswer}
           />
          )}

          {!comment.isOwn && currentUserId && (
           <ActionButton icon={Flag} label="Report" onClick={() => onReport(comment.id)} />
          )}

          {(withinEditWindow || isAdmin) && (
           <div className="relative" ref={menuRef}>
            <ActionButton icon={MoreHorizontal} label="" onClick={() => setMenuOpen((v) => !v)} />
            {menuOpen && (
             <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden border border-rule bg-background dark:border-ink dark:bg-ink">
              {withinEditWindow && (
               <button
                type="button"
                onClick={() => { setMenuOpen(false); setEditText(comment.content); setEditing(true) }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-paper-2 dark:hover:bg-paper-3"
               >
                <Pencil className="h-3.5 w-3.5" />
                Edit
                <span className="ml-auto text-[10px] text-muted-foreground">15 min</span>
               </button>
              )}
              <button
               type="button"
               onClick={() => { setMenuOpen(false); if (confirm("Delete this comment?")) onDelete(comment.id) }}
               className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-brick transition-colors hover:bg-brick/10"
              >
               <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              {isAdmin && depth === 0 && (
               <button
                type="button"
                onClick={() => {
                 setMenuOpen(false)
                 fetch("/api/admin/discussion", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(
                   comment.isPinned
                    ? { action: "unpin", commentId: comment.id }
                    : { action: "pin", commentId: comment.id, postType, postId },
                  ),
                 }).then(() => toast(comment.isPinned ? "Unpinned" : "Pinned", "success"))
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-paper-2 dark:hover:bg-paper-3"
               >
                <Pin className="h-3.5 w-3.5" /> {comment.isPinned ? "Unpin" : "Pin"}
               </button>
              )}
             </div>
            )}
           </div>
          )}
         </div>
        )}

        {/* Reply composer */}
        {replyOpen && currentUserId && (
         <div className="mt-2 max-w-xl">
          <RedditComposer
           value={replyText}
           onChange={setReplyText}
           placeholder={`Reply to ${comment.user.name}…`}
           onSubmit={submitReply}
           onCancel={() => { setReplyOpen(false); setReplyText("") }}
           submitLabel="Reply"
           compact
           autoFocus
          />
         </div>
        )}
       </div>
      </div>

      {/* Nested replies */}
      {replyList.length > 0 && (
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
      {hasMoreReplies && (
       <button
        type="button"
        onClick={loadMoreReplies}
        disabled={loadingReplies}
        className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brick transition-colors hover:underline disabled:opacity-50"
        style={{ marginLeft: `${Math.min(depth + 1, MAX_INDENT_LEVEL) * 20 + 8}px` }}
       >
        <CornerDownRight className="h-3 w-3" />
        {loadingReplies
         ? "Loading…"
         : `${Math.min(REPLIES_PAGE_SIZE, comment.replyCount - replyList.length)} more ${comment.replyCount - replyList.length === 1 ? "reply" : "replies"}`}
       </button>
      )}
     </>
    )}
   </div>
  </div>
 )
}

function UserAvatar({ comment, size = "sm" }: { comment: CommentDTO; size?: "xs" | "sm" }) {
 const dim = size === "xs" ? "h-4 w-4 text-[7px]" : "h-6 w-6 text-[9px]"
 if (comment.user.image) {
  return (
   /* eslint-disable-next-line @next/next/no-img-element */
   <img src={comment.user.image} alt={comment.user.name} className={cn("object-cover", dim)} />
  )
 }
 return (
  <span
   className={cn(
    "flex items-center justify-center font-bold select-none",
    dim,
    comment.isOfficial
     ? "bg-brick text-brick-ink"
     : "bg-ink text-paper dark:bg-paper-3 dark:text-foreground"
   )}
  >
   {initials(comment.user.name)}
  </span>
 )
}

function ActionButton({
 icon: Icon,
 label,
 onClick,
 active,
}: {
 icon: React.ComponentType<{ className?: string }>
 label: string
 onClick: () => void
 active?: boolean
}) {
 return (
  <button
   type="button"
   onClick={onClick}
   className={cn(
    "inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold transition-colors",
    active
     ? "bg-paper-3 text-foreground"
     : "text-muted-foreground hover:bg-paper-2 hover:text-foreground"
   )}
  >
   <Icon className="h-3.5 w-3.5" />
   {label}
  </button>
 )
}
