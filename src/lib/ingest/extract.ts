/**
 * LLM extraction for the ingest bot (runs in the scraper, never in a page request).
 * Primary: Google Gemini (free AI Studio key, reads PDFs incl. scans + Hindi).
 * Fallback: Groq (OpenAI-compatible, text only).
 */
import { llmExtractionSchema, type LlmExtraction } from "./schema"
import type { ListingItem, SourceDef } from "./types"

export interface ExtractInput {
  source: Pick<SourceDef, "name" | "level" | "state" | "district" | "department">
  item: ListingItem
  /** Text layer of the PDF / detail page ("" for scans). */
  text: string
  /** Raw PDF, sent to Gemini when there is no usable text layer. */
  pdf?: { base64: string } | null
  categories: string[]
  departments: string[]
  today: string
}

export interface LlmConfig {
  geminiKey?: string
  geminiModel: string
  groqKey?: string
  groqModel: string
  minIntervalMs: number
}

export function llmConfig(env: Record<string, string | undefined> = process.env): LlmConfig {
  return {
    geminiKey: env.GEMINI_API_KEY || undefined,
    geminiModel: env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL,
    groqKey: env.GROQ_API_KEY || undefined,
    groqModel: env.GROQ_MODEL || "llama-3.3-70b-versatile",
    minIntervalMs: Number(env.LLM_MIN_INTERVAL_MS || 4500),
  }
}

/**
 * Alias Google keeps pointed at the current Flash-Lite model (pinned versions get
 * retired). Flash-Lite answers in ~2 s on the free tier; full Flash queues for
 * minutes or returns 503 under load. Grounding re-checks every fact either way.
 */
export const GEMINI_DEFAULT_MODEL = "gemini-flash-lite-latest"

const MAX_TEXT_CHARS = 28_000

export const SYSTEM_PROMPT = `You extract facts from ONE official Indian government notice for a job-information website.
Return a single JSON object, nothing else.

ACCURACY RULES (most important):
- Use only what the notice states. If a value is not printed, use null. Never guess, infer or use outside knowledge.
- For every non-null factual field (advertisementNo, totalVacancies, salary, ageLimit, ageRelaxation, education, experience, selectionProcess, applicationFee, documentsRequired, howToApply, startDate, lastDate, examDate, resultDate, applyLink, officialWebsite) add evidence[field] = an exact quote (max 200 chars) copied character-for-character from the notice that proves it.
- Dates: output YYYY-MM-DD. Numeric dates in Indian notices are DAY first (05/11/2026 = 2026-11-05).
- lastDate = last date to apply / submit. startDate = application start. examDate / resultDate only if printed.
- totalVacancies = the total number of posts only when the notice prints that number (a "Total" row or a single post count). Do not add numbers up yourself.
- applyLink / officialWebsite: only URLs printed in the notice or in the provided link list.
- importantDates: rows of {label, date} exactly as printed (date as printed, e.g. "15/12/2026").
- Hindi/regional notices: write values in English, keep names of posts/places as proper nouns.

CLASSIFICATION (kind):
- "jobs": a recruitment / vacancy / walk-in / contractual engagement inviting applications.
- "results" (results, merit/selection lists), "admit-cards", "answer-keys", "admissions", "syllabus".
- "irrelevant": tenders, auctions, transfers, meetings, holidays, RTI, court orders, internal circulars, or a notice with no actionable information for candidates.

WRITING (title + summary are ours, not copied):
- title: clear, specific English headline, max 110 chars, e.g. "District Health Society Patna Staff Nurse Recruitment 2026" or "BPSC 70th CCE Final Result 2026". Include the district/state for local notices. No clickbait, no ALL CAPS, no emojis.
- summary: 3-5 sentences (350-800 characters) written in your own words for a job seeker: who is hiring, which posts and how many, key eligibility, the deadline and how to apply. Do NOT copy sentences from the notice. Do not add facts that are not in the notice.
- department: full name of the issuing organisation. If it matches one in KNOWN DEPARTMENTS, use that exact spelling.
- category: exactly one value from CATEGORIES.
- confidence: 0..1, how sure you are that every field is correct.`

const JSON_SHAPE = `{"kind":"jobs|results|admit-cards|answer-keys|admissions|syllabus|irrelevant","title":string|null,"department":string|null,"category":string|null,"summary":string|null,"advertisementNo":string|null,"totalVacancies":number|null,"salary":string|null,"ageLimit":string|null,"ageRelaxation":string|null,"education":string|null,"experience":string|null,"selectionProcess":string|null,"applicationFee":string|null,"documentsRequired":string|null,"howToApply":string|null,"startDate":"YYYY-MM-DD"|null,"lastDate":"YYYY-MM-DD"|null,"examDate":"YYYY-MM-DD"|null,"resultDate":"YYYY-MM-DD"|null,"importantDates":[{"label":string,"date":string}]|null,"applyLink":string|null,"officialWebsite":string|null,"evidence":{"<field>":"exact quote"},"confidence":number}`

