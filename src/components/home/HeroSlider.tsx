"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Briefcase, FileText, Award, TrendingUp, Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"

const slides = [
 { src: "/11.jpg" },
 { src: "/12.jpg" },
 { src: "/13.jpg" },
 { src: "/14.jpg" },
 { src: "/15.webp" },
 { src: "/16.jpg" },
 { src: "/17.webp" },
 { src: "/18.avif" },
]

interface CounterProps {
 end: number
 suffix?: string
 label: string
 icon: React.ReactNode
 delay?: number
}

function CountUp({ end, suffix = "", label, icon, delay = 0 }: CounterProps) {
 const ref = useRef<HTMLDivElement>(null)
 const [count, setCount] = useState(0)
 const [hasStarted, setHasStarted] = useState(false)

 useEffect(() => {
  const el = ref.current
  if (!el || hasStarted) return
  const observer = new IntersectionObserver(([entry]) => {
   if (entry.isIntersecting) { setHasStarted(true); observer.disconnect() }
  }, { threshold: 0.3 })
  setTimeout(() => observer.observe(el), delay)
  return () => observer.disconnect()
 }, [hasStarted, delay])

 useEffect(() => {
  if (!hasStarted) return
  let startTime: number | null = null
  const step = (ts: number) => {
   if (!startTime) startTime = ts
   const progress = Math.min((ts - startTime) / 2200, 1)
   const eased = 1 - Math.pow(1 - progress, 3)
   setCount(Math.floor(eased * end))
   if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
 }, [hasStarted, end])

 return (
  <div ref={ref} className="flex flex-col items-center gap-1.5">
   <div className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/10 border border-paper/15">
    {icon}
   </div>
   <span className="text-xl font-bold text-paper tabular-nums sm:text-2xl">{count.toLocaleString()}{suffix}</span>
   <span className="text-[11px] text-paper/50 ">{label}</span>
  </div>
 )
}

export function HeroSlider() {
 const [current, setCurrent] = useState(0)
 const [isPaused, setIsPaused] = useState(false)
 const [stats, setStats] = useState<{ end: number; suffix: string; label: string; icon: React.ReactNode }[] | null>(null)
 const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

 useEffect(() => {
  fetch("/api/stats")
   .then(r => r.json())
   .then(d => {
    if (d.success) {
     setStats([
      { end: d.data.totalJobs || 0, suffix: "+", label: "Active Jobs", icon: <Briefcase className="h-4 w-4 text-paper" /> },
      { end: d.data.activeJobs || 0, suffix: "+", label: "Notifications", icon: <FileText className="h-4 w-4 text-paper" /> },
      { end: d.data.totalResults || 0, suffix: "+", label: "Results", icon: <Award className="h-4 w-4 text-paper" /> },
      { end: d.data.totalAdmitCards || 0, suffix: "+", label: "Admit Cards", icon: <TrendingUp className="h-4 w-4 text-paper" /> },
     ])
    }
   })
   .catch(() => {})
 }, [])

 const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [])
 const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [])

 useEffect(() => {
  if (isPaused) { if (intervalRef.current) clearInterval(intervalRef.current); return }
  intervalRef.current = setInterval(next, 5000)
  return () => clearInterval(intervalRef.current)
 }, [isPaused, next])

 return (
  <section className="relative h-[500px] overflow-hidden sm:h-[540px] lg:h-[580px]">
   {slides.map((slide, i) => (
    <div
     key={i}
     className={cn(
      "absolute inset-0 transition-opacity duration-1000",
      i === current ? "opacity-100" : "opacity-0"
     )}
    >
     <Image
      src={slide.src}
      alt={`Slide ${i + 1}`}
      fill
      className="object-cover"
      priority={i === 0}
      sizes="100vw"
      quality={100}
     />
    </div>
   ))}

   <div className="absolute inset-0 bg-ink/70" />

   <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
    <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-paper sm:text-4xl lg:text-5xl">
     Your Gateway to
     <br />
     <span className="text-brick">Career Opportunities</span>
    </h1>
    <div className="grid grid-cols-2 gap-8 sm:gap-12 sm:grid-cols-4">
     {stats ? stats.map((s, i) => <CountUp key={s.label} {...s} delay={i * 100} />) : (
      <>
       {[{ end: 0, label: "Active Jobs" }, { end: 0, label: "Notifications" }, { end: 0, label: "Results" }, { end: 0, label: "Admit Cards" }].map(s => (
        <div key={s.label} className="flex flex-col items-center gap-1.5">
         <div className="h-9 w-9 rounded-full bg-paper/10" />
         <div className="h-6 w-16 animate-pulse rounded bg-paper/10" />
         <div className="h-3 w-20 animate-pulse rounded bg-paper/10" />
        </div>
       ))}
      </>
     )}
    </div>
   </div>

   <button
    onClick={prev}
    className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-ink/40 p-1.5 text-paper/70 transition-colors hover:bg-ink/70 hover:text-paper border border-paper/15"
    aria-label="Previous slide"
   >
    <ChevronLeft className="h-4 w-4" />
   </button>
   <button
    onClick={next}
    className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-ink/40 p-1.5 text-paper/70 transition-colors hover:bg-ink/70 hover:text-paper border border-paper/15"
    aria-label="Next slide"
   >
    <ChevronRight className="h-4 w-4" />
   </button>

   <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
    <button
     onClick={() => setIsPaused(p => !p)}
     className="rounded-full bg-ink/40 p-1 text-paper/60 transition-colors hover:bg-ink/70 hover:text-paper border border-paper/15"
     aria-label={isPaused ? "Play" : "Pause"}
    >
     {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
    </button>
    <div className="flex items-center gap-1.5">
     {slides.map((_, i) => (
      <button
       key={i}
       onClick={() => setCurrent(i)}
       className={cn(
        "rounded-full transition-all duration-300",
        i === current ? "h-2 w-6 bg-brick" : "h-2 w-2 bg-paper/30 hover:bg-paper/60"
       )}
       aria-label={`Go to slide ${i + 1}`}
      />
     ))}
    </div>
   </div>
  </section>
 )
}
