"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, ChevronLeft, MapPin, CalendarDays, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const HOME_SEEN_KEY = "ChayanJobs_tour_v2_home_seen"
const CAL_SEEN_KEY = "ChayanJobs_tour_v2_calendar_seen"
const LEGACY_KEY = "ChayanJobs_welcomed"

type TourAction = "next" | "goto-calendar" | "finish"

interface TourStep {
  id: string
  title: string
  description: string
  cta: string
  action: TourAction
  /** Fallback selector if primary data-tour anchor is missing */
  fallbackSelector?: string
}

const HOME_STEPS: TourStep[] = [
  {
    id: "search-input",
    title: "Search jobs, exams, results…",
    description: "Type UPSC, SSC, 12th pass, Railway… live matches appear as you type. Press Enter for full results.",
    cta: "Next",
    action: "next",
  },
  {
    id: "trending-searches",
    title: "Popular right now",
    description: "One-tap searches other aspirants use. Try one to see how fast discovery is.",
    cta: "Next",
    action: "next",
    fallbackSelector: '[data-tour="search-input"]',
  },
  {
    id: "quicklink-jobs",
    title: "Jump to any section",
    description: "Active Jobs, Admit Cards, Results, Answer Keys, Syllabus - everything is one tap away.",
    cta: "Next",
    action: "next",
    fallbackSelector: '[data-tour="quicklinks"]',
  },
  {
    id: "qualification-pills",
    title: "Filter by your qualification",
    description: "Tap 10th, 12th, B.Tech, Graduate… the list instantly shows only jobs you can apply for.",
    cta: "Next",
    action: "next",
  },
  {
    id: "deadlines-teaser",
    title: "Never miss a deadline",
    description: "Last dates, exam dates, admit cards and results coming up next. Open the full calendar to explore.",
    cta: "Open exam calendar",
    action: "goto-calendar",
    fallbackSelector: '[data-tour="quicklinks"]',
  },
]

const CALENDAR_STEPS: TourStep[] = [
  {
    id: "cal-month-nav",
    title: "Move across months",
    description: "Go prev / next, jump to any month, or tap Today to come back to this month instantly.",
    cta: "Next",
    action: "next",
  },
  {
    id: "cal-search",
    title: "Search this month",
    description: "Type an exam or department - e.g. SSC, UPSC, Railway - to filter the month view.",
    cta: "Next",
    action: "next",
    fallbackSelector: '[data-tour="cal-month-nav"]',
  },
  {
    id: "cal-filters",
    title: "Filter by type",
    description: "Last Date (red), Exam (blue), Admit Card (amber), Result (green). Counts update live.",
    cta: "Next",
    action: "next",
    fallbackSelector: '[data-tour="cal-month-nav"]',
  },
  {
    id: "cal-day",
    title: "Tap any highlighted day",
    description: "Dots and pills show what's scheduled. Tapping a day highlights it and scrolls the schedule below.",
    cta: "Next",
    action: "next",
    fallbackSelector: '[data-tour="cal-grid"]',
  },
  {
    id: "cal-agenda",
    title: "Your day-wise schedule",
    description: "Every event with Today / Tomorrow / In X days badges. Tap any card to open details and apply.",
    cta: "Done",
    action: "finish",
    fallbackSelector: '[data-tour="cal-grid"]',
  },
]

function getStepsForPath(pathname: string): TourStep[] {
  if (pathname.startsWith("/exam-calendar")) return CALENDAR_STEPS
  if (pathname === "/") return HOME_STEPS
  return []
}

function getSeenKey(pathname: string): string | null {
  if (pathname.startsWith("/exam-calendar")) return CAL_SEEN_KEY
  if (pathname === "/") return HOME_SEEN_KEY
  return null
}

function track(event: string, params?: Record<string, string | number>) {
  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void }
    w.gtag?.("event", event, params ?? {})
  } catch {
    // analytics is best-effort
  }
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

