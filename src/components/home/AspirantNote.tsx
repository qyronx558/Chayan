import type { CSSProperties } from "react"
import { GitaVerses } from "@/components/home/GitaVerses"
import { InView } from "@/components/home/ui/InView"
import { sanskritFont, handFont } from "@/components/home/fonts"

/**
 * A note to aspirants, grounded in the Bhagavad Gita.
 * Colour: the band is the warm light of early morning (brahma muhurta), when
 * most aspirants study. The sun rises as you arrive, a few marigold petals
 * drift down, and the verse is written in front of you, line by line.
 */

/* Petals: hand-placed, not random, so the server and client agree. */
const PETALS = [
  { left: "6%", dur: "16s", delay: "0s", drift: "70px", spin: "380deg", size: 17, hue: 78 },
  { left: "19%", dur: "19s", delay: "5s", drift: "-40px", spin: "-300deg", size: 14, hue: 62 },
  { left: "34%", dur: "15s", delay: "9s", drift: "55px", spin: "460deg", size: 16, hue: 80 },
  { left: "52%", dur: "21s", delay: "2.5s", drift: "-65px", spin: "-420deg", size: 13, hue: 70 },
  { left: "67%", dur: "17s", delay: "11s", drift: "45px", spin: "340deg", size: 18, hue: 82 },
  { left: "81%", dur: "20s", delay: "6.5s", drift: "-50px", spin: "-380deg", size: 15, hue: 60 },
  { left: "93%", dur: "18s", delay: "13s", drift: "35px", spin: "300deg", size: 14, hue: 76 },
]

export function AspirantNote() {
  return (
    <InView
      className="relative overflow-hidden border-y border-[var(--hs-border)]"
      aria-label="A note to every aspirant"
      role="region"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in oklch, var(--hs-marigold) 16%, var(--color-paper)) 0%, var(--color-paper) 75%)",
      }}
    >
      {/* rising sun */}
      <div className="pointer-events-none absolute left-1/2 top-[-340px] -translate-x-1/2 sm:left-[70%]" aria-hidden>
        <div
          className="hs-rise h-[620px] w-[620px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--hs-marigold) 34%, transparent) 0%, color-mix(in oklch, var(--hs-marigold) 10%, transparent) 55%, transparent 70%)",
          }}
        />
      </div>

      {/* marigold petals drifting down */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {PETALS.map((p, i) => (
          <span
            key={i}
            className="hs-petal"
            style={
              {
                left: p.left,
                width: p.size,
                height: p.size * 0.62,
                borderRadius: "60% 40% 55% 45% / 70% 60% 40% 30%",
                background: `oklch(76% 0.15 ${p.hue})`,
                "--dur": p.dur,
                "--delay": p.delay,
                "--drift": p.drift,
                "--spin": p.spin,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="hs-container hs-section relative">
        <GitaVerses sanskritFont={sanskritFont.className} handFont={handFont.className} />
      </div>
    </InView>
  )
}
