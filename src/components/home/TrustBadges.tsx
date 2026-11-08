/* eslint-disable @next/next/no-img-element */
import Script from "next/script"
import { ShieldCheck, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const DMCA_ID = "1af2b354-a6eb-4a01-8741-3217354eca7d"

export function TrustBadges({ className }: { className?: string }) {
 return (
  <section
   className={cn(
    "w-full max-w-[100vw] overflow-x-clip border-y border-rule bg-paper-2",
    className
   )}
  >
   <Script src="https://images.dmca.com/Badges/DMCABadgeHelper.min.js" strategy="lazyOnload" />
   <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-10 sm:px-6 lg:px-8">
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
     <p className="font-display text-lg font-bold text-foreground">Why readers trust ChayanJobs</p>
     <p className="text-sm text-muted-foreground">
      Your career updates, protected and verified at every step.
     </p>
    </div>

    <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-rule">
     <div className="flex items-center gap-4 lg:px-6 lg:first:pl-0">
      <a
       href={`//www.dmca.com/Protection/Status.aspx?ID=${DMCA_ID}`}
       title="DMCA.com Protection Status"
       className="dmca-badge shrink-0"
       rel="noopener noreferrer"
      >
       <img
        src={`https://images.dmca.com/Badges/dmca-badge-w100-1x1-01.png?ID=${DMCA_ID}`}
        alt="DMCA.com Protection Status"
        width={56}
        height={56}
        loading="lazy"
       />
      </a>
      <div className="min-w-0">
       <h3 className="text-sm font-semibold text-foreground">DMCA protected</h3>
       <p className="mt-0.5 text-xs text-muted-foreground">Content theft protection active</p>
      </div>
     </div>

     <div className="flex items-center gap-4 lg:px-6">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-rule bg-background">
       <img
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4EXCMVIgNmAFxWlQJ4GjuYHWDFsZ7Nu1TuoGiplzucQ&s=10"
        alt="Google News Approved"
        width={44}
        height={44}
        loading="lazy"
       />
      </div>
      <div className="min-w-0">
       <h3 className="text-sm font-semibold text-foreground">Google News approved</h3>
       <p className="mt-0.5 text-xs text-muted-foreground">Listed news publisher</p>
      </div>
     </div>

     <div className="flex items-center gap-4 lg:px-6">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-rule bg-background">
       <img
        src="https://t4.ftcdn.net/jpg/14/95/32/55/360_F_1495325523_nKpftTrWkLaQP6c6wZId8f10LmSpO5ZS.jpg"
        alt="SSL Secure"
        width={44}
        height={44}
        loading="lazy"
       />
      </div>
      <div className="min-w-0">
       <h3 className="text-sm font-semibold text-foreground">SSL secure</h3>
       <p className="mt-0.5 text-xs text-muted-foreground">256-bit encrypted connection</p>
      </div>
     </div>

     <div className="flex items-center gap-4 lg:px-6 lg:last:pr-0">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-rule bg-background">
       <ShieldCheck className="h-7 w-7 text-foreground" aria-hidden />
      </div>
      <div className="min-w-0">
       <h3 className="flex items-center gap-1 text-sm font-semibold text-foreground">
        Verified sources
        <BadgeCheck className="h-3.5 w-3.5 text-brick" aria-hidden />
       </h3>
       <p className="mt-0.5 text-xs text-muted-foreground">Official portals only</p>
      </div>
     </div>
    </div>
   </div>
  </section>
 )
}
