"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, ChevronLeft, Search, CalendarDays, ClipboardList, Bookmark, Bell, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "ChayanJobs_welcomed"

const steps = [
 {
  id: "search",
  title: "Discover Opportunities",
  description: "Search thousands of government & private jobs with smart filters - by qualification, location, category, and more.",
  icon: Search,
  illustration: (
   <div className="relative w-full max-w-xs mx-auto">
    <div className="relative bg-paper-2  p-6 border border-rule">
     <div className="relative">
      <div className="flex items-center gap-2 mb-4">
       <div className="w-3 h-3  bg-paper-2" />
       <div className="w-3 h-3  bg-paper-2" />
       <div className="w-3 h-3  bg-paper-3" />
      </div>
      <div className="space-y-3">
       <div className="h-10 bg-paper-3  flex items-center px-4 text-brick font-mono text-sm">
        <Search className="h-4 w-4 mr-2" /> Search jobs, exams, results...
       </div>
       <div className="grid grid-cols-2 gap-2">
        <div className="h-20 bg-paper-3  border border-rule flex flex-col items-center justify-center p-3">
         <span className="text-xs text-brick font-medium">Qualification</span>
         <span className="text-xs text-brick">B.Tech, 12th, Grad...</span>
        </div>
        <div className="h-20 bg-paper-3  border border-rule flex flex-col items-center justify-center p-3">
         <span className="text-xs text-foreground font-medium">Location</span>
         <span className="text-xs text-foreground">Delhi, Mumbai...</span>
        </div>
        <div className="h-20 bg-paper-2  border border-rule flex flex-col items-center justify-center p-3">
         <span className="text-xs text-brick font-medium">Category</span>
         <span className="text-xs text-brick">Engineering, Admin...</span>
        </div>
        <div className="h-20 bg-paper-3  border border-rule flex flex-col items-center justify-center p-3">
         <span className="text-xs text-brick font-medium">Department</span>
         <span className="text-xs text-brick">UPSC, SSC, Railway...</span>
        </div>
       </div>
      </div>
     </div>
    </div>
    
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
     <div className="bg-paper-2  p-4 border border-rule flex items-center gap-4">
      <div className="w-12 h-12  bg-paper-3 flex items-center justify-center">
       <CalendarDays className="h-6 w-6 text-brick" />
      </div>
      <div>
       <p className="font-medium text-foreground">Exam Calendar</p>
       <p className="text-sm text-muted-foreground">UPSC, SSC, Banking, State PSCs - all dates</p>
      </div>
      <Sparkles className="h-5 w-5 text-brick" />
     </div>
     <div className="bg-paper-2  p-4 border border-rule flex items-center gap-4">
      <div className="w-12 h-12  bg-paper-3 flex items-center justify-center">
       <ClipboardList className="h-6 w-6 text-foreground" />
      </div>
      <div>
       <p className="font-medium text-foreground">My Applications</p>
       <p className="text-sm text-muted-foreground">Track status: Applied → Admit Card → Result</p>
      </div>
      <Sparkles className="h-5 w-5 text-brick" />
     </div>
     <div className="bg-paper-2  p-4 border border-rule flex items-center gap-4">
      <div className="w-12 h-12  bg-paper-2 flex items-center justify-center">
       <Bookmark className="h-6 w-6 text-brick" />
      </div>
      <div>
       <p className="font-medium text-foreground">Bookmarks</p>
       <p className="text-sm text-muted-foreground">Save jobs & exams for quick access</p>
      </div>
      <Sparkles className="h-5 w-5 text-brick" />
     </div>
    </div>
    
   </div>
  ),
 },
 {
  id: "alerts",
  title: "Get Instant Alerts",
  description: "Real-time notifications for new jobs matching your profile, admit card releases, and result declarations - via email & push.",
  icon: Bell,
  illustration: (
   <div className="relative w-full max-w-xs mx-auto">
    <div className="space-y-3">
     <div className="bg-paper-2  p-4 border border-rule flex items-start gap-3">
      <div className="w-10 h-10  bg-paper-3 flex items-center justify-center flex-shrink-0 mt-0.5">
       <span className="text-brick font-bold text-sm">1</span>
      </div>
      <div className="flex-1">
       <p className="font-medium text-foreground">Set Your Preferences</p>
       <p className="text-sm text-muted-foreground">Qualification, location, categories, frequency</p>
      </div>
     </div>
     <div className="bg-paper-2  p-4 border border-rule flex items-start gap-3">
      <div className="w-10 h-10  bg-paper-3 flex items-center justify-center flex-shrink-0 mt-0.5">
       <span className="text-brick font-bold text-sm">2</span>
      </div>
      <div className="flex-1">
       <p className="font-medium text-foreground">We Monitor 24/7</p>
       <p className="text-sm text-muted-foreground">Official sources checked every hour</p>
      </div>
     </div>
     <div className="bg-paper-2  p-4 border border-rule flex items-start gap-3">
      <div className="w-10 h-10  bg-paper-3 flex items-center justify-center flex-shrink-0 mt-0.5">
       <span className="text-foreground font-bold text-sm">3</span>
      </div>
      <div className="flex-1">
       <p className="font-medium text-foreground">Instant Delivery</p>
       <p className="text-sm text-muted-foreground">Email + Push notification the moment it's live</p>
      </div>
     </div>
    </div>
    
   </div>
  ),
  isLast: true,
 },
]

