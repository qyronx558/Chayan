"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WhatsAppIcon, TelegramIcon } from "@/components/jobs/share-icons"

/** One compact share row (copy / WhatsApp / Telegram / print) used by every detail-page rail. */
export function ShareRow({ title }: { title: string }) {
 const [copied, setCopied] = useState(false)
 /* Set after mount so server HTML and first client render match. */
 const [pageUrl, setPageUrl] = useState("")
 useEffect(() => setPageUrl(window.location.href), [])
 const url = () => pageUrl

 const copy = async () => {
  try {
   await navigator.clipboard.writeText(url())
   setCopied(true)
   setTimeout(() => setCopied(false), 2000)
  } catch {
   // clipboard unavailable
  }
 }

 return (
  <div className="flex items-center gap-1.5">
   <span className="agate mr-auto text-[11px] uppercase tracking-wider text-muted-foreground">Share</span>
   <Button variant="outline" size="icon" className="h-8 w-8" onClick={copy} title="Copy link" aria-label="Copy link">
    {copied ? <Check className="h-3.5 w-3.5 text-brick" /> : <Copy className="h-3.5 w-3.5" />}
   </Button>
   <Button variant="outline" size="icon" className="h-8 w-8" asChild>
    <a href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${url()}`)}`} target="_blank" rel="noopener noreferrer" title="Share on WhatsApp" aria-label="Share on WhatsApp">
     <WhatsAppIcon />
    </a>
   </Button>
   <Button variant="outline" size="icon" className="h-8 w-8" asChild>
    <a href={`https://t.me/share/url?url=${encodeURIComponent(url())}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" title="Share on Telegram" aria-label="Share on Telegram">
     <TelegramIcon />
    </a>
   </Button>
   <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => window.print()} title="Print / Save PDF" aria-label="Print">
    <Printer className="h-3.5 w-3.5" />
   </Button>
  </div>
 )
}
