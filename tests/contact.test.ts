import assert from "node:assert/strict"
import { afterEach, mock, test } from "node:test"
import { NextRequest } from "next/server"
import type { Prisma } from "@prisma/client"
import { contactSchema } from "../src/lib/contact"
import { isSupportOnline } from "../src/lib/channels"
import { checkContactRateLimit, ContactRateLimitError, getClientIp } from "../src/lib/contact-server"

// Only fake credentials are used; every DB and provider call is mocked below.
process.env.RESEND_API_KEY = "re_contact_tests"
process.env.RESEND_FROM_EMAIL = "test@example.com"
process.env.NEXT_PUBLIC_APP_URL = "https://example.com"
process.env.AUTH_SECRET = "contact-test-secret"

const input = { name: "Test User", email: "sender@example.com", topic: "general", subject: "Test subject", message: "Please help with my account.", website: "" }
const key = "12345678-1234-4234-8234-123456789abc"
const reference = `CJ-${key.toUpperCase()}`
let prisma: typeof import("../src/lib/prisma").prisma
let POST: typeof import("../src/app/api/contact/route").POST
let deliver: typeof import("../src/lib/contact-delivery").deliverContactTicket

async function setup() {
  prisma = (await import("../src/lib/prisma")).prisma
  POST = (await import("../src/app/api/contact/route")).POST
  deliver = (await import("../src/lib/contact-delivery")).deliverContactTicket
}

