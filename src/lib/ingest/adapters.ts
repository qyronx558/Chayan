import * as cheerio from "cheerio"
import type { ListingItem, ListingLink, SourceDef } from "./types"
import { cleanText, normalizeUrl } from "./normalize"

export interface ParsedListing {
  items: ListingItem[]
  /** Next page of the same listing, when the site paginates. */
  nextPage: string | null
  /** The page rendered the site's explicit "no notices" message. */
  empty: boolean
}

function linksIn($: cheerio.CheerioAPI, el: Parameters<cheerio.CheerioAPI>[0], base: string): ListingLink[] {
  const out: ListingLink[] = []
  const seen = new Set<string>()
  $(el)
    .find("a[href]")
    .each((_, a) => {
      const url = normalizeUrl($(a).attr("href") ?? "", base)
      if (!url || seen.has(url)) return
      seen.add(url)
      // S3WaaS link text is "View (123 KB)"; aria-label carries the real document name.
      const label = cleanText($(a).text()).replace(/\(\s*[\d.]+\s*[KMG]B\s*\)/i, "").trim()
      out.push({ url, label: label || cleanText($(a).attr("aria-label")) })
    })
  return out
}

/**
 * NIC S3WaaS district portals (<district>.nic.in / .gov.in). Every district
 * uses the same theme: a table with Title | Description | Start Date | End Date | File.
 * Columns are mapped by header text, so a reordered table still parses; links are
 * read from the whole row.
 */
export function parseNicS3waas(html: string, pageUrl: string, src: Pick<SourceDef, "id">): ParsedListing {
  const $ = cheerio.load(html)
  const empty = /no notice matched this category/i.test($("main").text() || $("body").text())
  const items: ListingItem[] = []

  $("main table, .bodyWrapper table").each((_, table) => {
    const headers = $(table)
      .find("thead th")
      .map((__, th) => cleanText($(th).text()).toLowerCase())
      .get()
    const col = (re: RegExp, fallback: number) => {
      const i = headers.findIndex((h) => re.test(h))
      return i >= 0 ? i : fallback
    }
    const cTitle = col(/title|subject/, 0)
    const cDesc = col(/description|detail/, 1)
    const cStart = col(/start|publish|from/, 2)
    const cEnd = col(/end|last|to\b|closing/, 3)

    $(table)
      .find("tbody tr")
      .each((__, tr) => {
        const tds = $(tr).children("td")
        if (tds.length < 2) return
        const cell = (i: number) => (i < tds.length ? cleanText($(tds[i]).text()) : "")
        const title = cell(cTitle)
        if (!title) return
        const links = linksIn($, tr, pageUrl)
        const pdf = links.find((l) => /\.pdf(\?|$)/i.test(l.url)) ?? links[0]
        if (!pdf) return
        items.push({
          sourceId: src.id,
          url: pdf.url,
          title,
          description: cDesc !== cTitle ? cell(cDesc) || undefined : undefined,
          startDate: cell(cStart) || undefined,
          endDate: cell(cEnd) || undefined,
          links: links.map((l) => ({ url: l.url, label: l.label })),
        })
      })
  })

  const next = $('.pegination a, .pagination a, a[rel="next"]')
    .filter((_, a) => /»|next|›/i.test($(a).text()) || $(a).attr("rel") === "next")
    .first()
    .attr("href")
  return { items, nextPage: next ? normalizeUrl(next, pageUrl) : null, empty }
}

const NAV_SELECTORS = "nav, header, footer, script, style, noscript, .menu, .navbar, #menu, .breadcrumb, .breadcrumbs, .skip, .social, .footer, .header"

/**
 * Generic "what's new" boards (PSCs, boards, ministries): harvest every
 * meaningful link inside the content area. Navigation chrome is removed first;
 * `include` narrows to notice URLs (e.g. "\\.pdf$|whats-new/").
 */
export function parseHtmlLinks(html: string, pageUrl: string, src: Pick<SourceDef, "id" | "scope" | "include">): ParsedListing {
  const $ = cheerio.load(html)
  $(NAV_SELECTORS).remove()
  const scope = src.scope && $(src.scope).length ? $(src.scope) : $("main").length ? $("main") : $("body")
  const include = src.include ? new RegExp(src.include, "i") : null
  const seen = new Set<string>()
  const items: ListingItem[] = []

  scope.find("a[href]").each((_, a) => {
    const url = normalizeUrl($(a).attr("href") ?? "", pageUrl)
    if (!url || seen.has(url)) return
    if (include && !include.test(decodeURIComponent(url))) return
    const title = cleanText($(a).text()) || cleanText($(a).attr("title")) || cleanText($(a).attr("aria-label"))
    // Short labels ("Click here", "New", "PDF") are not notice titles.
    if (title.length < 15 || /^(click here|download|view|read more|new|pdf)$/i.test(title)) return
    seen.add(url)
    // A date printed next to the link ("Published: 12/11/2026") helps triage + the LLM.
    const context = cleanText($(a).parent().text()).slice(0, 300)
    items.push({
      sourceId: src.id,
      url,
      title,
      description: context && context !== title ? context : undefined,
      links: [{ url, label: title }],
    })
  })
  return { items, nextPage: null, empty: false }
}

export function parseListing(src: SourceDef, html: string, pageUrl: string): ParsedListing {
  return src.adapter === "nic-s3waas" ? parseNicS3waas(html, pageUrl, src) : parseHtmlLinks(html, pageUrl, src)
}

/** Visible text of an HTML detail page (for grounding + LLM input). */
export function htmlToText(html: string): string {
  const $ = cheerio.load(html)
  $(NAV_SELECTORS).remove()
  const root = $("main").length ? $("main") : $("body")
  root.find("br, p, div, li, tr, h1, h2, h3, h4, td, th").each((_, el) => {
    $(el).append("\n")
  })
  return root
    .text()
    .split("\n")
    .map((l) => cleanText(l))
    .filter(Boolean)
    .join("\n")
}
