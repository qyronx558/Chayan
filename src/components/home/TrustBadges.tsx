/* eslint-disable @next/next/no-img-element */
import Script from "next/script"
import { ShieldCheck, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const DMCA_ID = "1af2b354-a6eb-4a01-8741-3217354eca7d"

export function TrustBadges({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "border-y border-gray-200 bg-gradient-to-b from-gray-50 to-white dark:border-gray-800 dark:from-gray-900 dark:to-gray-950",
        className
      )}
    >
      <Script src="https://images.dmca.com/Badges/DMCABadgeHelper.min.js" strategy="lazyOnload" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
            Why Trust Chayan
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your career updates, protected and verified at every step.
          </p>
        </div>

        <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* DMCA Protected */}
          <div className="group flex flex-col items-center rounded-xl px-4 py-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:hover:bg-gray-900">
            <a
              href={`//www.dmca.com/Protection/Status.aspx?ID=${DMCA_ID}`}
              title="DMCA.com Protection Status"
              className="dmca-badge transition-transform duration-200 group-hover:scale-105"
              rel="noopener noreferrer"
            >
              <img
                src={`https://images.dmca.com/Badges/dmca-badge-w100-1x1-01.png?ID=${DMCA_ID}`}
                alt="DMCA.com Protection Status"
                width={72}
                height={72}
                loading="lazy"
              />
            </a>
            <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
              DMCA Protected
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Content theft protection active</p>
          </div>

          {/* Google News */}
          <div className="group flex flex-col items-center rounded-xl px-4 py-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:hover:bg-gray-900">
            <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm transition-transform duration-200 group-hover:scale-105 dark:border-gray-700">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4EXCMVIgNmAFxWlQJ4GjuYHWDFsZ7Nu1TuoGiplzucQ&s=10"
                alt="Google News Approved"
                width={56}
                height={56}
                loading="lazy"
              />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
              Google News Approved
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Listed news publisher</p>
          </div>

          {/* SSL Secure */}
          <div className="group flex flex-col items-center rounded-xl px-4 py-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:hover:bg-gray-900">
            <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm transition-transform duration-200 group-hover:scale-105 dark:border-gray-700">
              <img
                src="https://t4.ftcdn.net/jpg/14/95/32/55/360_F_1495325523_nKpftTrWkLaQP6c6wZId8f10LmSpO5ZS.jpg"
                alt="SSL Secure"
                width={56}
                height={56}
                loading="lazy"
              />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">SSL Secure</h3>
            <p className="mt-1 text-xs text-muted-foreground">256-bit encrypted connection</p>
          </div>

          {/* Verified Sources */}
          <div className="group flex flex-col items-center rounded-xl px-4 py-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:hover:bg-gray-900">
            <div className="flex w-full max-w-[240px] items-center gap-3 rounded-xl bg-gradient-to-br from-teal-800 to-teal-600 px-4 py-3 text-left shadow-sm transition-transform duration-200 group-hover:scale-105">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold leading-tight text-white">Verified Sources</div>
                <div className="mt-0.5 text-[11px] leading-tight text-teal-100">
                  Info from official portals only
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold tracking-wide text-teal-300">
                  <BadgeCheck className="h-3 w-3" />
                  TRUSTED &amp; ACCURATE
                </div>
              </div>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
              Verified Sources
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Trusted &amp; accurate information</p>
          </div>
        </div>
      </div>
    </section>
  )
}
