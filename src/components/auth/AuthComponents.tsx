"use client"

import type { CSSProperties, ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import "@/app/home.css"

export type AuthVariant = "login" | "register" | "forgot" | "forgot-sent" | "reset" | "reset-done"

interface AuthLayoutProps {
  children: ReactNode
  sideContent?: ReactNode
  sideTitle?: string
  sideDescription?: string
  benefits?: Array<{ icon: ReactNode; title: string; description: string }>
  /** Which desk scene to draw beside the form. Purely visual. */
  variant?: AuthVariant
  /** Login only: which pass the reader is holding. */
  pass?: "seeker" | "employer"
  /** Register only: the name being typed, shown on the desk nameplate. */
  nameplate?: string
}

/*
 * Signing in should feel like coming back to your own desk, not like
 * talking to a firewall. Each auth page is one small, real scene:
 *   login     a member pass on a lanyard, your desk as you left it
 *   register  a new desk, with a nameplate that fills in as you type
 *   forgot    a lost key on a paper tag; then a new key "in the post"
 *   reset     cutting a new key
 * The form itself always sits on the same paper card, so the fields,
 * buttons and errors behave exactly as before.
 */

const BRICK = "var(--color-brick)"
const BLUE = "oklch(45% 0.13 255)"
const NOTE_INK = "oklch(28% 0.03 60)"

const SCENES: Record<AuthVariant, { hello: string; title: string; card: string; listTitle: string; note: string; mobile: string }> = {
  login: { hello: "welcome back,", title: "Your desk is where you left it.", card: "MEMBER PASS", listTitle: "waiting on your desk:", note: "check today's deadlines before chai ☕", mobile: "welcome back, your desk is waiting." },
  register: { hello: "come in,", title: "Pull up a chair. This desk is yours.", card: "FORM 01 · A DESK OF YOUR OWN", listTitle: "what comes with the desk:", note: "free. no catch. no fee, ever.", mobile: "pull up a chair. this desk is yours." },
  forgot: { hello: "lost your key?", title: "Happens to all of us.", card: "LOST & FOUND · KEYS", listTitle: "how this works:", note: "your old password stops working once you set a new one.", mobile: "lost your key? happens to all of us." },
  "forgot-sent": { hello: "done,", title: "A new key is in the post.", card: "LOST & FOUND · KEYS", listTitle: "while you wait:", note: "peek in spam & promotions too.", mobile: "a new key is in the post." },
  reset: { hello: "nearly there,", title: "Cut yourself a new key.", card: "KEY CUTTING", listTitle: "about the new key:", note: "make it one you don't use anywhere else.", mobile: "cut yourself a new key." },
  "reset-done": { hello: "there,", title: "New key. Same desk.", card: "KEY CUTTING", listTitle: "what just happened:", note: "sign in once more and you're home.", mobile: "new key. same desk." },
}

/* ── tiny drawn things ── */

function Tick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M4 13.5 C 6 15, 8 17, 9.5 19 C 12 13, 16 8, 21 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="hs-draw" style={{ ["--len" as string]: 40 } as CSSProperties} />
    </svg>
  )
}

function ChaiRing({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden>
      <circle cx="60" cy="60" r="44" stroke="oklch(55% 0.08 55 / .28)" strokeWidth="5" strokeDasharray="220 18 40 9" />
      <circle cx="60" cy="60" r="40" stroke="oklch(55% 0.08 55 / .14)" strokeWidth="2" />
    </svg>
  )
}

function Pencil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 24" className={className} aria-hidden>
      <rect x="22" y="5" width="150" height="14" rx="2" fill="oklch(80% 0.14 85)" />
      <rect x="22" y="5" width="150" height="4.5" fill="oklch(86% 0.12 88)" />
      <rect x="172" y="5" width="16" height="14" fill="oklch(78% 0.05 20)" />
      <rect x="166" y="5" width="7" height="14" fill="oklch(70% 0.02 80)" />
      <path d="M22 5 L 4 12 L 22 19 Z" fill="oklch(85% 0.05 70)" />
      <path d="M9 10 L 4 12 L 9 14 Z" fill="oklch(30% 0.02 60)" />
    </svg>
  )
}

