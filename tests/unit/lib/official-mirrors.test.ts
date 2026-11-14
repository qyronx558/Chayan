import { afterEach, describe, expect, it, vi } from "vitest"

const safeFetch = vi.fn()
vi.mock("@/lib/proxy", async (orig) => ({ ...(await orig<typeof import("@/lib/proxy")>()), safeFetch: (...a: unknown[]) => safeFetch(...a) }))

import { documentSources, hasMirror } from "@/lib/official-mirrors"
import { openOfficialPdf } from "@/lib/doc-proxy"

const PDF = "https://cdn.s3waas.gov.in/s3abc/uploads/2026/11/1.pdf"
const pdfResponse = () =>
  new Response(new Blob([new TextEncoder().encode("%PDF-1.7\n" + "x".repeat(2000))]), {
    status: 200,
    headers: { "content-type": "application/pdf" },
  })

async function readAll(stream: ReadableStream<Uint8Array>) {
  return new TextDecoder().decode(await new Response(stream).arrayBuffer())
}

afterEach(() => safeFetch.mockReset())

describe("official mirrors", () => {
  it("tries NIC's fast S3WaaS origin before the slow CDN, same path", () => {
    const list = documentSources(new URL(PDF)).map(String)
    expect(list).toEqual([PDF.replace("cdn.s3waas", "cdnbbsr.s3waas"), PDF])
    expect(hasMirror(new URL(PDF))).toBe(true)
  })
  it("leaves other hosts alone", () => {
    const u = new URL("https://ssc.gov.in/a.pdf")
    expect(documentSources(u).map(String)).toEqual([u.toString()])
    expect(hasMirror(u)).toBe(false)
  })
})

describe("openOfficialPdf", () => {
  it("serves the PDF from the mirror when it answers", async () => {
    safeFetch.mockImplementation(async (url: URL | string) => ({ res: pdfResponse(), finalUrl: String(url) }))
    const doc = await openOfficialPdf(new URL(PDF))
    expect(String(safeFetch.mock.calls[0][0])).toContain("cdnbbsr.s3waas.gov.in")
    expect(safeFetch).toHaveBeenCalledTimes(1)
    expect(await readAll(doc.stream)).toMatch(/^%PDF-/)
  })
  it("falls back to the original address when the mirror fails", async () => {
    safeFetch
      .mockImplementationOnce(async (url: URL | string) => ({ res: new Response("NoSuchKey", { status: 404 }), finalUrl: String(url) }))
      .mockImplementationOnce(async (url: URL | string) => ({ res: pdfResponse(), finalUrl: String(url) }))
    const doc = await openOfficialPdf(new URL(PDF))
    expect(String(safeFetch.mock.calls[1][0])).toBe(PDF)
    expect(doc.finalUrl).toBe(PDF)
  })
  it("reports the original site's error when every copy fails", async () => {
    safeFetch.mockImplementation(async (url: URL | string) => ({ res: new Response("x", { status: 503 }), finalUrl: String(url) }))
    await expect(openOfficialPdf(new URL(PDF))).rejects.toThrow("Official site responded 503")
    expect(safeFetch).toHaveBeenCalledTimes(2)
  })
})
