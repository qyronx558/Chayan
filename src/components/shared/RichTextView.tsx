import { cn } from "@/lib/utils"
import { BLOG_PROSE_CLASSES, containsHtml, renderRichHtml } from "@/lib/blog-prose"

interface RichTextViewProps {
 html: string | null | undefined
 className?: string
}

/**
 * Client-side renderer. Uses the exact same pipeline as the admin
 * Preview tab (renderRichHtml + BLOG_PROSE_CLASSES), so pasted HTML/CSS
 * looks identical in admin preview and on the public page. Plain text
 * (no tags) is rendered as-is, whitespace preserved.
 */
export function RichTextView({ html, className }: RichTextViewProps) {
 if (!html) return null

 if (containsHtml(html)) {
  return (
   <div
    className={BLOG_PROSE_CLASSES}
    dangerouslySetInnerHTML={{ __html: renderRichHtml(html) }}
   />
  )
 }

 return <div className={cn("whitespace-pre-line text-sm leading-relaxed text-foreground dark:text-muted-foreground", className)}>{html}</div>
}