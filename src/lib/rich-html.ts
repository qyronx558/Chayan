import { sanitizeCss, sanitizeRichHtml } from "@/lib/sanitize-rich"
import { addHeadingIds } from "@/lib/blog-prose"

/**
 * Rich HTML rendering for admin-authored content. Kept apart from blog-prose
 * so the sanitizer is only bundled into pages that actually render rich HTML.
 */

export const renderRichHtml = (html: string): string => {
  const styles: string[] = []
  let out = html
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_m, css: string) => {
      const safeCss = sanitizeCss(css || "").trim()
      if (safeCss) styles.push(safeCss)
      return ""
    })
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<html[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>/gi, "")
    .replace(/<\/body>/gi, "")
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "")
  // Strip anything executable (scripts, event handlers, javascript: links).
  out = sanitizeRichHtml(out).trim()
  if (styles.length === 0) return out
  const scoped = `<style>@scope (.rich-content){${styles.join("\n")}}</style>`
  return `${scoped}${out}`
}

export const prepareArticleHtml = (html: string | null | undefined): string => {
  if (!html) return ""
  // renderRichHtml already drops doctype/html/head/body/title and scopes
  // custom <style> CSS to .rich-content - keep it so the article matches
  // the admin preview exactly (sanitizeHtmlDocument would strip styles).
  return addHeadingIds(renderRichHtml(html))
}
