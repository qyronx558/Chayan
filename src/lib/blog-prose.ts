export const containsHtml = (value: string | null | undefined): boolean =>
  Boolean(value) && /<[a-z][\s\S]*>/i.test(value as string)

export const sanitizeHtmlDocument = (html: string): string => {
  const out = html
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

export const renderRichHtml = (html: string): string => {
  const styles: string[] = []
  let out = html
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_m, css: string) => {
      if (css && css.trim()) styles.push(css.trim())
      return ""
    })
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<html[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>/gi, "")
    .replace(/<\/body>/gi, "")
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "")
  out = out.trim()
  if (styles.length === 0) return out
  const scoped = `<style>@scope (.rich-content){${styles.join("\n")}}</style>`
  return `${scoped}${out}`
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

export const getReadingTimeMinutes = (htmlOrText: string | null | undefined): number => {
  if (!htmlOrText) return 2
  const text = containsHtml(htmlOrText)
    ? stripHtmlToText(htmlOrText)
    : htmlOrText
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export const slugifyHeading = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/&amp;|&/g, "and")
    .replace(/[^a-z0-9\u0900-\u097F\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)

export const addHeadingIds = (html: string): string => {
  if (!containsHtml(html)) {
    return html
      .split(/\n{2,}/)
      .map((para) => `<p>${para}</p>`)
      .join("\n")
  }
  return html.replace(/<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag: string, attrs: string, inner: string) => {
    if (/id=/.test(attrs)) return match
    const text = inner.replace(/<[^>]+>/g, "").trim()
    if (!text) return match
    const id = slugifyHeading(text)
    return `<${tag}${attrs} id="${id}" class="scroll-mt-28">${inner}</${tag}>`
  })
}

export const extractTakeaways = (excerpt: string | null | undefined, html: string | null | undefined, max = 3): string[] => {
  if (!html) return excerpt ? [excerpt] : []
  const text = stripHtmlToText(html)
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 40 && s.length < 220)
  if (sentences.length === 0) return excerpt ? [excerpt] : []
  return sentences.slice(0, max)
}

export interface FaqItem {
  q: string
  a: string
}

export const extractFaq = (html: string | null | undefined, max = 4): FaqItem[] => {
  if (!html || !containsHtml(html)) return []
  const items: FaqItem[] = []
  const re = /<(h2|h3)[^>]*>([^<]*\?[^<]*)<\/\1>\s*<(p|li)[^>]*>([\s\S]*?)<\/\3>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) && items.length < max) {
    const q = m[2].trim()
    const a = m[4].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    if (q.length > 10 && a.length > 20) items.push({ q, a: a.slice(0, 300) })
  }
  return items
}

export const prepareArticleHtml = (html: string | null | undefined): string => {
  if (!html) return ""
  const sanitized = sanitizeHtmlDocument(renderRichHtml(html))
  return addHeadingIds(sanitized)
}

export const BLOG_PROSE_CLASSES = [
  "prose",
  "prose-gray",
  "max-w-none",
  "prose-h1:text-3xl",
  "prose-h1:font-extrabold",
  "prose-h1:tracking-tight",
  "prose-h2:text-2xl",
  "prose-h2:font-bold",
  "prose-h2:tracking-tight",
  "prose-h2:border-b",
  "prose-h2:border-[#E8E0CE]",
  "prose-h2:pb-3",
  "prose-h3:text-xl",
  "prose-h3:font-semibold",
  "prose-headings:text-[#17233B]",
  "prose-headings:scroll-mt-28",
  "prose-p:text-[1.05rem]",
  "prose-p:text-gray-700",
  "prose-p:leading-8",
  "prose-a:text-[#1B3A5C]",
  "prose-a:font-medium",
  "prose-a:underline",
  "prose-a:decoration-[#D8C79D]",
  "prose-a:underline-offset-4",
  "hover:prose-a:decoration-[#B08D57]",
  "prose-strong:text-gray-900",
  "prose-ul:list-disc",
  "prose-ol:list-decimal",
  "prose-li:marker:text-[#B08D57]",
  "prose-headings:mt-10",
  "prose-headings:mb-4",
  "prose-p:my-5",
  "prose-li:my-2",
  "prose-ul:my-6",
  "prose-ol:my-6",
  "prose-blockquote:my-8",
  "prose-blockquote:border-l-4",
  "prose-blockquote:border-[#B08D57]",
  "prose-blockquote:bg-[#FAF6EE]",
  "prose-blockquote:rounded-r-xl",
  "prose-blockquote:px-5",
  "prose-blockquote:py-1",
  "prose-blockquote:not-italic",
  "prose-img:rounded-2xl",
  "prose-img:shadow-md",
  "prose-pre:my-8",
  "prose-pre:rounded-xl",
  "prose-table:text-sm",
  "dark:prose-invert",
  "dark:prose-h2:border-gray-800",
  "dark:prose-p:text-gray-300",
  "dark:prose-headings:text-gray-50",
  "rich-content",
].join(" ")