function KeyOnTag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 150" className={className} fill="none" aria-hidden>
      {/* string */}
      <path d="M58 54 C 80 30, 110 70, 132 52" stroke="oklch(60% 0.04 60)" strokeWidth="1.6" />
      {/* key */}
      <g transform="rotate(-14 60 60)">
        <circle cx="46" cy="60" r="20" stroke="oklch(62% 0.11 80)" strokeWidth="7" />
        <path d="M66 60 H 128 M 112 60 v 12 M 100 60 v 9 M 122 60 v 14" stroke="oklch(62% 0.11 80)" strokeWidth="7" strokeLinecap="round" />
      </g>
      {/* paper tag */}
      <g transform="rotate(8 180 70)">
        <path d="M134 40 L 150 28 H 226 V 112 H 150 L 134 100 Z" fill="oklch(96% 0.03 85)" stroke="oklch(70% 0.04 70)" strokeWidth="1.2" />
        <circle cx="146" cy="70" r="4.5" fill="none" stroke="oklch(60% 0.04 60)" strokeWidth="1.6" />
        <text x="160" y="62" fontSize="11" fill={NOTE_INK} fontFamily="'Courier Prime', monospace" fontWeight="700">YOUR</text>
        <text x="160" y="78" fontSize="11" fill={NOTE_INK} fontFamily="'Courier Prime', monospace" fontWeight="700">ACCOUNT</text>
        <path d="M160 90 C 172 86, 186 94, 210 88" stroke={BRICK} strokeWidth="1.6" />
      </g>
    </svg>
  )
}

function Envelope({ className }: { className?: string }) {
  return (
    <div className={cn("relative p-[5px]", className)} style={{ background: "repeating-linear-gradient(135deg, oklch(55% 0.19 27) 0 10px, transparent 10px 15px, oklch(45% 0.13 255) 15px 25px, transparent 25px 30px)", boxShadow: "0 18px 30px -22px rgb(30 30 60 / .6)" }} aria-hidden>
      <div className="relative bg-[oklch(98%_0.008_90)] px-5 pb-5 pt-4 text-[oklch(27%_0.03_60)]">
        <div className="flex items-start justify-between">
          <p className={cn(typeFont.className, "text-[10px] font-bold tracking-[0.25em]")}>BY AIR MAIL</p>
          <span className="flex h-12 w-10 items-center justify-center border-[3px] border-dotted border-[oklch(98%_0.008_90)] bg-[oklch(88%_0.07_230)] text-xl outline outline-1 outline-[oklch(70%_0.04_250)]">🔑</span>
        </div>
        <p className={cn(handFont.className, "mt-3 text-[1.35rem] leading-tight")}>to: the owner of this desk</p>
        <div className="mt-2 space-y-2">
          <div className="h-px w-3/4 bg-[oklch(27%_0.03_60/0.25)]" />
          <div className="h-px w-1/2 bg-[oklch(27%_0.03_60/0.25)]" />
        </div>
        <span className={cn(typeFont.className, "absolute bottom-3 right-4 rotate-[-10deg] rounded-full border-2 px-2 py-1 text-[9px] font-bold")} style={{ color: BLUE, borderColor: BLUE }}>SENT · 1 HR VALID</span>
      </div>
    </div>
  )
}

