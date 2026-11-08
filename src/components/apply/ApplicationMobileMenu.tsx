"use client"

import { Download, ExternalLink, Flag, Info, MoreVertical, RefreshCw, Share2 } from "lucide-react"
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ApplicationMobileMenuProps {
 hostname: string
 officialUrl: string
 onInfo: () => void
 onReload: () => void
 onShare: () => void
 onReport: () => void
 downloadUrl?: string | null
 downloadFilename?: string
 onDownload?: () => void
}

/**
 * Mobile ⋮ menu - holds every desktop rail action except Apply,
 * which always stays directly accessible in the bottom bar.
 */
export function ApplicationMobileMenu({
 hostname,
 officialUrl,
 onInfo,
 onReload,
 onShare,
 onReport,
 downloadUrl,
 downloadFilename,
 onDownload,
}: ApplicationMobileMenuProps) {
 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <button
     type="button"
     aria-label="More options"
     className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:text-muted-foreground dark:hover:bg-ink dark:hover:text-paper"
    >
     <MoreVertical className="h-5 w-5" />
    </button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuItem onSelect={onInfo}>
     <Info className="mr-2 h-4 w-4" />
     Job details
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={onReload}>
     <RefreshCw className="mr-2 h-4 w-4" />
     Reload website
    </DropdownMenuItem>
    {downloadUrl ? (
     <DropdownMenuItem asChild>
      <a href={downloadUrl} download={downloadFilename || "document.pdf"} onClick={onDownload}>
       <Download className="mr-2 h-4 w-4" />
       Download PDF
      </a>
     </DropdownMenuItem>
    ) : null}
    <DropdownMenuItem asChild>
     <a href={officialUrl} target="_blank" rel="noopener noreferrer">
      <ExternalLink className="mr-2 h-4 w-4" />
      Open {hostname}
     </a>
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={onShare}>
     <Share2 className="mr-2 h-4 w-4" />
     Share this job
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={onReport}>
     <Flag className="mr-2 h-4 w-4" />
     Report issue
    </DropdownMenuItem>
   </DropdownMenuContent>
  </DropdownMenu>
 )
}