/**
 * @deprecated Replaced by intelligent spotlight tour
 * (`src/components/onboarding/SpotlightTour.tsx`) which points arrows at the
 * real SearchBar / QuickLinks / Qualification / Exam Calendar buttons.
 * Kept for reference only - not mounted in `src/app/layout.tsx` anymore.
 */
export function WelcomeOnboarding() {
 const [isOpen, setIsOpen] = useState(false)
 const [currentStep, setCurrentStep] = useState(0)
 const [mounted, setMounted] = useState(false)

 useEffect(() => {
  setMounted(true)
  // Never compete with the new spotlight tour: if the new tour hasn't been
  // seen yet (or ?tour=1 replay requested), stay hidden.
  try {
   const params = new URLSearchParams(window.location.search)
   if (params.get("tour") === "1") return
   if (!localStorage.getItem("ChayanJobs_tour_v2_home_seen") && window.location.pathname === "/") return
   if (!localStorage.getItem("ChayanJobs_tour_v2_calendar_seen") && window.location.pathname.startsWith("/exam-calendar")) return
  } catch {
   // ignore and fall through to legacy behaviour
  }
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
    className="absolute inset-0 bg-ink/60"
    onClick={close}
   />

   {/* Modal - rendered second so it's on top of backdrop */}
   <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 20 }}
    className="bg-background text-foreground border border-rule w-full max-w-2xl overflow-hidden relative z-10"
   >
    <div className="absolute top-4 right-4">
     <button
      onClick={close}
      className="w-10 h-10  hover:bg-paper-2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
       <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center bg-ink text-paper">
        <Icon className="h-8 w-8 text-paper" />
       </div>
       <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{step.title}</h2>
       <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto mb-8 leading-relaxed">{step.description}</p>

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
           "h-2  transition-all",
           i === currentStep ? "bg-brick" : "bg-paper-3"
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
          step.isLast && "bg-ink text-paper hover:bg-ink-2"
         )}
        >
         {step.isLast ? "Get Started" : "Next"}
         <ChevronRight className="h-5 w-5" />
        </Button>
       </div>
      </motion.div>
     </AnimatePresence>

     <p className="mt-6 text-center text-xs text-muted-foreground">
      Don&apos;t show this again - we&apos;ll remember your choice
     </p>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brick" />
   </motion.div>
  </motion.div>
 )
}