function Nameplate({ name }: { name?: string }) {
  const shown = name?.trim()
  return (
    <div className="relative mx-auto w-[300px]" aria-hidden>
      {/* the wooden block */}
      <div className="rounded-t-[6px] px-4 pb-4 pt-3" style={{ background: "linear-gradient(180deg, oklch(48% 0.07 50), oklch(40% 0.06 45))", boxShadow: "inset 0 1px 0 oklch(60% 0.07 55)" }}>
        {/* the brass plate */}
        <div className="rounded-[3px] px-4 py-3 text-center" style={{ background: "linear-gradient(180deg, oklch(86% 0.09 85), oklch(74% 0.1 78))", boxShadow: "inset 0 1px 0 oklch(95% 0.05 90), 0 1px 2px rgb(0 0 0 / .4)" }}>
          <p className={cn(typeFont.className, "text-[9.5px] font-bold tracking-[0.3em] text-[oklch(35%_0.05_60)]")}>DESK OF</p>
          <p className={cn(handFont.className, "mt-0.5 truncate text-[1.6rem] leading-tight", shown ? "text-[oklch(25%_0.04_60)]" : "text-[oklch(40%_0.05_60/0.55)]")}>{shown || "your name here"}</p>
        </div>
      </div>
      <div className="h-3 rounded-b-[4px]" style={{ background: "oklch(33% 0.05 45)" }} />
      <div className="mx-6 h-2 rounded-full bg-black/15 blur-[3px]" />
    </div>
  )
}