export function SpotlightTour() {
  const pathname = usePathname()
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [active, setActive] = useState(false)
  const [rect, setRect] = useState<Rect | null>(null)
  const [tooltipBelow, setTooltipBelow] = useState(true)
  const retryRef = useRef(0)
  const activeRef = useRef(false)
  const stepIndexRef = useRef(0)

  const steps = getStepsForPath(pathname ?? "/")

  const measure = useCallback((step: TourStep) => {
    const el =
      (document.querySelector(`[data-tour="${step.id}"]`) as HTMLElement | null) ??
      (step.fallbackSelector ? (document.querySelector(step.fallbackSelector) as HTMLElement | null) : null)
    if (!el) return null
    // If element is inside a hidden/empty section, treat as missing
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return null
    return { el, rect: { top: r.top, left: r.left, width: r.width, height: r.height } as Rect }
  }, [])

  const positionRef = useRef<(idx: number, attempt?: number) => void>(() => {})

  const positionToStep = useCallback(
    (idx: number, attempt = 0) => {
      positionRef.current(idx, attempt)
    },
    []
  )

  // Stable implementation stored in ref to allow self-retry without lint cycle
  positionRef.current = (idx: number, attempt = 0) => {
      const stepList = getStepsForPath(window.location.pathname)
      const step = stepList[idx]
      if (!step) {
        setActive(false)
        activeRef.current = false
        return
      }
      const found = measure(step)
      if (!found) {
        // Retry briefly for async content (UpcomingDeadlines fetch, calendar loading)
        if (attempt < 12) {
          window.setTimeout(() => {
            if (activeRef.current && stepIndexRef.current === idx) positionRef.current(idx, attempt + 1)
          }, 350)
        } else if (step.fallbackSelector) {
          // Skip to next step if even fallback missing
          if (idx < stepList.length - 1) {
            stepIndexRef.current = idx + 1
            setStepIndex(idx + 1)
            positionRef.current(idx + 1)
          } else {
            setActive(false)
            activeRef.current = false
          }
        } else {
          // No fallback: skip forward
          if (idx < stepList.length - 1) {
            stepIndexRef.current = idx + 1
            setStepIndex(idx + 1)
            positionRef.current(idx + 1)
          } else {
            setActive(false)
            activeRef.current = false
          }
        }
        return
      }
      found.el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })
      // Measure again after scroll settles
      window.setTimeout(() => {
        const fresh = measure(step)
        if (!fresh) return
        const r = fresh.rect
        setRect(r)
        const spaceBelow = window.innerHeight - (r.top + r.height)
        setTooltipBelow(spaceBelow > 260 || r.top < 180)
      }, 450)
  }

  const start = useCallback(
    (idx = 0) => {
      retryRef.current = 0
      stepIndexRef.current = idx
      setStepIndex(idx)
      setActive(true)
      activeRef.current = true
      track("tour_started", { route: window.location.pathname })
      window.setTimeout(() => positionToStep(idx), 100)
    },
    [positionToStep]
  )

  const close = useCallback(
    (persist = true) => {
      if (persist) {
        const key = getSeenKey(window.location.pathname)
        if (key) {
          try {
            localStorage.setItem(key, "true")
          } catch {
            // ignore
          }
        }
        // Also mark legacy modal so old WelcomeOnboarding never pops over the tour
        try {
          localStorage.setItem(LEGACY_KEY, "true")
        } catch {
          // ignore
        }
      }
      setActive(false)
      activeRef.current = false
      track("tour_skipped", { route: window.location.pathname, step: stepIndexRef.current })
    },
    []
  )

  const finish = useCallback(() => {
    const key = getSeenKey(window.location.pathname)
    if (key) {
      try {
        localStorage.setItem(key, "true")
      } catch {
        // ignore
      }
    }
    try {
      localStorage.setItem(LEGACY_KEY, "true")
    } catch {
      // ignore
    }
    setActive(false)
    activeRef.current = false
    track("tour_completed", { route: window.location.pathname })
  }, [])

  const goNext = useCallback(() => {
    const stepList = getStepsForPath(window.location.pathname)
    const step = stepList[stepIndexRef.current]
    track("tour_step_view", { route: window.location.pathname, step: stepIndexRef.current, id: step?.id ?? "" })
    if (!step) {
      finish()
      return
    }
    if (step.action === "goto-calendar") {
      finish()
      router.push("/exam-calendar?tour=1")
      return
    }
    if (step.action === "finish" || stepIndexRef.current >= stepList.length - 1) {
      finish()
      return
    }
    const next = stepIndexRef.current + 1
    stepIndexRef.current = next
    setStepIndex(next)
    positionToStep(next)
  }, [finish, positionToStep, router])

  const goBack = useCallback(() => {
    const prev = Math.max(0, stepIndexRef.current - 1)
    stepIndexRef.current = prev
    setStepIndex(prev)
    positionToStep(prev)
  }, [positionToStep])

  // Auto-start + ?tour=1 replay + route change handling
  useEffect(() => {
    const path = pathname ?? "/"
    const list = getStepsForPath(path)
    if (list.length === 0) {
      setActive(false)
      activeRef.current = false
      return
    }
    // Reset per route
    stepIndexRef.current = 0
    setStepIndex(0)
    setRect(null)
    setActive(false)
    activeRef.current = false

    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get("tour") === "1") {
        // Consume param so back-button doesn't relaunch, then start
        params.delete("tour")
        const clean = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`
        window.history.replaceState(null, "", clean)
        timer = setTimeout(() => start(0), 600)
        return () => {
          if (timer) clearTimeout(timer)
        }
      }
      const key = getSeenKey(path)
      const seen = key ? localStorage.getItem(key) : "true"
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (!seen) {
        timer = setTimeout(() => start(0), reduceMotion ? 400 : 1400)
      }
    } catch {
      // private mode etc - don't tour
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [pathname, start])

  // Keep highlight glued on scroll/resize
  useEffect(() => {
    if (!active) return
    const onReposition = () => {
      const stepList = getStepsForPath(window.location.pathname)
      const step = stepList[stepIndexRef.current]
      if (!step) return
      const found = measure(step)
      if (found) {
        setRect(found.rect)
        const spaceBelow = window.innerHeight - (found.rect.top + found.rect.height)
        setTooltipBelow(spaceBelow > 260 || found.rect.top < 180)
      }
    }
    window.addEventListener("resize", onReposition, { passive: true })
    window.addEventListener("scroll", onReposition, { passive: true })
    return () => {
      window.removeEventListener("resize", onReposition)
      window.removeEventListener("scroll", onReposition)
    }
  }, [active, measure])

  // Keyboard: Esc closes, arrows navigate
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true)
      else if (e.key === "ArrowRight") goNext()
      else if (e.key === "ArrowLeft") goBack()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active, close, goNext, goBack])

  // Global replay event from footer ("Take a quick tour")
  useEffect(() => {
    const onReplay = () => start(0)
    window.addEventListener("ChayanJobs:replay-tour", onReplay)
    return () => window.removeEventListener("ChayanJobs:replay-tour", onReplay)
  }, [start])

  if (!active || steps.length === 0) return null
  const step = steps[stepIndex]
  if (!step) return null

  const pad = 8
  const hl = rect
    ? {
        top: Math.max(8, rect.top - pad),
        left: Math.max(8, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null

  // Tooltip placement: below target by default, above if no room, fixed bottom on small screens
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-live="polite" aria-label={`Guided tour: ${step.title}`}>
      {/* Dim layer - click does nothing (must use Skip) to avoid accidental loss */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Spotlight cutout */}
      {hl && (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="absolute rounded-2xl ring-4 ring-teal-400"
          style={{
            top: hl.top,
            left: hl.left,
            width: Math.min(hl.width, typeof window !== "undefined" ? window.innerWidth - 16 : hl.width),
            height: hl.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.60), 0 0 40px rgba(45,212,191,0.45)",
          }}
        >
          {/* Pulsing arrow marker */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full">
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-teal-400 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-teal-950 shadow-lg">
                Look here
              </span>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-teal-400"
                aria-hidden="true"
              />
            </div>
          </div>
          <span className="absolute inset-0 animate-pulse rounded-2xl border-2 border-teal-300/60" aria-hidden="true" />
        </motion.div>
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${step.id}-${tooltipBelow ? "b" : "a"}`}
          initial={{ opacity: 0, y: tooltipBelow ? 16 : -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: tooltipBelow ? 8 : -8 }}
          transition={{ duration: 0.22 }}
          className={cn(
            "absolute left-1/2 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-950",
            isMobile || !hl
              ? "bottom-4 top-auto"
              : tooltipBelow
                ? ""
                : ""
          )}
          style={
            hl && !isMobile
              ? tooltipBelow
                ? { top: Math.min(window.innerHeight - 240, hl.top + hl.height + 20), left: "50%" }
                : { top: Math.max(12, hl.top - 230), left: "50%" }
              : undefined
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-white">
                {step.id.startsWith("cal-") || step.id === "deadlines-teaser" ? (
                  <CalendarDays className="h-5 w-5" />
                ) : (
                  <MapPin className="h-5 w-5" />
                )}
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                Step {stepIndex + 1} of {steps.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => close(true)}
              aria-label="Skip tour"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h2 className="mt-3 text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">{step.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{step.description}</p>

          {/* Progress dots */}
          <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === stepIndex ? "w-6 bg-teal-500" : i < stepIndex ? "w-3 bg-teal-300" : "w-3 bg-gray-200 dark:bg-gray-700"
                )}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            {stepIndex > 0 && (
              <Button variant="outline" size="sm" onClick={goBack} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={goNext} className="flex-1 gap-1 bg-teal-600 hover:bg-teal-700">
              {step.cta}
              <ChevronRight className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={() => close(true)}
              className="px-2 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Skip
            </button>
          </div>

          <p className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
            <span>Tip: use ← → keys, Esc to skip</span>
            <button
              type="button"
              onClick={() => {
                try {
                  const params = new URLSearchParams(window.location.search)
                  params.set("tour", "1")
                  window.location.href = `/exam-calendar?${params.toString()}`
                } catch {
                  router.push("/exam-calendar?tour=1")
                }
              }}
              className="hidden font-semibold text-teal-700 hover:underline dark:text-teal-300"
            >
              Jump to calendar
            </button>
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Replay hint for returning users */}
      <button
        type="button"
        onClick={() => start(0)}
        className="absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/20 sm:inline-flex"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Restart tour
      </button>
    </div>
  )
}
