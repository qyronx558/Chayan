import { normalizeExternalUrl } from "@/lib/apply-room"
import { validateProxyTarget, safeFetch, browserHeaders } from "@/lib/proxy"

export const DOC_MAX_BYTES = 40 * 1024 * 1024
/** Time allowed for the official server to start answering. */
const DOC_HEADER_TIMEOUT_MS = 15000
/** Time allowed for the whole file to pass through. */
const DOC_TOTAL_TIMEOUT_MS = 55000
/** How much of the file is inspected before the first byte is sent on. */
const SNIFF_BYTES = 1024

export interface OfficialPdf {
  stream: ReadableStream<Uint8Array>
  /** Byte length when the official server declares it, else null. */
  length: number | null
  finalUrl: string
}

/**
 * Open an official PDF with SSRF, size and type guards and hand it back as a
 * stream. Only the first kilobyte is held to confirm it really is a PDF; the
 * rest flows straight to the reader, so the first page shows while a large
 * file is still arriving and nothing big is buffered in memory.
 */
export async function openOfficialPdf(url: URL): Promise<OfficialPdf> {
  const controller = new AbortController()
  let timer = setTimeout(() => controller.abort(), DOC_HEADER_TIMEOUT_MS)
  const fail = async (reader: ReadableStreamDefaultReader<Uint8Array> | null, message: string): Promise<never> => {
    clearTimeout(timer)
    await reader?.cancel().catch(() => {})
    controller.abort()
    throw new Error(message)
  }

  let res: Response
  let finalUrl: string
  try {
    ;({ res, finalUrl } = await safeFetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: browserHeaders("application/pdf,*/*;q=0.8"),
    }))
  } catch (err) {
    clearTimeout(timer)
    if (controller.signal.aborted) throw new Error("Official site took too long to respond")
    throw err
  }

  if (!res.ok) return fail(null, `Official site responded ${res.status}`)
  const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase()
  if (/^text\/html|^application\/xhtml/.test(contentType)) return fail(null, "Document is not a PDF")
  if (!res.body) return fail(null, "Empty document")

  clearTimeout(timer)
  timer = setTimeout(() => controller.abort(), DOC_TOTAL_TIMEOUT_MS)

  // Hold back just enough to check the %PDF- signature (it may sit after a
  // little leading junk, so look through the first kilobyte).
  const reader = res.body.getReader()
  const held: Uint8Array[] = []
  let heldBytes = 0
  let ended = false
  try {
    while (heldBytes < SNIFF_BYTES) {
      const { done, value } = await reader.read()
      if (done) {
        ended = true
        break
      }
      held.push(value)
      heldBytes += value.byteLength
    }
  } catch {
    return fail(reader, "Official site took too long to respond")
  }
  if (heldBytes === 0) return fail(reader, "Empty document")
  const head = new Uint8Array(Math.min(heldBytes, SNIFF_BYTES))
  let filled = 0
  for (const chunk of held) {
    if (filled >= head.length) break
    const part = chunk.subarray(0, head.length - filled)
    head.set(part, filled)
    filled += part.byteLength
  }
  if (!new TextDecoder("latin1").decode(head).includes("%PDF-")) return fail(reader, "Document is not a PDF")

  const declared = Number(res.headers.get("content-length"))
  // Content-Length describes the compressed body when an encoding is applied.
  const length =
    !res.headers.get("content-encoding") && Number.isFinite(declared) && declared > 0 ? declared : null
  if (length !== null && length > DOC_MAX_BYTES) return fail(reader, "Document too large")

  let sent = 0
  const stream = new ReadableStream<Uint8Array>({
    async pull(ctrl) {
      try {
        const next = held.shift()
        if (next) {
          sent += next.byteLength
          ctrl.enqueue(next)
          return
        }
        if (ended) {
          clearTimeout(timer)
          ctrl.close()
          return
        }
        const { done, value } = await reader.read()
        if (done) {
          clearTimeout(timer)
          ctrl.close()
          return
        }
        sent += value.byteLength
        if (sent > DOC_MAX_BYTES) throw new Error("Document too large")
        ctrl.enqueue(value)
      } catch (err) {
        clearTimeout(timer)
        controller.abort()
        ctrl.error(err)
      }
    },
    cancel() {
      clearTimeout(timer)
      controller.abort()
    },
  })

  return { stream, length, finalUrl }
}

export function resolveDocTarget(raw: string | null | undefined): URL {
  const normalized = normalizeExternalUrl(raw)
  if (!normalized) throw new Error("Invalid URL")
  return validateProxyTarget(normalized)
}
