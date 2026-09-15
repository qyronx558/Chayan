"use client"

import { useState } from "react"
import { Link2, Check, MessageCircle, Mail, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function ShareRail({ title, url, vertical = true }: { title: string; url: string; vertical?: boolean }) {
  const [copied, setCopied] = useState(false)
  const encUrl = encodeURIComponent(url)
  const encTitle = encodeURIComponent(title)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, url }) } catch { /* dismissed */ }
    } else copy()
  }

  const btn = "flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#B08D57] hover:text-[#1B3A5C] hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-[#B08D57] dark:hover:text-[#E8C87A]"

  return (
    <div className={cn("flex gap-2", vertical ? "flex-col items-center" : "flex-row items-center")}>
      <span className={cn("text-[11px] font-bold uppercase tracking-widest text-gray-400", vertical && "[writing-mode:vertical-lr] rotate-180")}>Share</span>
      <a href={`https://wa.me/?text=${encTitle}%20${encUrl}`} target="_blank" rel="noreferrer" aria-label="Share on WhatsApp" className={btn}>
        <MessageCircle className="h-4 w-4" />
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${encTitle}&url=${encUrl}`} target="_blank" rel="noreferrer" aria-label="Share on X" className={btn}>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
      </a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`} target="_blank" rel="noreferrer" aria-label="Share on LinkedIn" className={btn}>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z" /></svg>
      </a>
      <a href={`mailto:?subject=${encTitle}&body=${encUrl}`} aria-label="Share by email" className={btn}>
        <Mail className="h-4 w-4" />
      </a>
      <button type="button" onClick={copy} aria-label="Copy link" className={cn(btn, copied && "border-green-300 text-green-600")}>
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
      <button type="button" onClick={nativeShare} aria-label="More share options" className={`${btn} lg:hidden`}>
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  )
}
