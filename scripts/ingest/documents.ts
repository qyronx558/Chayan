/**
 * Turns a notice URL into text the LLM (and the grounding check) can read.
 * PDFs: text layer via pdf-parse; scans / legacy-font Hindi PDFs (Kruti Dev
 * etc. extract as gibberish) are passed to Gemini as the raw PDF instead.
 */
import { createRequire } from "node:module"
import { htmlToText } from "../../src/lib/ingest/adapters"
import { normalizeUrl } from "../../src/lib/ingest/normalize"
import type { ListingLink } from "../../src/lib/ingest/types"
import * as cheerio from "cheerio"
import { politeGet } from "./http"

const require = createRequire(import.meta.url)
// The package entry runs a self-test when imported directly; the lib file does not.
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (buf: Buffer) => Promise<{ text: string; numpages: number }>

const MAX_PDF_BYTES = 15_000_000
const MAX_PDF_PAGES_FOR_TEXT = 40

export interface NoticeDocument {
  finalUrl: string
  isPdf: boolean
  /** Usable machine-readable text ("" when the PDF is a scan or unreadable). */
  text: string
  pdfBase64: string | null
  /** Extra links found on an HTML detail page. */
  links: ListingLink[]
}

// Longer function words only: legacy-font Hindi turns into short Latin tokens ("in", "ls", "dk") that look like English.
const EN_STOP = /\b(the|and|of|for|with|from|candidates?|posts?|date|application|shall|will|are|this|which|should)\b/gi

/** Heuristic: is extracted PDF text real language, or a scan / legacy-font mojibake? */
export function isReadableText(text: string): boolean {
  const t = text.replace(/\s+/g, " ").trim()
  if (t.length < 200) return false
  const letters = t.replace(/[\s\d\p{P}]/gu, "").length
  const devanagari = t.match(/[ऀ-ॿ]/g)?.length ?? 0
  if (letters && devanagari / letters > 0.3) return true // real Unicode Hindi / Marathi
  const words = t.split(" ").length
  const stop = t.match(EN_STOP)?.length ?? 0
  return stop / Math.max(words, 1) >= 0.03
}

export async function loadNotice(url: string): Promise<NoticeDocument> {
  const res = await politeGet(url, { maxBytes: MAX_PDF_BYTES })
  if (res.status >= 400) throw new Error(`HTTP ${res.status} for ${url}`)
  const isPdf = /application\/pdf/i.test(res.contentType) || res.body.subarray(0, 5).toString("latin1") === "%PDF-"
  if (isPdf) {
    let text = ""
    try {
      const parsed = await pdfParse(res.body)
      if (parsed.numpages <= MAX_PDF_PAGES_FOR_TEXT) text = parsed.text
    } catch {
      text = ""
    }
    const readable = isReadableText(text)
    return {
      finalUrl: res.url,
      isPdf: true,
      text: readable ? text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim() : "",
      pdfBase64: readable ? null : res.body.toString("base64"),
      links: [],
    }
  }
  const html = res.body.toString("utf8")
  const $ = cheerio.load(html)
  const links: ListingLink[] = []
  $("a[href]").each((_, a) => {
    const u = normalizeUrl($(a).attr("href") ?? "", res.url)
    if (u) links.push({ url: u, label: $(a).text().replace(/\s+/g, " ").trim().slice(0, 200) })
  })
  return { finalUrl: res.url, isPdf: false, text: htmlToText(html), pdfBase64: null, links: links.slice(0, 60) }
}
