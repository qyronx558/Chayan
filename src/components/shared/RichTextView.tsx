import { cn } from "@/lib/utils"
import { BLOG_PROSE_CLASSES, containsHtml } from "@/lib/blog-prose"

interface RichTextViewProps {
  html: string | null | undefined
  className?: string
}

export function RichTextView({ html, className }: RichTextViewProps) {
  if (!html) return null

  if (containsHtml(html)) {
    return <div className={BLOG_PROSE_CLASSES} dangerouslySetInnerHTML={{ __html: html }} />
  }

  return <div className={cn("whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300", className)}>{html}</div>
}