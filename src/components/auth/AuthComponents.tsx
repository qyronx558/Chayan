"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"

interface AuthLayoutProps {
  children: ReactNode
  sideContent?: ReactNode
  sideTitle?: string
  sideDescription?: string
  benefits?: Array<{ icon: ReactNode; title: string; description: string }>
}

export function AuthLayout({
  children,
  sideContent,
  sideTitle,
  sideDescription,
  benefits = [],
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-12 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-teal-200/30 blur-3xl animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-100/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-5xl items-center justify-center mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden lg:block lg:w-1/2 lg:pr-12"
        >
          {sideContent || (
            <div className="h-full flex flex-col items-start justify-center p-8 max-w-lg">
              <div className="mb-8">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100 text-teal-700 text-sm font-medium dark:bg-teal-900/30 dark:text-teal-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                  </span>
                  Career & Jobs Portal
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
                {sideTitle || "Your Career Gateway"}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-lg">
                {sideDescription || "Discover latest opportunities, track applications, and never miss a career move. Join thousands of professionals."}
              </p>
              {benefits.length > 0 && (
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={benefit.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-800 transition-colors"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                        {benefit.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{benefit.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{benefit.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full lg:w-1/2"
        >
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div className="lg:hidden text-center mb-8">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100 text-teal-700 text-sm font-medium dark:bg-teal-900/30 dark:text-teal-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                </span>
                Career & Jobs Portal
              </span>
            </div>
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl p-8">
              {children}
            </div>
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              By continuing, you agree to our{" "}
              <a href="/terms" className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">
                Privacy Policy
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
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
      className={`
        w-full flex items-center justify-center gap-3 px-6 py-3.5
        rounded-xl font-semibold text-base
        bg-white border border-gray-200 dark:border-gray-700
        text-gray-900 dark:text-white
        hover:bg-gray-50 dark:hover:bg-gray-800
        active:scale-[0.98] transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-sm hover:shadow-md
        ${className}
      `}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-teal-600" viewBox="0 0 24 24">
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
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl text-gray-500 font-medium">
          {children}
        </span>
      </div>
    </div>
  )
}

export function InputWithIcon({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode
  label: string
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{props.label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`
            w-full px-4 py-3 rounded-xl border
            bg-white dark:bg-gray-800
            border-gray-200 dark:border-gray-700
            text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500
            transition-all duration-200
            ${icon ? "pl-10" : ""}
            ${props.error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
      </div>
      {props.error && <p className="text-sm text-red-500">{props.error}</p>}
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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
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
          className={`
            w-full px-4 py-3 rounded-xl border
            bg-white dark:bg-gray-800
            border-gray-200 dark:border-gray-700
            text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500
            transition-all duration-200
            pr-12 ${icon ? "pl-10" : ""}
            ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          {...props}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
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
    { label: "Weak", color: "bg-red-500", width: "16%" },
    { label: "Fair", color: "bg-orange-500", width: "33%" },
    { label: "Good", color: "bg-yellow-500", width: "50%" },
    { label: "Strong", color: "bg-green-500", width: "66%" },
    { label: "Very Strong", color: "bg-emerald-500", width: "100%" },
  ]

  const level = levels[Math.min(score, levels.length - 1)]

  return (
    <div className="space-y-1.5 mt-2" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={5} aria-label="Password strength">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: level.width }}
          transition={{ duration: 300, ease: "easeOut" }}
          className={`h-full rounded-full transition-colors ${level.color}`}
        />
      </div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{level.label}</p>
    </div>
  )
}