export function buildUserPrompt(input: ExtractInput): string {
  const { source, item } = input
  const where = [source.district && `${source.district} district`, source.state].filter(Boolean).join(", ") || "All India"
  const links = item.links.slice(0, 20).map((l) => `- ${l.label || "link"}: ${l.url}`).join("\n")
  return [
    `TODAY: ${input.today}`,
    `SOURCE: ${source.name} (${source.level.toLowerCase()} level, ${where})`,
    source.department ? `SOURCE DEPARTMENT (use if the notice names no other issuer): ${source.department}` : "",
    `LISTING TITLE: ${item.title}`,
    item.description ? `LISTING DESCRIPTION: ${item.description}` : "",
    item.startDate || item.endDate ? `LISTING DATES: start ${item.startDate ?? "-"}, end ${item.endDate ?? "-"}` : "",
    links ? `LINKS ON THE PAGE:\n${links}` : "",
    `CATEGORIES: ${input.categories.join(" | ")}`,
    `KNOWN DEPARTMENTS: ${input.departments.slice(0, 300).join(" | ")}`,
    `OUTPUT JSON SHAPE: ${JSON_SHAPE}`,
    input.text ? `NOTICE TEXT:\n"""\n${input.text.slice(0, MAX_TEXT_CHARS)}\n"""` : "NOTICE: see the attached PDF.",
  ]
    .filter(Boolean)
    .join("\n\n")
}

type FetchLike = (url: string, init: RequestInit) => Promise<Response>

export class RateLimitError extends Error {}
/** The key was rejected (HTTP 401/403): no point calling this provider again this run. */
export class AuthError extends Error {}
/** Every provider is unusable right now (rejected key, or cooling down after repeated overload). */
export class LlmUnavailableError extends Error {}

/** One request may not hang the run: a stuck call once held a job for 5 minutes. */
const LLM_TIMEOUT_MS = 90_000
/** Documents in a row a provider failed with 429/503 (after its wait) before it is rested. */
const OVERLOAD_STRIKES = 2
/** How long an overloaded provider is skipped. Its notices stay unseen and are retried next run. */
const OVERLOAD_COOLDOWN_MS = 10 * 60_000

function timeoutSignal(): AbortSignal | undefined {
  return typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(LLM_TIMEOUT_MS) : undefined
}
/** The configured model was retired / is unknown (HTTP 404). */
export class ModelNotFoundError extends Error {}

/** Pulls the first JSON object out of a model reply (tolerates ```json fences). */
export function parseJsonReply(raw: string): unknown {
  const t = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "")
  const start = t.indexOf("{")
  const end = t.lastIndexOf("}")
  if (start < 0 || end <= start) throw new Error("model reply contained no JSON object")
  return JSON.parse(t.slice(start, end + 1))
}