function DeskScene({ variant, benefits, nameplate }: { variant: AuthVariant; benefits: AuthLayoutProps["benefits"]; nameplate?: string }) {
  const sc = SCENES[variant]
  const list = benefits ?? []
  return (
    <div className="relative">
      {variant === "register" ? <div className="mb-8"><Nameplate name={nameplate} /></div> : null}
      {variant === "forgot" || variant === "reset" ? <KeyOnTag className="mb-4 h-[130px] w-[230px]" /> : null}
      {variant === "forgot-sent" ? <Envelope className="mb-8 w-[320px] -rotate-[2deg]" /> : null}
      {variant === "reset-done" ? <div className={cn(handFont.className, "mb-6 inline-flex items-center gap-2 text-[1.3rem]")} style={{ color: "oklch(45% 0.1 160)" }}><Tick className="h-8 w-8" /> done.</div> : null}

      <div className="relative">
        {/* the notebook page */}
        <div
          className="relative -rotate-[1.2deg] rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] py-6 pl-14 pr-7"
          style={{
            backgroundImage: "repeating-linear-gradient(transparent 0 31px, color-mix(in oklch, oklch(60% 0.08 250) 22%, transparent) 31px 32px)",
            backgroundPosition: "0 22px",
            boxShadow: "0 1px 1px rgb(0 0 0 / .05), 0 22px 34px -24px rgb(40 20 0 / .45)",
          }}
        >
          <span className="absolute inset-y-0 left-10 w-px bg-[oklch(62%_0.16_25/0.45)]" aria-hidden />
          <p className={cn(handFont.className, "text-[1.3rem] leading-[32px]")} style={{ color: BRICK }}>{sc.listTitle}</p>
          <ul>
            {list.map((b) => (
              <li key={b.title} className="relative">
                <Tick className="absolute -left-9 top-1 h-6 w-6 text-[oklch(45%_0.1_160)]" />
                <p className="text-[15px] font-semibold leading-[32px] text-foreground">{b.title}</p>
                <p className="text-[13.5px] leading-[32px] text-muted-foreground">{b.description}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* a sticky note over the corner */}
        <div
          className={cn(handFont.className, "absolute -right-4 -top-7 w-[180px] rotate-[4deg] px-4 pb-4 pt-5 text-[1.08rem] leading-snug")}
          style={{ background: "oklch(93% 0.09 95)", color: NOTE_INK, boxShadow: "0 1px 1px rgb(60 40 10 / .1), 0 12px 18px -12px rgb(60 40 10 / .5)" }}
        >
          <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rotate-[-3deg] bg-[oklch(92%_0.03_90/0.8)] shadow-[0_1px_2px_rgb(0_0_0/.12)]" aria-hidden />
          {sc.note}
        </div>

        {variant === "login" ? <ChaiRing className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32" /> : null}
        <Pencil className="pointer-events-none absolute -bottom-6 right-6 h-5 w-48 rotate-[-8deg] drop-shadow-[0_4px_3px_rgb(0_0_0/0.18)]" />
      </div>
    </div>
  )
}

export function AuthLayout({
  children,
  sideContent,
  sideTitle,
  sideDescription,
  benefits = [],
  variant = "login",
  pass = "seeker",
  nameplate,
}: AuthLayoutProps) {
  const sc = SCENES[variant]
  const strap = pass === "employer" ? BLUE : BRICK
  return (
    <div
      className="home-saas relative overflow-hidden px-4 pb-16 pt-10 sm:pt-14"
      style={{ backgroundImage: "radial-gradient(color-mix(in oklch, var(--color-foreground) 9%, transparent) 1px, transparent 1.2px)", backgroundSize: "22px 22px" }}
    >
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_460px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden lg:block"
        >
          {sideContent || (
            <div className="max-w-xl">
              <p className={cn(handFont.className, "text-[1.5rem] leading-none")} style={{ color: BRICK }}>{sc.hello}</p>
              <h1 className="mt-2 font-display text-[2.9rem] font-black leading-[1.04] text-foreground">{sc.title}</h1>
              <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-muted-foreground">
                {sideDescription || sideTitle || "Discover latest opportunities, track applications, and never miss a career move."}
              </p>
              <div className="mt-12 pr-6">
                <DeskScene variant={variant} benefits={benefits} nameplate={nameplate} />
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
          className="w-full"
        >
          <div className="mx-auto w-full max-w-[460px]">
            <p className={cn(handFont.className, "mb-6 text-center text-[1.3rem] leading-snug lg:hidden")} style={{ color: BRICK }}>{sc.mobile}</p>

            <div className={cn("relative", variant === "login" && "pt-12")}>
              {/* login: the pass hangs from a lanyard */}
              {variant === "login" ? (
                <div className="absolute left-1/2 top-0 z-0 flex -translate-x-1/2 flex-col items-center" aria-hidden>
                  <span className="h-10 w-7 transition-colors duration-500" style={{ background: `repeating-linear-gradient(90deg, ${strap} 0 5px, color-mix(in oklch, ${strap} 80%, black) 5px 7px)` }} />
                  <span className="-mt-1 h-5 w-10 rounded-[4px] border-2 border-[oklch(62%_0.02_80)] bg-[oklch(80%_0.01_80)]" />
                </div>
              ) : null}

              <div
                className="relative z-10 rounded-[18px] border border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] px-6 pb-8 pt-10 sm:px-9"
                style={{ boxShadow: "0 1px 1px rgb(0 0 0 / .05), 0 30px 50px -30px rgb(30 20 10 / .55)" }}
              >
                {/* punched slot + the card's printed label */}
                <span className="absolute left-1/2 top-4 h-2.5 w-16 -translate-x-1/2 rounded-full border border-[var(--hs-border-strong)] bg-background shadow-[inset_0_1px_2px_rgb(0_0_0/.2)]" aria-hidden />
                <p
                  className={cn(typeFont.className, "mb-6 text-center text-[10px] font-bold tracking-[0.3em] transition-colors duration-500")}
                  style={{ color: variant === "login" ? strap : "var(--color-muted-foreground)" }}
                  aria-hidden
                >
                  {variant === "login" ? (pass === "employer" ? "EMPLOYER PASS" : "JOBSEEKER PASS") : sc.card}
                </p>
                {children}
              </div>
            </div>

            <p className="mt-6 text-center text-[13px] text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="/terms" className="font-medium text-foreground underline decoration-dotted underline-offset-4 hover:text-[var(--color-brick)]">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="font-medium text-foreground underline decoration-dotted underline-offset-4 hover:text-[var(--color-brick)]">
                Privacy Policy
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export function GoogleButton({
  onClick,
  disabled,
  loading,
  className = "",
}: {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-6 py-3 text-[15px] font-semibold text-foreground",
        "transition-all duration-150 hover:-translate-y-px hover:border-foreground/50 hover:shadow-[0_6px_14px_-8px_rgb(0_0_0/.35)] active:translate-y-0 active:scale-[0.99]",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_oklch,var(--color-brick)_18%,transparent)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-brick" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#4285F4"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#EA4335"
          />
        </svg>
      )}
      <span>{loading ? "Connecting..." : "Continue with Google"}</span>
    </button>
  )
}

export function Divider({ children = "or continue with email" }: { children?: string }) {
  return (
    <div className="my-6 flex items-center gap-3" role="separator">
      <span className="h-px flex-1 border-t border-dashed border-[var(--hs-border-strong)]" />
      <span className={cn(handFont.className, "text-[1.05rem] text-muted-foreground")}>{children}</span>
      <span className="h-px flex-1 border-t border-dashed border-[var(--hs-border-strong)]" />
    </div>
  )
}

/* one look for every field on the auth cards */
const LABEL = cn(typeFont.className, "block text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/75")
const FIELD =
  "w-full rounded-[12px] border-[1.5px] border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/55 transition-all duration-200 focus:border-foreground/70 focus:bg-[var(--hs-paper-slip)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_oklch,var(--color-brick)_14%,transparent)] disabled:cursor-not-allowed disabled:opacity-50"
const FIELD_ERR = "border-[var(--color-brick)] focus:border-[var(--color-brick)]"

/** Errors are written under the field in pen, pointing at what to fix. */
function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return <p className={cn(handFont.className, "text-[1.02rem] leading-snug text-[var(--color-brick)]")}>↑ {children}</p>
}

export function InputWithIcon({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode
  label: string
  error?: string
}) {
  const { label, error, ...inputProps } = props
  const fieldId = inputProps.id ?? inputProps.name
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className={LABEL}>{label}</label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80">
            {icon}
          </div>
        )}
        <input
          {...inputProps}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          className={cn(FIELD, icon && "pl-11", error && FIELD_ERR)}
        />
      </div>
      <FieldError>{error}</FieldError>
    </div>
  )
}

