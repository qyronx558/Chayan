import { NextRequest, NextResponse } from "next/server"
import { contactSchema } from "@/lib/contact"
import { checkContactRateLimit, ContactRateLimitError, createReference, getClientIp } from "@/lib/contact-server"
import { deliverContactTicket } from "@/lib/contact-delivery"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin : request.nextUrl.origin
  if ((origin && origin !== allowedOrigin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return respond({ success: false, error: "Request origin is not allowed" }, 403)
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return respond({ success: false, error: "Content-Type must be application/json" }, 415)
  }
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    return respond({ success: false, error: "Request body is too large" }, 413)
  }
  let body: unknown
  const reader = request.body?.getReader()
  if (!reader) return respond({ success: false, error: "Invalid request body" }, 400)
  try {
    let size = 0
    const chunks: Uint8Array[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel()
        return respond({ success: false, error: "Request body is too large" }, 413)
      }
      chunks.push(value)
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } catch {
    return respond({ success: false, error: "Invalid request body" }, 400)
  } finally {
    reader.releaseLock()
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return respond({ success: false, error: first?.message || "Invalid form data" }, 400)
  }

  const { website, ...data } = parsed.data
  if (website) return respond({ success: true, reference: createReference() })
  const key = request.headers.get("idempotency-key")
  if (key && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    return respond({ success: false, error: "Invalid idempotency key" }, 400)
  }
  const reference = key ? `CJ-${key.toUpperCase()}` : createReference()
  try {
    const existing = await prisma.contactTicket.findUnique({ where: { id: reference } })
    if (existing) {
      if (Object.entries(data).some(([field, value]) => existing[field as keyof typeof data] !== value)) {
        return respond({ success: false, error: "This submission key was already used. Reload the page to send a new message." }, 409)
      }
      return respond({ success: true, reference })
    }
    if (!process.env.RESEND_API_KEY || (process.env.NODE_ENV === "production" && !process.env.RESEND_FROM_EMAIL)) {
      console.error("[contact] Email delivery is not configured")
      return respond({ success: false, error: "Messaging is temporarily unavailable. Please use the email directory below." }, 503)
    }
    await prisma.$transaction(async (tx) => {
      await checkContactRateLimit(tx, data.email, getClientIp(request))
      await tx.contactTicket.create({ data: { id: reference, ...data } })
    })
  } catch (error) {
    if (error instanceof ContactRateLimitError) {
      return respond({ success: false, error: `Too many messages. Please try again in ${Math.ceil(error.retryAfterSeconds / 60)} minutes.` }, 429,
        { "Retry-After": String(error.retryAfterSeconds) })
    }
    if ((error as { code?: string }).code === "P2002") {
      return respond({ success: false, error: "This message is being processed. Please retry shortly." }, 409)
    }
    console.error("[contact] Ticket storage failed")
    return respond({ success: false, error: "Unable to save your message. Please try again." }, 503)
  }

  try {
    await deliverContactTicket(reference)
  } catch {
    console.error("[contact] Delivery deferred", { reference })
  }

  return respond({ success: true, reference }, 201)
}

export const runtime = "nodejs"
const MAX_BODY_BYTES = 48 * 1024

function respond(body: object, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } })
}
