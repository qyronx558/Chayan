"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { DIRECTORY_ROWS } from "@/lib/channels"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"

const WOOD = "linear-gradient(180deg, oklch(46% 0.07 52), oklch(38% 0.06 48))"
const CUBBY = "oklch(30% 0.045 48)"

export function DirectoryTable() {
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(email: string) {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(email)
      setTimeout(() => setCopied((current) => (current === email ? null : current)), 1600)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div className="rounded-[8px] p-2.5 sm:p-3" style={{ background: WOOD, boxShadow: "inset 0 1px 0 oklch(62% 0.07 55), 0 22px 34px -24px rgb(40 20 0 / .6)" }}>
      <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-3" aria-label="Official ChayanJobs email addresses by team">
        {DIRECTORY_ROWS.map((row, i) => (
          <li
            key={row.email}
            className="relative rounded-[4px] px-4 pb-4 pt-5"
            style={{ background: CUBBY, boxShadow: "inset 0 6px 10px -6px rgb(0 0 0 / .45), inset 0 -1px 0 rgb(255 255 255 / .06)" }}
          >
            {/* brass label plate on the cubby */}
            <span className={cn(typeFont.className, "absolute -top-px left-4 rounded-b-[3px] px-2 py-0.5 text-[10px] font-bold tracking-[0.2em] text-[oklch(28%_0.04_60)]")} style={{ background: "linear-gradient(180deg, oklch(86% 0.09 85), oklch(74% 0.1 78))" }}>
              {row.team.toUpperCase()}
            </span>
            {/* the envelope waiting in it */}
            <div className={cn("mt-2 rounded-[3px] px-3.5 pb-3 pt-3 text-[oklch(27%_0.03_60)]", i % 2 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]")} style={{ background: "oklch(97% 0.012 85)", boxShadow: "0 4px 8px -4px rgb(0 0 0 / .5)" }}>
              <a
                href={`mailto:${row.email}`}
                className={cn(typeFont.className, "block break-all text-[13.5px] font-bold underline decoration-dotted underline-offset-4 hover:text-[oklch(45%_0.16_28)]")}
              >
                {row.email}
              </a>
              <p className="mt-1 text-[13px] leading-snug opacity-75">{row.description}</p>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className={cn(handFont.className, "text-[1rem] text-[oklch(42%_0.1_160)]")}>replies {row.reply.toLowerCase()}</span>
                <button
                  type="button"
                  onClick={() => copy(row.email)}
                  aria-label={copied === row.email ? `Copied ${row.email}` : `Copy ${row.email}`}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[oklch(27%_0.03_60/0.3)] px-3 text-[12.5px] font-semibold transition-colors hover:bg-[oklch(27%_0.03_60/0.07)]"
                >
                  {copied === row.email ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden /> Copied
                    </>
                  ) : (
                    "Copy"
                  )}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
