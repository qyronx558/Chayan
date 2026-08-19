export const containsHtml = (value: string | null | undefined): boolean =>
  Boolean(value) && /<[a-z][\s\S]*>/i.test(value as string)

export const sanitizeHtmlDocument = (html: string): string => {
  let out = html
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<html[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>/gi, "")
    .replace(/<\/body>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "")
  return out.trim()
}

export const stripHtmlToText = (value: string | null | undefined): string => {
  if (!value) return ""
  if (!containsHtml(value)) return value
  return sanitizeHtmlDocument(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/li>/gi, ", ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim()
}

export const BLOG_PROSE_CLASSES = [
  "prose",
  "prose-gray",
  "max-w-none",
  "prose-h1:text-3xl",
  "prose-h2:text-2xl",
  "prose-h3:text-xl",
  "prose-h4:text-lg",
  "prose-headings:text-gray-900",
  "prose-p:text-gray-700",
  "prose-a:text-blue-600",
  "prose-strong:text-gray-900",
  "prose-ul:list-disc",
  "prose-ol:list-decimal",
  "prose-headings:mt-10",
  "prose-headings:mb-4",
  "prose-p:my-5",
  "prose-p:leading-8",
  "prose-li:my-2",
  "prose-ul:my-6",
  "prose-ol:my-6",
  "prose-blockquote:my-8",
  "prose-pre:my-8",
  "dark:prose-invert",
  "rich-content",
].join(" ")