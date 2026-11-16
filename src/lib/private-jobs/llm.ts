import { GEMINI_DEFAULT_MODEL, ModelNotFoundError, parseJsonReply, RateLimitError } from "@/lib/ingest/extract"
import type { FetchLike } from "@/lib/private-jobs/feeds"

export { RateLimitError, ModelNotFoundError }

export interface GeminiOptions {
  apiKey?: string
  model?: string | null
  fetchImpl?: FetchLike
  timeoutMs?: number
}

export function geminiConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.GEMINI_API_KEY)
}

export function geminiModel(override?: string | null, env: Record<string, string | undefined> = process.env): string {
  return override?.trim() || env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL
}

/**
 * One JSON-mode Gemini call (temperature 0). Throws RateLimitError on 429/503 so
 * callers can retry on the next scheduled run instead of sleeping in a 60s function.
 */
export async function geminiJson(system: string, prompt: string, opts: GeminiOptions = {}): Promise<unknown> {
  const apiKey = opts.apiKey ?? process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set on this site")
  const model = geminiModel(opts.model)
  const res = await (opts.fetchImpl ?? fetch)(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json", maxOutputTokens: 8192 },
      }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 40_000),
    }
  )
  if (res.status === 429 || res.status === 503) throw new RateLimitError(`Gemini ${res.status === 429 ? "rate limited" : "overloaded"} - retried on the next run`)
  if (res.status === 404) throw new ModelNotFoundError(`Gemini model "${model}" is not available`)
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
  if (!text) throw new Error("Gemini returned no content")
  return parseJsonReply(text)
}
