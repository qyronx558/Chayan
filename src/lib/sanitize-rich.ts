import sanitizeHtml from "sanitize-html"

/**
 * Sanitizer for admin-authored rich content (blog posts, job details, documents).
 * Keeps the formatting editors rely on - classes, inline styles, tables, images,
 * video embeds - and removes everything that can run code: <script>, event
 * handlers (onclick, onerror, ...), javascript: links, <object>/<embed>, forms.
 */

const EXTRA_TAGS = [
  "img", "picture", "source", "figure", "figcaption", "h1", "h2", "span", "div", "section", "article",
  "header", "footer", "aside", "nav", "main", "details", "summary", "mark", "del", "ins", "u", "s",
  "sub", "sup", "small", "big", "center", "font", "label", "input", "button", "video", "audio", "track",
  "iframe", "colgroup", "col", "caption", "tfoot", "dl", "dt", "dd", "address", "time", "wbr", "abbr",
  "kbd", "samp", "var", "cite", "q", "svg", "path", "g", "circle", "rect", "line", "polyline", "polygon",
  "ellipse", "defs", "lineargradient", "radialgradient", "stop", "title",
]

const GLOBAL_ATTRS = [
  "class", "id", "style", "title", "lang", "dir", "role", "align", "valign", "width", "height",
  "bgcolor", "color", "border", "cellpadding", "cellspacing", "hidden", "tabindex", "data-*", "aria-*",
]

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, ...EXTRA_TAGS],
  allowedAttributes: {
    "*": GLOBAL_ATTRS,
    a: ["href", "name", "target", "rel", "download"],
    img: ["src", "srcset", "sizes", "alt", "loading", "decoding", "referrerpolicy"],
    source: ["src", "srcset", "sizes", "type", "media"],
    video: ["src", "poster", "controls", "loop", "muted", "playsinline", "preload", "autoplay"],
    audio: ["src", "controls", "loop", "muted", "preload"],
    track: ["src", "kind", "srclang", "label", "default"],
    iframe: ["src", "allow", "allowfullscreen", "frameborder", "loading", "referrerpolicy", "scrolling"],
    td: ["colspan", "rowspan", "headers", "scope", "nowrap"],
    th: ["colspan", "rowspan", "headers", "scope", "nowrap"],
    col: ["span"],
    colgroup: ["span"],
    ol: ["start", "type", "reversed"],
    ul: ["type"],
    li: ["value"],
    font: ["face", "size"],
    input: ["type", "checked", "disabled", "readonly", "value", "name", "placeholder"],
    button: ["type", "disabled"],
    label: ["for"],
    details: ["open"],
    time: ["datetime"],
    q: ["cite"],
    blockquote: ["cite"],
    svg: ["viewbox", "xmlns", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "preserveaspectratio"],
    path: ["d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill-rule", "clip-rule", "transform", "opacity"],
    g: ["fill", "stroke", "stroke-width", "transform", "opacity"],
    circle: ["cx", "cy", "r", "fill", "stroke", "stroke-width", "transform", "opacity"],
    rect: ["x", "y", "rx", "ry", "fill", "stroke", "stroke-width", "transform", "opacity"],
    line: ["x1", "y1", "x2", "y2", "stroke", "stroke-width", "stroke-linecap", "transform", "opacity"],
    polyline: ["points", "fill", "stroke", "stroke-width", "transform", "opacity"],
    polygon: ["points", "fill", "stroke", "stroke-width", "transform", "opacity"],
    ellipse: ["cx", "cy", "rx", "ry", "fill", "stroke", "stroke-width", "transform", "opacity"],
    lineargradient: ["x1", "y1", "x2", "y2", "gradientunits", "gradienttransform"],
    radialgradient: ["cx", "cy", "r", "fx", "fy", "gradientunits", "gradienttransform"],
    stop: ["offset", "stop-color", "stop-opacity"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"], source: ["http", "https", "data"] },
  allowedSchemesAppliedToAttributes: ["href", "src", "cite", "poster"],
  allowProtocolRelative: true,
  // Only well-known media/embed hosts may be framed inside content.
  allowedIframeHostnames: [
    "www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com",
    "docs.google.com", "drive.google.com", "www.google.com", "maps.google.com",
  ],
  allowIframeRelativeUrls: false,
  // Inline styles pass through untouched (no CSS parsing), so pasted designs keep their look.
  parseStyleAttributes: false,
  // Inputs inside content are display-only (task lists); they can never submit anywhere.
  transformTags: {
    input: (tagName, attribs) => {
      const type = (attribs.type || "").toLowerCase()
      return { tagName, attribs: { ...attribs, type: type === "radio" ? "radio" : "checkbox", disabled: "disabled" } }
    },
    button: (tagName, attribs) => ({ tagName, attribs: { ...attribs, type: "button" } }),
  },
}

export function sanitizeRichHtml(html: string): string {
  if (!html) return ""
  return sanitizeHtml(html, OPTIONS)
}

/** CSS lifted out of <style> blocks: make sure it cannot close the tag or pull in remote sheets. */
export function sanitizeCss(css: string): string {
  return css
    .replace(/</g, "")
    .replace(/@import[^;]*;?/gi, "")
    .replace(/expression\s*\(/gi, "(")
    .replace(/javascript\s*:/gi, "")
}
