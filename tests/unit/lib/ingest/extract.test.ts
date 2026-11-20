import { describe, expect, it, vi } from "vitest"
import { buildUserPrompt, createExtractor, parseJsonReply, SYSTEM_PROMPT, type ExtractInput, type LlmConfig } from "@/lib/ingest/extract"
import { NOTICE_TEXT, extraction } from "./fixtures"

const cfg: LlmConfig = { geminiKey: "g-key", geminiModel: "gemini-test", groqKey: "q-key", groqModel: "groq-test", minIntervalMs: 0 }
const input: ExtractInput = {
  source: { name: "District Patna", level: "DISTRICT", state: "Bihar", district: "Patna", department: "District Administration Patna" },
  item: { sourceId: "nic:bihar/patna", url: "https://cdn.s3waas.gov.in/x.pdf", title: "Recruitment of Staff Nurse", links: [{ url: "https://cdn.s3waas.gov.in/x.pdf", label: "View" }] },
  text: NOTICE_TEXT,
  categories: ["Medical", "State Govt"],
  departments: ["District Health Society, Patna"],
  today: "2026-11-14",
}

const gemini = (body: unknown, status = 200) =>
  new Response(JSON.stringify(status === 200 ? { candidates: [{ content: { parts: [{ text: JSON.stringify(body) }] } }] } : { error: "x" }), { status })
const groq = (body: unknown) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(body) } }] }), { status: 200 })
const noSleep = () => Promise.resolve()

describe("prompting", () => {
  it("pins accuracy rules and gives the model the source context", () => {
    expect(SYSTEM_PROMPT).toMatch(/Never guess/)
    expect(SYSTEM_PROMPT).toMatch(/DAY first/)
    expect(SYSTEM_PROMPT).toMatch(/Do NOT copy sentences/)
    const p = buildUserPrompt(input)
    expect(p).toContain("TODAY: 2026-11-14")
    expect(p).toContain("district level, Patna district, Bihar")
    expect(p).toContain("CATEGORIES: Medical | State Govt")
    expect(p).toContain("No. of Posts: 25")
  })
  it("asks for the attached PDF when there is no text layer", () => {
    expect(buildUserPrompt({ ...input, text: "" })).toContain("see the attached PDF")
  })
  it("parses fenced JSON replies", () => {
    expect(parseJsonReply('```json\n{"a":1}\n```')).toEqual({ a: 1 })
    expect(() => parseJsonReply("sorry")).toThrow(/no JSON/)
  })
})

describe("createExtractor", () => {
  it("returns a validated extraction from Gemini with the key in a header, not the URL", async () => {
    const fetchFn = vi.fn().mockResolvedValue(gemini(extraction()))
    const ex = createExtractor(cfg, fetchFn, noSleep)
    const out = await ex.extract(input)
    expect(out.provider).toBe("gemini")
    expect(out.extraction.totalVacancies).toBe(25)
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).not.toContain("g-key")
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("g-key")
    const body = JSON.parse(init.body as string)
    expect(body.generationConfig).toMatchObject({ temperature: 0, responseMimeType: "application/json" })
    expect(body.contents[0].parts).toHaveLength(1) // text only - no PDF when a text layer exists
  })

  it("sends the PDF inline for scanned notices", async () => {
    const fetchFn = vi.fn().mockResolvedValue(gemini(extraction()))
    await createExtractor(cfg, fetchFn, noSleep).extract({ ...input, text: "", pdf: { base64: "JVBERi0=" } })
    const body = JSON.parse(fetchFn.mock.calls[0][1].body as string)
    expect(body.contents[0].parts[1]).toEqual({ inline_data: { mime_type: "application/pdf", data: "JVBERi0=" } })
  })

  it("repairs an invalid reply once with the validation error", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(gemini({ ...extraction(), kind: "news" }))
      .mockResolvedValueOnce(gemini(extraction()))
    const out = await createExtractor(cfg, fetchFn, noSleep).extract(input)
    expect(out.extraction.kind).toBe("jobs")
    expect(JSON.parse(fetchFn.mock.calls[1][1].body as string).contents[0].parts[0].text).toContain("YOUR PREVIOUS REPLY WAS INVALID (kind")
  })

  it("falls back to Groq when Gemini is rate limited", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(gemini(null, 429))
      .mockResolvedValueOnce(gemini(null, 429))
      .mockResolvedValueOnce(groq(extraction()))
    const sleep = vi.fn().mockResolvedValue(undefined)
    const out = await createExtractor(cfg, fetchFn, sleep).extract(input)
    expect(out.provider).toBe("groq")
    expect(fetchFn.mock.calls[2][0]).toBe("https://api.groq.com/openai/v1/chat/completions")
    expect(sleep).toHaveBeenCalledWith(30_000)
  })

  it("does not send scans to text-only Groq and reports every failure", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("boom", { status: 500 }))
    await expect(createExtractor(cfg, fetchFn, noSleep).extract({ ...input, text: "", pdf: { base64: "x" } })).rejects.toThrow(/gemini: gemini HTTP 500/)
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it("refuses to start without any key", () => {
    expect(() => createExtractor({ ...cfg, geminiKey: undefined, groqKey: undefined })).toThrow(/GEMINI_API_KEY/)
  })
})

