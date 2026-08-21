"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, ChevronLeft, Search, CalendarDays, ClipboardList, Bookmark, Bell, Sparkles, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const STORAGE_KEY = "chayan_welcomed"

const steps = [
  {
    id: "search",
    title: "Discover Opportunities",
    description: "Search thousands of government & private jobs with smart filters — by qualification, location, category, and more.",
    icon: Search,
    illustration: (
      <div className="relative w-full max-w-xs mx-auto">
        <div className="relative bg-white/10 dark:bg-white/5 rounded-2xl p-6 border border-white/20 dark:border-white/10">
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="space-y-3">
              <div className="h-10 bg-teal-500/20 rounded-xl flex items-center px-4 text-teal-400 font-mono text-sm">
                <Search className="h-4 w-4 mr-2" /> Search jobs, exams, results...
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-20 bg-blue-500/10 rounded-lg border border-blue-500/20 flex flex-col items-center justify-center p-3">
                  <span className="text-xs text-blue-400 font-medium">Qualification</span>
                  <span className="text-xs text-blue-300">B.Tech, 12th, Grad...</span>
                </div>
                <div className="h-20 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex flex-col items-center justify-center p-3">
                  <span className="text-xs text-emerald-400 font-medium">Location</span>
                  <span className="text-xs text-emerald-300">Delhi, Mumbai...</span>
                </div>
                <div className="h-20 bg-amber-500/10 rounded-lg border border-amber-500/20 flex flex-col items-center justify-center p-3">
                  <span className="text-xs text-amber-400 font-medium">Category</span>
                  <span className="text-xs text-amber-300">Engineering, Admin...</span>
                </div>
                <div className="h-20 bg-purple-500/10 rounded-lg border border-purple-500/20 flex flex-col items-center justify-center p-3">
                  <span className="text-xs text-purple-400 font-medium">Department</span>
                  <span className="text-xs text-purple-300">UPSC, SSC, Railway...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-teal-500/30 rounded-full blur-2xl animate-pulse" />
      </div>
    ),
  },
  {
    id: "track",
    title: "Track Everything in One Place",
    description: "Never miss a deadline. Your personal dashboard keeps exams, applications, and bookmarks organized automatically.",
    icon: CalendarDays,
    illustration: (
      <div className="relative w-full max-w-xs mx-auto">
        <div className="space-y-3">
          <div className="bg-white/10 dark:bg-white/5 rounded-xl p-4 border border-white/20 dark:border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-white">Exam Calendar</p>
              <p className="text-sm text-gray-400">UPSC, SSC, Banking, State PSCs — all dates</p>
            </div>
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <div className="bg-white/10 dark:bg-white/5 rounded-xl p-4 border border-white/20 dark:border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-white">My Applications</p>
              <p className="text-sm text-gray-400">Track status: Applied → Admit Card → Result</p>
            </div>
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <div className="bg-white/10 dark:bg-white/5 rounded-xl p-4 border border-white/20 dark:border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Bookmark className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-white">Bookmarks</p>
              <p className="text-sm text-gray-400">Save jobs & exams for quick access</p>
            </div>
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
        </div>
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-emerald-500/30 rounded-full blur-2xl animate-pulse" />
      </div>
    ),
  },
  {
    id: "alerts",
    title: "Get Instant Alerts",
    description: "Real-time notifications for new jobs matching your profile, admit card releases, and result declarations — via email & push.",
    icon: Bell,
    illustration: (
      <div className="relative w-full max-w-xs mx-auto">
        <div className="space-y-3">
          <div className="bg-white/10 dark:bg-white/5 rounded-xl p-4 border border-white/20 dark:border-white/10 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-teal-400 font-bold text-sm">1</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Set Your Preferences</p>
              <p className="text-sm text-gray-400">Qualification, location, categories, frequency</p>
            </div>
          </div>
          <div className="bg-white/10 dark:bg-white/5 rounded-xl p-4 border border-white/20 dark:border-white/10 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 font-bold text-sm">2</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">We Monitor 24/7</p>
              <p className="text-sm text-gray-400">Official sources checked every hour</p>
            </div>
          </div>
          <div className="bg-white/10 dark:bg-white/5 rounded-xl p-4 border border-white/20 dark:border-white/10 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-emerald-400 font-bold text-sm">3</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Instant Delivery</p>
              <p className="text-sm text-gray-400">Email + Push notification the moment it's live</p>
            </div>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/30 rounded-full blur-2xl animate-pulse" />
      </div>
    ),
    isLast: true,
  },
]

export function WelcomeOnboarding() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const welcomed = localStorage.getItem(STORAGE_KEY)
    if (!welcomed) {
      const timer = setTimeout(() => setIsOpen(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const close = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true")
    setIsOpen(false)
  }, [])

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((c) => c + 1)
    } else {
      close()
      window.location.href = "/register"
    }
  }, [currentStep, close])

  const prev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((c) => c - 1)
    }
  }, [])

  if (!mounted || !isOpen) return null

  const step = steps[currentStep]
  const Icon = step.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop - rendered first so it's behind the modal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal - rendered second so it's on top of backdrop */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-gray-950 dark:bg-gray-950 rounded-3xl border border-white/10 dark:border-white/10 shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={close}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            aria-label="Close onboarding"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center"
            >
              <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
                <Icon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{step.title}</h2>
              <p className="text-gray-300 text-lg md:text-xl max-w-lg mx-auto mb-8 leading-relaxed">{step.description}</p>

              <div className="relative mb-8 min-h-[280px] flex items-center justify-center">
                {step.illustration}
              </div>

              <div className="flex items-center justify-center gap-2 mb-6">
                {steps.map((_, i) => (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={{ width: i === currentStep ? 24 : 8 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      i === currentStep ? "bg-teal-400" : "bg-white/20"
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center justify-center gap-4">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={prev}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Back
                  </Button>
                )}
                <Button
                  size="lg"
                  onClick={next}
                  className={cn(
                    "gap-2 px-8",
                    step.isLast && "bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
                  )}
                >
                  {step.isLast ? "Get Started" : "Next"}
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>

          <p className="mt-6 text-center text-xs text-gray-500">
            Don&apos;t show this again — we&apos;ll remember your choice
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500" />
      </motion.div>
    </motion.div>
  )
}