import sanitizeHtml from "sanitize-html"
import { decodeEntities, htmlToText } from "@/lib/private-jobs/html-text"

/**
 * Job descriptions sometimes arrive as HTML *source* pasted into the rich-text
 * editor, which stores it escaped: `<p>&lt;style&gt;</p><p> .job-content {…`.
 * Rendered as-is, readers see the code. These helpers recover the real markup
 * and reduce it to clean, site-styled HTML (no foreign CSS, so the page keeps
 * its own look and dark mode).
 */

/** An escaped tag that only appears when markup was stored as text. */
const ESCAPED_TAG = /&lt;\/?(style|script|div|section|article|p|h[1-6]|ul|ol|li|strong|b|em|br|span|table|tr|td|a)\b[^&]*?&gt;/i

/** Recovers HTML source that was stored as escaped text, or null when the input is not like that. */
export function unwrapEscapedHtml(raw: string): string | null {
  const hits = raw.match(new RegExp(ESCAPED_TAG.source, "gi"))
  if (!hits || hits.length < 2) return null
  const text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n")
    .replace(/<\/?p[^>]*>/gi, "\n")
    // Any other real tag the editor added (e.g. <span>) is a wrapper around the source text.
    .replace(/<\/?(span|div|font)[^>]*>/gi, "")
  return decodeEntities(text)
}

/** Tags a job description needs; classes, inline styles and <style> blocks are dropped. */
const CLEAN_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "u", "h2", "h3", "h4", "a", "blockquote", "table", "thead", "tbody", "tr", "th", "td", "hr"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Drop the *contents* of these, not just the tags.
  nonTextTags: ["style", "script", "textarea", "option", "noscript", "head", "title"],
  transformTags: {
    h1: "h2",
    h5: "h4",
    h6: "h4",
    a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer nofollow" } }),
  },
  exclusiveFilter: (frame) => ["p", "li", "h2", "h3", "h4"].includes(frame.tag) && !frame.text.trim() && !frame.mediaChildren?.length,
}

function cleanHtml(html: string): string {
  return sanitizeHtml(html, CLEAN_OPTIONS)
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim()
}

/**
 * The description to render / store. Escaped source and pasted <style> designs
 * become clean HTML; everything else is returned unchanged.
 */
export function cleanJobDescription(raw: string | null | undefined): string | null {
  if (!raw) return raw ?? null
  const unwrapped = unwrapEscapedHtml(raw)
  if (unwrapped != null) return cleanHtml(unwrapped) || null
  if (/<style[\s>]/i.test(raw)) return cleanHtml(raw) || null
  return raw
}

/** Plain-text version (meta tags, JSON-LD, previews). */
export function jobDescriptionText(raw: string | null | undefined): string {
  return htmlToText(cleanJobDescription(raw))
}

/** Clean HTML for structured data (Google for Jobs accepts basic HTML); null for plain text. */
export function jobDescriptionHtml(raw: string | null | undefined): string | null {
  const v = cleanJobDescription(raw)
  if (!v || !/<\/?(p|br|ul|ol|li|h[1-6]|strong|b|em|i|u|div|span|table|tr|td|a|blockquote)\b[^>]*>/i.test(v)) return null
  return cleanHtml(v) || null
}