export function PasswordInput({
  label,
  value,
  onChange,
  onBlur,
  ref,
  onToggle,
  show,
  error,
  placeholder,
  icon,
  id,
  name,
  autoComplete,
  disabled,
  required,
  ...props
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  ref?: React.Ref<HTMLInputElement>
  onToggle: () => void
  show: boolean
  error?: string
  placeholder?: string
  icon?: ReactNode
  id: string
  name: string
  autoComplete?: string
  disabled?: boolean
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={LABEL}>{label}</label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80">
            {icon}
          </div>
        )}
        <input
          type={show ? "text" : "password"}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          ref={ref}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(FIELD, "pr-12", icon && "pl-11", error && FIELD_ERR)}
          {...props}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[var(--hs-surface-2)] hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
          title={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.970 9.970 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  )
}

export function StrengthMeter({ password }: { password: string }) {
  if (!password) return null

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const levels = [
    { label: "Weak", aside: "too easy to guess", color: "oklch(55% 0.19 27)" },
    { label: "Fair", aside: "getting there", color: "oklch(64% 0.16 50)" },
    { label: "Good", aside: "decent. one more twist?", color: "oklch(70% 0.14 80)" },
    { label: "Strong", aside: "strong. nice.", color: "oklch(55% 0.12 150)" },
    { label: "Very Strong", aside: "a vault door.", color: "oklch(45% 0.11 160)" },
  ]

  const idx = Math.min(score, levels.length - 1)
  const level = levels[idx]

  return (
    <div className="mt-2 space-y-1" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={5} aria-label="Password strength" aria-valuetext={level.label}>
      {/* five pencil strokes, filled in as the password grows up */}
      <div className="flex gap-1.5" aria-hidden>
        {levels.map((l, i) => (
          <svg key={l.label} viewBox="0 0 60 8" className="h-2 flex-1" preserveAspectRatio="none">
            <path d="M2 4.5 C 16 2.5, 34 6, 58 3.5" fill="none" strokeWidth="4" strokeLinecap="round" stroke={i <= idx ? level.color : "var(--hs-border)"} style={{ transition: "stroke .3s ease" }} />
          </svg>
        ))}
      </div>
      <p className="flex items-baseline gap-2 text-xs">
        <span className={cn(typeFont.className, "font-bold uppercase")} style={{ color: level.color }}>{level.label}</span>
        <span className={cn(handFont.className, "text-[0.98rem] text-muted-foreground")}>{level.aside}</span>
      </p>
    </div>
  )
}
