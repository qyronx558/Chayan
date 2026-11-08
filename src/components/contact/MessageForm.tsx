"use client"

import { useRef, useState, type ChangeEvent } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react"
import { CHANNEL_TOPICS, getChannelTopic } from "@/lib/channels"
import { contactSchema, type ContactFormInput } from "@/lib/contact"

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
      <div className="rounded-xl border border-[var(--cp-border)] p-6 md:p-8" role="status">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-foreground" aria-hidden />
          <h3 className="text-[19px] font-semibold tracking-[-0.01em] text-[var(--cp-ink)]">
            Message received
          </h3>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--cp-muted)]">
          Your {sent.topicLabel.toLowerCase()} request is with the right team. Your reference number is{" "}
          <span className="break-all font-mono font-semibold text-[var(--cp-ink)]">{sent.reference}</span> — please
          include it in any follow-up. We usually reply {sent.reply} on business days.
        </p>
        <button
          type="button"
          onClick={() => setSent(null)}
          className="mt-5 rounded-md border border-[var(--cp-border)] px-4 py-2 text-[14px] font-medium text-[var(--cp-ink)] transition-colors hover:bg-[var(--cp-soft)]"
        >
          Send another message
        </button>
      </div>
    )
  }

  const inputClass = (invalid: boolean) =>
    `h-10 w-full rounded-md border bg-[var(--cp-field)] px-3 text-[15px] text-[var(--cp-ink)] placeholder:text-[var(--cp-faint)] transition-colors ${
      invalid ? "border-brick" : "border-[var(--cp-border)]"
    }`

  return (
    <form onSubmit={(event) => { void handleSubmit(onSubmit)(event) }} noValidate aria-busy={isSubmitting}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-[14px] font-medium text-[var(--cp-ink)]">
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
            {...register("name")}
          />
          {errors.name && <FieldError id="contact-name-error" message={errors.name.message} />}
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-[14px] font-medium text-[var(--cp-ink)]">
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
            {...register("email")}
          />
          {errors.email && <FieldError id="contact-email-error" message={errors.email.message} />}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-topic" className="mb-1.5 block text-[14px] font-medium text-[var(--cp-ink)]">
          Topic
        </label>
        <div className="relative">
          <select
            id="contact-topic"
            aria-invalid={!!errors.topic}
            aria-describedby={errors.topic ? "contact-topic-error" : undefined}
            className={`h-10 w-full appearance-none rounded-md border bg-[var(--cp-field)] pl-3 pr-10 text-[15px] text-[var(--cp-ink)] transition-colors ${
              errors.topic ? "border-brick" : "border-[var(--cp-border)]"
            }`}
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
          <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cp-faint)]" />
        </div>
        {channel && (
          <p className="mt-1.5 text-[13px] text-[var(--cp-muted)]">
            Goes to <span className="font-mono text-[var(--cp-ink)]">{channel.email}</span> · replies {channel.reply}
          </p>
        )}
        {errors.topic && <FieldError id="contact-topic-error" message={errors.topic.message} />}
      </div>

      <div className="mt-5">
        <label htmlFor="contact-subject" className="mb-1.5 block text-[14px] font-medium text-[var(--cp-ink)]">
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
          {...register("subject")}
        />
        {errors.subject && <FieldError id="contact-subject-error" message={errors.subject.message} />}
      </div>

      <div className="mt-5">
        <label htmlFor="contact-message" className="mb-1.5 block text-[14px] font-medium text-[var(--cp-ink)]">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={6}
          placeholder="How can we help?"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          maxLength={8000}
          className={`w-full rounded-md border bg-[var(--cp-field)] px-3 py-2.5 text-[15px] leading-relaxed text-[var(--cp-ink)] placeholder:text-[var(--cp-faint)] transition-colors ${
            errors.message ? "border-brick" : "border-[var(--cp-border)]"
          }`}
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
        <p role="alert" className="mt-4 text-[14px] font-medium text-brick">
          {serverError}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 rounded-md bg-[var(--cp-btn)] px-5 text-[15px] font-medium text-[var(--cp-btn-ink)] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending…
            </span>
          ) : (
            "Send message"
          )}
        </button>
        <p className="text-[13px] leading-relaxed text-[var(--cp-muted)]">
          Protected by our{" "}
          <Link href="/privacy" className="text-[var(--cp-link)] underline decoration-[var(--cp-link)]/40 underline-offset-4 hover:decoration-[var(--cp-link)]">
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
    <p id={id} role="alert" className="mt-1.5 text-[13px] text-brick">
      {message}
    </p>
  )
}
