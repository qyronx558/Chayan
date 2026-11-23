import { communityLinks, siteConfig, type CommunityKey } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { WhatsAppIcon, TelegramIcon, InstagramIcon, XIcon, FacebookIcon } from "@/components/jobs/share-icons"

const ICONS: Record<CommunityKey, typeof WhatsAppIcon> = {
 whatsapp: WhatsAppIcon,
 telegram: TelegramIcon,
 instagram: InstagramIcon,
 x: XIcon,
 facebook: FacebookIcon,
}

const ext = { target: "_blank", rel: "noopener noreferrer" } as const

/**
 * "Join our community" links to the official ChayanJobs channels.
 * - footer: icon row for the dark footer
 * - rail: compact "get alerts first" card for detail-page action rails
 */
export function CommunityLinks({ variant, className }: { variant: "footer" | "rail"; className?: string }) {
 if (variant === "footer") {
  return (
   <div className={className}>
    <p className="text-sm font-semibold text-paper">Join our community</p>
    <p className="mt-0.5 text-xs text-paper/60">Free job alerts on WhatsApp &amp; Telegram</p>
    <ul className="mt-3 flex flex-wrap gap-2">
     {communityLinks.map(({ key, label, href }) => {
      const Icon = ICONS[key]
      return (
       <li key={key}>
        <a
         href={href}
         {...ext}
         title={label}
         aria-label={`ChayanJobs on ${label}`}
         className="flex h-10 w-10 items-center justify-center rounded-full border border-paper/25 text-paper/75 transition-colors hover:border-paper/60 hover:bg-paper/10 hover:text-paper"
        >
         <Icon className="h-4 w-4" />
        </a>
       </li>
      )
     })}
    </ul>
   </div>
  )
 }

 const others = communityLinks.filter((l) => l.key !== "whatsapp" && l.key !== "telegram")
 return (
  <div className={cn("rounded-xl border border-[var(--hs-border-strong)] p-3", className)}>
   <p className="text-xs font-semibold text-foreground">Get job alerts first, free</p>
   <div className="mt-2 grid grid-cols-2 gap-2">
    <a
     href={siteConfig.links.whatsapp}
     {...ext}
     aria-label="Join ChayanJobs WhatsApp Community"
     className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
    >
     <WhatsAppIcon className="h-4 w-4" /> WhatsApp
    </a>
    <a
     href={siteConfig.links.telegram}
     {...ext}
     aria-label="Join ChayanJobs Telegram"
     className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#229ED9] px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
    >
     <TelegramIcon className="h-4 w-4" /> Telegram
    </a>
   </div>
   <div className="mt-2 flex items-center gap-1.5">
    <span className="agate mr-auto text-[11px] uppercase tracking-wider text-muted-foreground">Follow us</span>
    {others.map(({ key, label, href }) => {
     const Icon = ICONS[key]
     return (
      <a
       key={key}
       href={href}
       {...ext}
       title={label}
       aria-label={`ChayanJobs on ${label}`}
       className="flex h-8 w-8 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
       <Icon className="h-3.5 w-3.5" />
      </a>
     )
    })}
   </div>
  </div>
 )
}
