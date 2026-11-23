import type { CSSProperties } from "react"
import { communityLinks, type CommunityKey } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { WhatsAppIcon, TelegramIcon, InstagramIcon, XIcon, FacebookIcon } from "@/components/jobs/share-icons"

/** Official brand logo + colour for each channel. */
const BRANDS: Record<CommunityKey, { Icon: typeof WhatsAppIcon; style: CSSProperties; short: string }> = {
 whatsapp: { Icon: WhatsAppIcon, style: { background: "#25D366" }, short: "WhatsApp" },
 telegram: { Icon: TelegramIcon, style: { background: "#229ED9" }, short: "Telegram" },
 instagram: {
  Icon: InstagramIcon,
  style: { background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)" },
  short: "Instagram",
 },
 x: { Icon: XIcon, style: { background: "#000000" }, short: "X" },
 facebook: { Icon: FacebookIcon, style: { background: "#1877F2" }, short: "Facebook" },
}

/*
 * data-cj-native opts out of the site-wide ExternalLinkInterceptor so these
 * open the real WhatsApp / Telegram / Instagram / X / Facebook page directly,
 * not the ChayanJobs in-app browser.
 */
const ext = { target: "_blank", rel: "noopener noreferrer", "data-cj-native": "true" } as const

/** One round brand-coloured logo button linking straight to the channel. */
export function BrandIconLink({ k, size = "md", className }: { k: CommunityKey; size?: "sm" | "md"; className?: string }) {
 const link = communityLinks.find((l) => l.key === k)!
 const { Icon, style } = BRANDS[k]
 return (
  <a
   href={link.href}
   {...ext}
   title={link.label}
   aria-label={`ChayanJobs on ${link.label}`}
   style={style}
   className={cn(
    "flex shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-1 ring-white/20 transition-transform hover:scale-110",
    size === "sm" ? "h-8 w-8" : "h-10 w-10",
    className,
   )}
  >
   <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
  </a>
 )
}

/**
 * "Join our community" links to the official ChayanJobs channels.
 * - footer: brand-logo row for the dark footer
 * - rail: "get alerts first" card for detail-page action rails
 */
export function CommunityLinks({ variant, className }: { variant: "footer" | "rail"; className?: string }) {
 if (variant === "footer") {
  return (
   <div className={className}>
    <p className="text-sm font-semibold text-paper">Join our community</p>
    <p className="mt-0.5 text-xs text-paper/60">Free job alerts on WhatsApp, Telegram &amp; social media</p>
    <ul className="mt-3 flex flex-wrap gap-2.5">
     {communityLinks.map(({ key }) => (
      <li key={key}>
       <BrandIconLink k={key} />
      </li>
     ))}
    </ul>
   </div>
  )
 }

 return (
  <div className={cn("rounded-xl border border-[var(--hs-border-strong)] p-3", className)}>
   <p className="text-xs font-semibold text-foreground">Get job alerts first, free</p>
   <ul className="mt-2.5 grid grid-cols-5 gap-1">
    {communityLinks.map(({ key, href, label }) => {
     const { Icon, style, short } = BRANDS[key]
     return (
      <li key={key}>
       <a
        href={href}
        {...ext}
        title={label}
        aria-label={`Join ChayanJobs on ${label}`}
        className="group flex flex-col items-center gap-1 rounded-lg py-1 hover:bg-accent"
       >
        <span style={style} className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm transition-transform group-hover:scale-110">
         <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="text-[10px] font-medium leading-none text-muted-foreground">{short}</span>
       </a>
      </li>
     )
    })}
   </ul>
  </div>
 )
}