function request(body: unknown = input, headers: Record<string, string> = {}) {
  return new NextRequest("https://example.com/api/contact", {
    method: "POST", headers: { "content-type": "application/json", "idempotency-key": key, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

const restorers: (() => void)[] = []
function stub<T extends (...args: never[]) => unknown>(target: object, method: string, implementation: T) {
  const object = target as Record<string, unknown>
  const original = object[method]
  const replacement = mock.fn(implementation)
  object[method] = replacement
  restorers.push(() => { object[method] = original })
  return replacement
}
afterEach(() => { restorers.reverse().forEach((restore) => restore()); restorers.length = 0; mock.restoreAll() })

test("validation trims fields and rejects invalid topics, lengths, and header injection", () => {
  assert.equal(contactSchema.parse({ ...input, name: "  Test User  " }).name, "Test User")
  for (const value of [{ topic: "unknown" }, { email: "bad" }, { name: " " }, { subject: "Hello\r\nBcc: other@example.com" }, { message: "short" }, { message: "x".repeat(8001) }]) {
    assert.equal(contactSchema.safeParse({ ...input, ...value }).success, false)
  }
})

test("support hours include Saturday and respect IST boundaries", () => {
  assert.equal(isSupportOnline(new Date("2026-10-17T04:00:00Z")), true)
  assert.equal(isSupportOnline(new Date("2026-10-17T03:59:00Z")), false)
  assert.equal(isSupportOnline(new Date("2026-10-17T13:00:00Z")), false)
  assert.equal(isSupportOnline(new Date("2026-10-18T06:00:00Z")), false)
})

test("client IP headers are ignored unless explicitly trusted", () => {
  const oldHeader = process.env.CONTACT_IP_HEADER
  const oldVercel = process.env.VERCEL
  delete process.env.CONTACT_IP_HEADER
  delete process.env.VERCEL
  try {
    const req = request(input, { "x-forwarded-for": "203.0.113.10, 10.0.0.1" })
    assert.equal(getClientIp(req), null)
    process.env.CONTACT_IP_HEADER = "x-forwarded-for"
    assert.equal(getClientIp(req), "203.0.113.10")
    assert.equal(getClientIp(request(input, { "x-forwarded-for": "invalid" })), null)
  } finally {
    if (oldHeader === undefined) delete process.env.CONTACT_IP_HEADER
    else process.env.CONTACT_IP_HEADER = oldHeader
    if (oldVercel === undefined) delete process.env.VERCEL
    else process.env.VERCEL = oldVercel
  }
})

test("rate limit blocks the sixth submission with a retry time", async () => {
  const tx = { $queryRaw: async () => [{ count: 6, expiresAt: new Date(Date.now() + 60000) }] } as unknown as Prisma.TransactionClient
  await assert.rejects(checkContactRateLimit(tx, input.email, "203.0.113.10"), (error: unknown) => error instanceof ContactRateLimitError && error.retryAfterSeconds > 0)
})

test("API rejects malformed, oversized, cross-origin and invalid requests before DB access", async () => {
  await setup()
  const find = stub(prisma.contactTicket, "findUnique", () => { throw new Error("Unexpected DB access") })
  for (const [req, status] of [
    [request("{"), 400], [request(null), 400], [request({ ...input, topic: "invalid" }), 400],
    [request(input, { origin: "https://attacker.example" }), 403],
    [request(input, { "sec-fetch-site": "cross-site" }), 403],
    [request(input, { "content-type": "text/plain" }), 415],
    [request("x".repeat(50000)), 413],
    [request(input, { "content-length": "50000" }), 413],
    [request(input, { "idempotency-key": "invalid" }), 400],
  ] as const) {
    const response = await POST(req)
    assert.equal(response.status, status)
    assert.equal(response.headers.get("cache-control"), "no-store")
    assert.equal((await response.json()).success, false)
  }
  assert.equal(find.mock.callCount(), 0)
})

test("honeypot acknowledges without storing or emailing", async () => {
  await setup()
  const find = stub(prisma.contactTicket, "findUnique", () => { throw new Error("Unexpected DB access") })
  assert.equal((await POST(request({ ...input, website: "https://spam.example" }))).status, 200)
  assert.equal(find.mock.callCount(), 0)
})

test("idempotent replay returns the stored reference without another insert", async () => {
  await setup()
  stub(prisma.contactTicket, "findUnique", async () => ({ id: reference, ...input }))
  const tx = stub(prisma, "$transaction", () => { throw new Error("Unexpected insert") })
  const response = await POST(request())
  assert.deepEqual(await response.json(), { success: true, reference })
  assert.equal(tx.mock.callCount(), 0)
  assert.equal((await POST(request({ ...input, message: "A different message now" }))).status, 409)
})

test("missing email credentials fail closed", async () => {
  await setup()
  stub(prisma.contactTicket, "findUnique", async () => null)
  const previous = process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY
  try { assert.equal((await POST(request())).status, 503) }
  finally { process.env.RESEND_API_KEY = previous }
})

test("database outages and rate limits return structured errors", async () => {
  await setup()
  stub(prisma.contactTicket, "findUnique", async () => null)
  const tx = stub(prisma, "$transaction", async () => { throw new ContactRateLimitError(120) })
  const limited = await POST(request())
  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get("retry-after"), "120")
  tx.mock.mockImplementation(async () => { throw new Error("DB unavailable") })
  const failed = await POST(request())
  assert.equal(failed.status, 503)
  assert.equal((await failed.json()).success, false)
})

test("ticket persistence precedes delivery and email failures preserve acceptance", async () => {
  await setup()
  stub(prisma.contactTicket, "findUnique", async () => null)
  let saved: Record<string, unknown> | undefined
  stub(prisma, "$transaction", async (callback: (tx: unknown) => Promise<unknown>) => callback({
    $queryRaw: async () => [{ count: 1, expiresAt: new Date(Date.now() + 3600000) }],
    contactTicket: { create: async ({ data }: { data: Record<string, unknown> }) => { saved = data } },
  }))
  stub(prisma.contactTicket, "updateMany", async () => {
    assert.equal(saved?.id, reference)
    throw new Error("Delivery temporarily unavailable")
  })
  const response = await POST(request())
  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), { success: true, reference })
  assert.equal(saved?.message, input.message)
  assert.equal(saved?.website, undefined)
})

test("delivery skips tickets leased by another worker", async () => {
  await setup()
  stub(prisma.contactTicket, "updateMany", async () => ({ count: 0 }))
  const fetchMock = stub(globalThis, "fetch", async () => { throw new Error("Unexpected send") })
  assert.equal(await deliver(reference), true)
  assert.equal(fetchMock.mock.callCount(), 0)
})

test("delivery escapes HTML, routes to the team and uses distinct provider idempotency keys", async () => {
  await setup()
  stub(prisma.contactTicket, "updateMany", async () => ({ count: 1 }))
  stub(prisma.contactTicket, "findUniqueOrThrow", async () => ({ id: reference, ...input,
    name: "<script> & User", message: "Keep <tags> & content intact", notifiedAt: null, autoRepliedAt: null }))
  const updates: unknown[] = []
  stub(prisma.contactTicket, "update", async (value: unknown) => { updates.push(value); return {} })
  const sends: { body: Record<string, string>; headers: Headers }[] = []
  stub(globalThis, "fetch", async (_url: unknown, init?: RequestInit) => {
    sends.push({ body: JSON.parse(String(init?.body)), headers: new Headers(init?.headers) })
    return Response.json({ id: "provider-email-id" })
  })
  assert.equal(await deliver(reference), true)
  assert.equal(sends.length, 2)
  assert.equal(sends[0].body.to, "hello@chayanjobs.com")
  assert.equal(sends[0].body.reply_to, input.email)
  assert.match(sends[0].body.html, /&lt;script&gt; &amp; User/)
  assert.match(sends[0].body.html, /Keep &lt;tags&gt; &amp; content intact/)
  assert.equal(sends[0].headers.get("idempotency-key"), `contact-team/${reference}`)
  assert.equal(sends[1].headers.get("idempotency-key"), `contact-reply/${reference}`)
  assert.equal(updates.length, 2)
})

test("provider failure schedules retry without acknowledging an undelivered message", async () => {
  await setup()
  stub(prisma.contactTicket, "updateMany", async () => ({ count: 1 }))
  stub(prisma.contactTicket, "findUniqueOrThrow", async () => ({ id: reference, ...input, notifiedAt: null, autoRepliedAt: null }))
  const update = stub(prisma.contactTicket, "update", async (args: { data: { nextAttemptAt: Date } }) => {
    assert.ok(args.data.nextAttemptAt instanceof Date)
    return {}
  })
  const sends = stub(globalThis, "fetch", async () => Response.json({ name: "rate_limit_exceeded", message: "Try again" }, { status: 429 }))
  assert.equal(await deliver(reference), false)
  assert.equal(sends.mock.callCount(), 1)
  const args = update.mock.calls[0].arguments[0] as { data: { nextAttemptAt: Date } }
  assert.ok(args.data.nextAttemptAt.getTime() > Date.now() + 14 * 60000)
})

test("cron rejects unauthenticated requests", async () => {
  const { GET } = await import("../src/app/api/cron/contact/route")
  assert.equal((await GET(request())).status, 401)
})
