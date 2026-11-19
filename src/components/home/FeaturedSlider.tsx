"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { FeaturedSlideView, type FeaturedSlideItem } from "@/components/featured/FeaturedSlideView"
import { useDataVersion, withDataVersion } from "@/components/providers/DataVersion"

export function FeaturedSlider() {
 const dataVersion = useDataVersion()
 const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" })
 const [items, setItems] = useState<FeaturedSlideItem[]>([])
 const [selected, setSelected] = useState(0)
 const [isPaused, setIsPaused] = useState(false)
 const [loading, setLoading] = useState(true)
 const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

 useEffect(() => {
  fetch(withDataVersion("/api/featured", dataVersion))
   .then((r) => r.json())
   .then((d) => setItems(d.success ? d.data : []))
   .catch(() => setItems([]))
   .finally(() => setLoading(false))
 }, [dataVersion])

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
  return <div className="h-[420px] animate-pulse bg-paper-3 sm:h-[460px]" />
 }
 if (items.length === 0) return null

 return (
  <section
   className="relative w-full max-w-[100vw] overflow-hidden bg-ink"
   onMouseEnter={() => setIsPaused(true)}
   onMouseLeave={() => setIsPaused(false)}
  >

   <div ref={emblaRef} className="relative z-10 overflow-hidden">
    <div className="flex">
     {items.map((item) => (
      <div key={item.id} className="relative min-w-0 shrink-0 grow-0 basis-full">
       <FeaturedSlideView item={item} />
      </div>
     ))}
    </div>
   </div>

   <div className="relative z-20 mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between px-4 pb-5 sm:px-6 lg:px-8">
    <button
     onClick={() => emblaApi?.scrollPrev()}
     className="border border-paper/25 bg-transparent p-2 text-paper/70 transition-colors hover:border-paper/60 hover:text-paper"
     aria-label="Previous slide"
    >
     <ChevronLeft className="h-4 w-4" />
    </button>

    <div className="flex items-center gap-2">
     <button
      onClick={() => setIsPaused((p) => !p)}
      className="border border-paper/25 bg-transparent p-1.5 text-paper/60 transition-colors hover:border-paper/60 hover:text-paper"
      aria-label={isPaused ? "Play" : "Pause"}
     >
      {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
     </button>
     {items.map((item, i) => (
      <button
       key={item.id}
       onClick={() => emblaApi?.scrollTo(i)}
       className={cn(
        "h-1.5 transition-colors duration-200",
        i === selected ? "w-7 bg-brick" : "w-3 bg-paper/30 hover:bg-paper/60"
       )}
       aria-label={`Go to slide ${i + 1}`}
      />
     ))}
    </div>

    <button
     onClick={() => emblaApi?.scrollNext()}
     className="border border-paper/25 bg-transparent p-2 text-paper/70 transition-colors hover:border-paper/60 hover:text-paper"
     aria-label="Next slide"
    >
     <ChevronRight className="h-4 w-4" />
    </button>
   </div>
  </section>
 )
}