describe("retired models", () => {
  it("defaults to the always-current Flash-Lite alias", async () => {
    const { llmConfig } = await import("@/lib/ingest/extract")
    expect(llmConfig({}).geminiModel).toBe("gemini-flash-lite-latest")
  })
  it("treats 503 'high demand' as temporary: waits, retries, then falls back", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(gemini(extraction()))
    const sleep = vi.fn().mockResolvedValue(undefined)
    const out = await createExtractor(cfg, fetchFn, sleep).extract(input)
    expect(out.provider).toBe("gemini")
    expect(sleep).toHaveBeenCalledWith(30_000)
  })
  it("switches to the alias when a pinned model returns 404", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response("model retired", { status: 404 }))
      .mockResolvedValueOnce(gemini(extraction()))
    const out = await createExtractor({ ...cfg, geminiModel: "gemini-2.5-flash" }, fetchFn, noSleep).extract(input)
    expect(out.provider).toBe("gemini")
    expect(fetchFn.mock.calls[0][0]).toContain("/models/gemini-2.5-flash:")
    expect(fetchFn.mock.calls[1][0]).toContain("/models/gemini-flash-lite-latest:")
  })
})

describe("failing fast", () => {
  it("drops a provider whose key is rejected for the rest of the run", async () => {
    const fetchFn = vi.fn(async (url: string) =>
      url.includes("groq") ? new Response("invalid key", { status: 401 }) : gemini(null, 503)
    )
    const ex = createExtractor(cfg, fetchFn, noSleep)
    await expect(ex.extract(input)).rejects.toThrow(/groq key rejected \(HTTP 401\)/)
    fetchFn.mockClear()
    await expect(ex.extract(input)).rejects.toThrow(/extraction failed/)
    expect(fetchFn.mock.calls.every(([url]) => !String(url).includes("groq"))).toBe(true)
  })

  it("rests a provider that stays overloaded, then reports that none is available", async () => {
    const fetchFn = vi.fn().mockImplementation(async () => gemini(null, 503))
    const ex = createExtractor({ ...cfg, groqKey: undefined }, fetchFn, noSleep)
    await expect(ex.extract(input)).rejects.toThrow(/extraction failed/)
    await expect(ex.extract(input)).rejects.toThrow(/extraction failed/)
    const calls = fetchFn.mock.calls.length
    const { LlmUnavailableError } = await import("@/lib/ingest/extract")
    await expect(ex.extract(input)).rejects.toBeInstanceOf(LlmUnavailableError)
    expect(fetchFn.mock.calls.length).toBe(calls) // no request while resting
  })

  it("puts a timeout on every request", async () => {
    const fetchFn = vi.fn().mockResolvedValue(gemini(extraction()))
    await createExtractor(cfg, fetchFn, noSleep).extract(input)
    expect(fetchFn.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
  })
})
