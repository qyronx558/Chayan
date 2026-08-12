"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { FeaturedSlideView, type FeaturedSlideItem } from "@/components/featured/FeaturedSlideView"

export function FeaturedSlider() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" })
  const [items, setItems] = useState<FeaturedSlideItem[]>([])
  const [selected, setSelected] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    fetch("/api/featured")
      .then((r) => r.json())
      .then((d) => setItems(d.success ? d.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on("select", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi])

  const autoplay = useCallback(() => {
    if (!emblaApi) return
    emblaApi.scrollNext()
  }, [emblaApi])

  useEffect(() => {
    if (isPaused || items.length < 2) return
    intervalRef.current = setInterval(autoplay, 5000)
    return () => clearInterval(intervalRef.current)
  }, [isPaused, autoplay, items.length])

  if (loading) {
    return <div className="h-[420px] animate-pulse bg-[#0a1628] sm:h-[460px]" />
  }
  if (items.length === 0) return null

  return (
    <section
      className="relative overflow-hidden bg-[#0a1628]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.18)_0%,_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(251,191,36,0.12)_0%,_transparent_50%)]" />

      <div ref={emblaRef} className="relative z-10 overflow-hidden">
        <div className="flex">
          {items.map((item) => (
            <div key={item.id} className="relative min-w-0 shrink-0 grow-0 basis-full">
              <FeaturedSlideView item={item} />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 pb-5 sm:px-6 lg:px-8">
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="rounded-full border border-white/15 bg-white/5 p-2 text-white/70 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="rounded-full border border-white/15 bg-white/5 p-1.5 text-white/50 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white"
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === selected ? "h-2 w-6 bg-amber-400" : "h-2 w-2 bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => emblaApi?.scrollNext()}
          className="rounded-full border border-white/15 bg-white/5 p-2 text-white/70 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}