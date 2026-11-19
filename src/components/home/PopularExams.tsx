"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"
import { useDataVersion, withDataVersion } from "@/components/providers/DataVersion"

/*
 * Popular exams on a coaching-centre blackboard: green slate in a wooden
 * frame, everything written in chalk, the top three underlined by the
 * teacher, a chalk stick and duster resting on the ledge.
 */
const CHALK = "oklch(96% 0.01 100 / .92)"
const CHALK_DIM = "oklch(96% 0.01 100 / .55)"
const CHALK_YELLOW = "oklch(88% 0.12 92)"

interface ExamItem {
 id: string
 name: string
 slug: string
 description?: string | null
 categoryId: string
 category: { id: string; name: string; slug: string }
}

interface CategoryItem {
 id: string
 name: string
 slug: string
 description?: string | null
 _count: { job: number }
}

type DisplayItem =
 | { kind: "exam"; exam: ExamItem }
 | { kind: "category"; category: CategoryItem }

export function PopularExams({ className }: { className?: string }) {
 const dataVersion = useDataVersion()
 const [items, setItems] = useState<DisplayItem[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState("")

 useEffect(() => {
  async function fetchData() {
   try {
    setLoading(true)
    setError("")

    const examRes = await fetch(withDataVersion("/api/exams?sort=trending", dataVersion))
    const examJson = await examRes.json()

    if (examJson.success && examJson.data.length > 0) {
     setItems(examJson.data.map((e: ExamItem) => ({ kind: "exam" as const, exam: e })))
     return
    }

    const catRes = await fetch("/api/categories")
    const catJson = await catRes.json()
    if (!catJson.success) throw new Error(catJson.error || "Failed to fetch categories")

    const cats: CategoryItem[] = catJson.data
    const withJobs = cats
     .filter((c) => c._count.job > 0)
     .sort((a, b) => b._count.job - a._count.job)
    setItems(withJobs.map((c) => ({ kind: "category" as const, category: c })))
   } catch (err) {
    setError(err instanceof Error ? err.message : "Something went wrong")
   } finally {
    setLoading(false)
   }
  }
  fetchData()
 }, [dataVersion])

 const rows = items.slice(0, 8).map((item) =>
  item.kind === "exam"
   ? {
      id: item.exam.id,
      name: item.exam.name,
      meta: item.exam.category?.name || "General",
      href: `/jobs?categoryId=${item.exam.categoryId}`,
     }
   : {
      id: item.category.id,
      name: item.category.name,
      meta: `${item.category._count.job} active ${item.category._count.job === 1 ? "opening" : "openings"}`,
      href: `/jobs?categoryId=${item.category.id}`,
     }
 )

 return (
  <div className={cn("relative", className)}>
   <div
    className="rounded-[6px] p-2.5"
    style={{
     background: "linear-gradient(135deg, oklch(50% 0.07 55), oklch(40% 0.06 50) 50%, oklch(47% 0.07 55))",
     boxShadow: "inset 0 1px 0 rgb(255 255 255 / .18), 0 22px 40px -26px rgb(40 20 0 / .6)",
    }}
   >
    <div
     className={cn(handFont.className, "relative overflow-hidden rounded-[2px] px-5 pb-6 pt-5")}
     style={{
      color: CHALK,
      backgroundColor: "oklch(34% 0.045 165)",
      backgroundImage:
       "radial-gradient(ellipse at 30% 20%, rgb(255 255 255 / .07), transparent 55%), radial-gradient(ellipse at 80% 90%, rgb(255 255 255 / .05), transparent 50%), repeating-linear-gradient(-12deg, rgb(255 255 255 / .018) 0 2px, transparent 2px 9px)",
      boxShadow: "inset 0 2px 8px rgb(0 0 0 / .45)",
     }}
    >
     {/* half-erased smudge from the last class */}
     <span
      className="pointer-events-none absolute -right-6 top-10 h-16 w-40 -rotate-[8deg] rounded-full"
      style={{ background: "rgb(255 255 255 / .05)", filter: "blur(6px)" }}
      aria-hidden
     />

     <p className="text-[0.95rem]" style={{ color: CHALK_DIM }}>
      today&apos;s board
     </p>
     <h3 className="mt-0.5 font-[family-name:inherit] text-[1.65rem] leading-tight" style={{ letterSpacing: 0 }}>
      Popular exams
     </h3>
     <svg viewBox="0 0 200 8" className="mt-0.5 h-2 w-36" preserveAspectRatio="none" aria-hidden>
      <path d="M2 5 C 50 2, 110 7, 198 3" fill="none" stroke={CHALK_YELLOW} strokeWidth="2" strokeLinecap="round" />
     </svg>
     <p className="mt-2 text-[1rem] leading-snug" style={{ color: CHALK_DIM }}>
      what the batch is preparing for
     </p>

     {loading ? (
      <div className="mt-5 space-y-3">
       {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="block h-4 rounded-sm bg-white/10" style={{ width: `${85 - i * 7}%` }} />
       ))}
      </div>
     ) : error || rows.length === 0 ? (
      <p className="mt-6 text-[1.05rem]" style={{ color: CHALK_DIM }}>
       {error ? "Couldn't write today's list. Try again later." : "Board is clean today."}
      </p>
     ) : (
      <ol className="mt-4 space-y-1">
       {rows.map((r, i) => (
        <li key={r.id}>
         <Link href={r.href} className="group flex items-baseline gap-3 py-1">
          <span className="w-6 shrink-0 text-right text-[1.15rem]" style={{ color: i < 3 ? CHALK_YELLOW : CHALK_DIM }}>
           {i + 1}.
          </span>
          <span className="min-w-0 flex-1">
           <span className="relative inline-block max-w-full truncate align-bottom text-[1.15rem] leading-snug group-hover:underline group-hover:decoration-wavy group-hover:underline-offset-4">
            {r.name}
           </span>
           <span className="block truncate text-[0.88rem] leading-tight" style={{ color: CHALK_DIM }}>
            {r.meta}
           </span>
          </span>
          {i === 0 && (
           <span className="shrink-0 -rotate-[8deg] text-[0.95rem]" style={{ color: CHALK_YELLOW }}>
            ★ imp.
           </span>
          )}
         </Link>
        </li>
       ))}
      </ol>
     )}
    </div>

    {/* ledge with chalk and duster */}
    <div className="relative mt-1.5 h-3 rounded-[2px]" style={{ background: "oklch(36% 0.05 50)" }} aria-hidden>
     <span className="absolute -top-1 left-6 h-1.5 w-8 rotate-[3deg] rounded-full" style={{ background: "oklch(97% 0.005 100)" }} />
     <span className="absolute -top-1 left-[4.4rem] h-1.5 w-5 -rotate-[6deg] rounded-full" style={{ background: CHALK_YELLOW }} />
     <span className="absolute -top-3 right-6 h-3.5 w-14 rounded-[2px]" style={{ background: "linear-gradient(to bottom, oklch(45% 0.06 60) 0 55%, oklch(85% 0.01 90) 55%)" }} />
    </div>
   </div>
  </div>
 )
}