async function callGemini(cfg: LlmConfig, input: ExtractInput, extra: string, fetchFn: FetchLike): Promise<string> {
  const parts: Record<string, unknown>[] = [{ text: buildUserPrompt(input) + extra }]
  if (!input.text && input.pdf) parts.push({ inline_data: { mime_type: "application/pdf", data: input.pdf.base64 } })
  const res = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.geminiModel)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": cfg.geminiKey! },
    signal: timeoutSignal(),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0, responseMimeType: "application/json", maxOutputTokens: 4096 },
    }),
  })
  // 429 = per-minute quota, 503 = model overloaded: both are temporary.
  if (res.status === 429 || res.status === 503) throw new RateLimitError(`gemini ${res.status === 429 ? "rate limited" : "overloaded (503)"}`)
  if (res.status === 401 || res.status === 403) throw new AuthError(`gemini key rejected (HTTP ${res.status})`)
  if (res.status === 404) throw new ModelNotFoundError(`gemini model "${cfg.geminiModel}" not available: ${(await res.text()).slice(0, 200)}`)
  if (!res.ok) throw new Error(`gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
  if (!text) throw new Error("gemini returned no content")
  return text
}

async function callGroq(cfg: LlmConfig, input: ExtractInput, extra: string, fetchFn: FetchLike): Promise<string> {
  const res = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cfg.groqKey}` },
    signal: timeoutSignal(),
    body: JSON.stringify({
      model: cfg.groqModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) + extra },
      ],
    }),
  })
  if (res.status === 429 || res.status === 503) throw new RateLimitError(`groq ${res.status === 429 ? "rate limited" : "overloaded (503)"}`)
  if (res.status === 401 || res.status === 403) throw new AuthError(`groq key rejected (HTTP ${res.status})`)
  if (!res.ok) throw new Error(`groq HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const text = json.choices?.[0]?.message?.content ?? ""
  if (!text) throw new Error("groq returned no content")
  return text
}

export interface Extractor {
  extract(input: ExtractInput): Promise<{ extraction: LlmExtraction; provider: string }>
}

/**
 * Builds an extractor with a provider chain, client-side pacing (free tiers
 * are per-minute limited) and one schema-repair retry per provider.
 *
 * Fails fast instead of burning the run's time: a provider whose key is
 * rejected is dropped for the run, and one that stays overloaded for
 * OVERLOAD_STRIKES documents in a row is skipped for OVERLOAD_COOLDOWN_MS.
 * When no provider is usable, extract() throws LlmUnavailableError.
 */
export function createExtractor(initial: LlmConfig = llmConfig(), fetchFn: FetchLike = fetch, sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))): Extractor {
  let cfg = initial
  let last = 0
  const pace = async () => {
    const wait = last + cfg.minIntervalMs - Date.now()
    if (wait > 0) await sleep(wait)
    last = Date.now()
  }
  type Provider = {
    name: string
    call: typeof callGemini
    usable: (i: ExtractInput) => boolean
    disabled?: string
    strikes: number
    restUntil: number
  }
  const providers: Provider[] = []
  if (cfg.geminiKey) providers.push({ name: "gemini", call: callGemini, usable: () => true, strikes: 0, restUntil: 0 })
  if (cfg.groqKey) providers.push({ name: "groq", call: callGroq, usable: (i) => Boolean(i.text), strikes: 0, restUntil: 0 })
  if (!providers.length) throw new Error("Set GEMINI_API_KEY (or GROQ_API_KEY) to run extraction")

  return {
    async extract(input) {
      const errors: string[] = []
      const available = providers.filter((p) => !p.disabled && p.restUntil <= Date.now())
      if (!available.length) {
        const why = providers.map((p) => `${p.name}: ${p.disabled ?? `overloaded, resting until ${new Date(p.restUntil).toISOString().slice(11, 16)} UTC`}`)
        throw new LlmUnavailableError(`no LLM provider available (${why.join("; ")})`)
      }
      for (const p of available) {
        if (!p.usable(input)) continue
        let extra = ""
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            await pace()
            const raw = await p.call(cfg, input, extra, fetchFn)
            p.strikes = 0
            const parsed = llmExtractionSchema.safeParse(parseJsonReply(raw))
            if (parsed.success) return { extraction: parsed.data, provider: p.name }
            const issue = parsed.error.issues[0]
            extra = `\n\nYOUR PREVIOUS REPLY WAS INVALID (${issue.path.join(".")}: ${issue.message}). Return valid JSON in the exact shape.`
            errors.push(`${p.name}: schema ${issue.path.join(".")}`)
          } catch (e) {
            const message = e instanceof Error && e.name === "TimeoutError" ? `no answer in ${LLM_TIMEOUT_MS / 1000} s` : e instanceof Error ? e.message : String(e)
            errors.push(`${p.name}: ${message}`)
            if (e instanceof AuthError) {
              p.disabled = e.message
              console.warn(`[ingest] ${e.message} - not calling ${p.name} again this run (check its API key)`)
              break
            }
            if (e instanceof ModelNotFoundError && p.name === "gemini" && cfg.geminiModel !== GEMINI_DEFAULT_MODEL) {
              console.warn(`[ingest] ${e.message} - switching to ${GEMINI_DEFAULT_MODEL}`)
              cfg = { ...cfg, geminiModel: GEMINI_DEFAULT_MODEL }
              if (attempt === 0) continue
            }
            if (e instanceof RateLimitError) {
              if (attempt === 0) {
                console.warn(`[ingest] ${e.message} - waiting 30 s`)
                await sleep(30_000)
                continue
              }
              if (++p.strikes >= OVERLOAD_STRIKES) {
                p.strikes = 0
                p.restUntil = Date.now() + OVERLOAD_COOLDOWN_MS
                console.warn(`[ingest] ${p.name} still overloaded - skipping it for ${OVERLOAD_COOLDOWN_MS / 60_000} min`)
              }
            }
            break
          }
        }
      }
      throw new Error(`extraction failed (${errors.join("; ")})`)
    },
  }
}
