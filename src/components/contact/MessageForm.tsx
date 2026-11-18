"use client"

import { useRef, useState, type ChangeEvent } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react"
import { CHANNEL_TOPICS, getChannelTopic } from "@/lib/channels"
import { contactSchema, type ContactFormInput } from "@/lib/contact"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"

/* The inland letter card keeps its own pale blue in light and dark, like real paper. */
const LETTER = "oklch(90% 0.045 225)"
const LETTER_INK = "oklch(27% 0.06 250)"
const FIELD = "oklch(96% 0.022 225)"
const FIELD_LINE = "oklch(62% 0.07 240 / .35)"
const STAMP_INK = "oklch(42% 0.14 255)"
const LETTER_SHADOW = "0 1px 1px rgb(20 30 60 / .08), 0 26px 40px -28px rgb(20 30 60 / .6)"

type SentState = { reference: string; topicLabel: string; reply: string }

export function MessageForm() {
  const submissionKey = useRef<string | null>(null)
  const submitting = useRef(false)
  const [sent, setSent] = useState<SentState | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [topicValue, setTopicValue] = useState<string>("general")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", topic: "general", subject: "", message: "", website: "" },
  })

  const channel = getChannelTopic(topicValue)

  async function onSubmit(values: ContactFormInput) {
    if (submitting.current) return
    submitting.current = true
    setServerError(null)
    try {
      submissionKey.current ??= crypto.randomUUID()
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": submissionKey.current },
        body: JSON.stringify(values),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.success !== true || typeof data.reference !== "string") {
        if (res.status === 400 || res.status === 429) submissionKey.current = null
        throw new Error(data?.error || "Unable to send your message. Please try again.")
      }
      const topic = getChannelTopic(values.topic)
      setSent({
        reference: data.reference,
        topicLabel: topic?.label ?? "General question",
        reply: topic?.reply ?? "within 24 hours",
      })
      reset()
      setTopicValue("general")
      submissionKey.current = null
    } catch (error) {
      setServerError(error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
        ? "Confirmation took too long. Please retry; the same message will not be saved twice."
        : error instanceof Error ? error.message : "Unable to send your message. Please try again.")
    } finally {
      submitting.current = false
    }
  }

  if (sent) {
    return (
      <div className="relative overflow-hidden rounded-[6px] px-6 py-7 md:px-9 md:py-9" style={{ background: LETTER, color: LETTER_INK, boxShadow: LETTER_SHADOW }} role="status">
        {/* the postmark, with the reference number on it */}
        <div className="pointer-events-none absolute -right-6 -top-6 hidden h-40 w-40 rotate-[-14deg] items-center justify-center rounded-full border-[3px] text-center sm:flex" style={{ borderColor: STAMP_INK, color: STAMP_INK }} aria-hidden>
          <div className="flex h-[118px] w-[118px] flex-col items-center justify-center rounded-full border-[1.5px]" style={{ borderColor: STAMP_INK }}>
            <span className={cn(typeFont.className, "text-[10px] font-bold tracking-[0.2em]")}>POSTED</span>
            <span className={cn(typeFont.className, "mt-1 max-w-[96px] truncate text-[11px] font-bold")}>{sent.reference}</span>
            <span className={cn(typeFont.className, "mt-1 text-[9px] tracking-[0.2em]")}>CHAYANJOBS</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 shrink-0" style={{ color: "oklch(42% 0.1 160)" }} aria-hidden />
          <h3 className="font-display text-[22px] font-black">
            Message received
          </h3>
        </div>
        <p className={cn(handFont.className, "mt-1 text-[1.2rem]")}>your letter is in the bag. it&apos;s on its way to the right desk.</p>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed opacity-85">
          Your {sent.topicLabel.toLowerCase()} request is with the right team. Your reference number is{" "}
          <span className={cn(typeFont.className, "break-all rounded-[3px] bg-[oklch(97%_0.02_90)] px-1.5 py-0.5 font-bold")}>{sent.reference}</span> - please
          include it in any follow-up. We usually reply {sent.reply} on business days.
        </p>
        <button
          type="button"
          onClick={() => setSent(null)}
          className="mt-6 rounded-full border-[1.5px] px-5 py-2.5 text-[14px] font-semibold transition hover:-translate-y-px"
          style={{ borderColor: FIELD_LINE }}
        >
          Send another message
        </button>
      </div>
    )
  }

  const inputClass = (invalid: boolean) =>
    `h-11 w-full rounded-[8px] border-[1.5px] px-3.5 text-[15px] transition-all placeholder:text-[oklch(50%_0.04_240/0.6)] focus:outline-none focus:ring-4 focus:ring-[oklch(55%_0.1_240/0.18)] ${
      invalid ? "border-[oklch(48%_0.18_28)]" : "border-[oklch(62%_0.07_240/0.45)] focus:border-[oklch(40%_0.1_250)]"
    }`
  const fieldStyle = { background: FIELD, color: LETTER_INK }
  const labelClass = cn(typeFont.className, "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]")

  return (
    <form
      onSubmit={(event) => { void handleSubmit(onSubmit)(event) }}
      noValidate
      aria-busy={isSubmitting}
      className="relative rounded-[6px] px-5 pb-7 pt-6 md:px-9 md:pb-9"
      style={{ background: LETTER, color: LETTER_INK, boxShadow: LETTER_SHADOW }}
    >
      {/* printed head of an inland letter card */}
      <div className="mb-6 flex items-start justify-between gap-4 border-b-[1.5px] border-dashed pb-4" style={{ borderColor: FIELD_LINE }}>
        <div>
          <p className={cn(typeFont.className, "text-[11px] font-bold tracking-[0.25em]")}>INLAND LETTER CARD</p>
          <p className="text-[13px] opacity-75">अंतर्देशीय पत्र · to the ChayanJobs team</p>
          <p className={cn(handFont.className, "mt-1 text-[1.05rem] opacity-80")}>no stamp needed. this one&apos;s on us.</p>
        </div>
        <span className="flex h-[68px] w-[56px] shrink-0 rotate-[3deg] flex-col items-center justify-center border-[3px] border-dotted p-1 text-center" style={{ borderColor: LETTER, outline: `1px solid ${FIELD_LINE}`, background: "oklch(84% 0.07 30)" }} aria-hidden>
          <span className={cn(typeFont.className, "text-[8px] font-bold leading-tight text-[oklch(32%_0.1_28)]")}>INDIA</span>
          <span className="font-display text-[18px] font-black leading-none text-[oklch(32%_0.1_28)]">₹0</span>
          <span className={cn(typeFont.className, "text-[7px] font-bold text-[oklch(32%_0.1_28)]")}>FREE POST</span>
        </span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            maxLength={120}
            className={inputClass(!!errors.name)}
            style={fieldStyle}
            {...register("name")}
          />
          {errors.name && <FieldError id="contact-name-error" message={errors.name.message} />}
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            maxLength={254}
            className={inputClass(!!errors.email)}
            style={fieldStyle}
            {...register("email")}
          />
          {errors.email && <FieldError id="contact-email-error" message={errors.email.message} />}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-topic" className={labelClass}>
          Topic
        </label>
        <div className="relative">
          <select
            id="contact-topic"
            aria-invalid={!!errors.topic}
            aria-describedby={errors.topic ? "contact-topic-error" : undefined}
            className={`${inputClass(!!errors.topic)} appearance-none pr-10`}
            style={fieldStyle}
            {...register("topic", {
              onChange: (event: ChangeEvent<HTMLSelectElement>) => setTopicValue(event.target.value),
            })}
          >
            {CHANNEL_TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
        </div>
        {channel && (
          <p className={cn(handFont.className, "mt-1.5 text-[1.05rem] leading-snug")}>
            this letter goes to <span className={cn(typeFont.className, "text-[13px] font-bold")}>{channel.email}</span> · replies {channel.reply}
          </p>
        )}
        {errors.topic && <FieldError id="contact-topic-error" message={errors.topic.message} />}
      </div>

      <div className="mt-5">
        <label htmlFor="contact-subject" className={labelClass}>
          Subject
        </label>
        <input
          id="contact-subject"
          type="text"
          placeholder="Brief summary of your request"
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
          maxLength={200}
          className={inputClass(!!errors.subject)}
          style={fieldStyle}
          {...register("subject")}
        />
        {errors.subject && <FieldError id="contact-subject-error" message={errors.subject.message} />}
      </div>

      <div className="mt-5">
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="contact-message"
          rows={6}
          placeholder="How can we help?"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          maxLength={8000}
          className={`${inputClass(!!errors.message)} h-auto py-2.5 leading-[28px]`}
          style={{ ...fieldStyle, backgroundImage: `repeating-linear-gradient(transparent 0 27px, ${FIELD_LINE} 27px 28px)`, backgroundPosition: "0 10px", backgroundAttachment: "local" }}
          {...register("message")}
        />
        {errors.message && <FieldError id="contact-message-error" message={errors.message.message} />}
      </div>

      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        placeholder="Website"
        className="cp-honeypot"
        {...register("website")}
      />

      {serverError && (
        <p role="alert" className="mt-4 rounded-[6px] border-[1.5px] border-dashed border-[oklch(48%_0.18_28)] bg-[oklch(95%_0.03_30)] px-3 py-2 text-[14px] font-medium text-[oklch(42%_0.17_28)]">
          {serverError}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 rounded-full px-7 text-[15px] font-semibold text-[oklch(97%_0.01_90)] shadow-[0_8px_16px_-10px_rgb(0_0_0/.6)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          style={{ background: "oklch(48% 0.18 28)" }}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending…
            </span>
          ) : (
            "Send message"
          )}
        </button>
        <p className="text-[13px] leading-relaxed opacity-80">
          Protected by our{" "}
          <Link href="/privacy" className="font-semibold underline decoration-dotted underline-offset-4">
            Privacy Policy
          </Link>.
        </p>
      </div>
    </form>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className={cn(handFont.className, "mt-1 text-[1.02rem] text-[oklch(45%_0.18_28)]")}>
      ↑ {message}
    </p>
  )
}
