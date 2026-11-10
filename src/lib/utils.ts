import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import slugifyLib from "slugify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined, dateFormat: string = "dd MMM yyyy"): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return ""
  return format(d, dateFormat)
}

export function formatSalary(salary: string | null | undefined): string {
  if (!salary) return "Not Disclosed"
  return salary
}

export function slugify(str: string): string {
  return slugifyLib(str, { lower: true, strict: true })
}

export function truncate(str: string | null | undefined, length: number = 100): string {
  if (!str) return ""
  if (str.length <= length) return str
  return str.substring(0, length).trim() + "..."
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-paper-3 text-foreground"
    case "EXPIRED":
      return "bg-paper-2 text-brick"
    case "UPCOMING":
      return "bg-paper-2 text-brick"
    default:
      return "bg-paper-2 text-muted-foreground"
  }
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://ChayanJobs.in").replace(/\/+$/, "")
}

export function generateSEO({
  title,
  description,
  url,
  image,
  publishedTime,
  type = "website",
}: {
  title: string
  description: string
  url?: string
  image?: string
  publishedTime?: string
  type?: "website" | "article"
}) {
  const siteUrl = getBaseUrl()
  const fullUrl = url ? `${siteUrl}${url.startsWith("/") ? url : `/${url}`}` : siteUrl
  const ogImage = image || `${siteUrl}/og.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: "ChayanJobs",
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type,
      publishedTime,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: fullUrl },
  }
}

export function absoluteUrl(path: string): string {
  return `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`
}

export function createJsonLD<T>(data: T): string {
  return JSON.stringify(data)
}

/** Compact human count: 982 -> "982", 12400 -> "12.4k", 2300000 -> "2.3M". Feels real in view counts. */
export function formatCompact(n: number | null | undefined): string {
  const v = typeof n === "number" && isFinite(n) ? Math.max(0, Math.floor(n)) : 0
  if (v < 1000) return v.toLocaleString("en-IN")
  if (v < 100000) {
    const k = v / 1000
    return `${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}k`
  }
  if (v < 10000000) {
    const l = v / 100000
    return `${Math.round(l * 10) / 10}L`
  }
  const c = v / 10000000
  return `${Math.round(c * 10) / 10}Cr`
}

/** "1 view" / "12.4k views" - real-feel label for article meta rows. */
export function formatViews(n: number | null | undefined): string {
  const v = typeof n === "number" && isFinite(n) ? Math.max(0, Math.floor(n)) : 0
  return `${formatCompact(v)} ${v === 1 ? "view" : "views"}`
}

/** Relative day label: "Today" / "Yesterday" / "4d ago", falls back to formatted date. */
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return ""
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) {
    const w = Math.floor(days / 7)
    return w === 1 ? "1wk ago" : `${w}w ago`
  }
  return formatDate(d)
}

/**
 * JSON for an inline <script type="application/ld+json">. Escapes "<" so text
 * such as "</script>" inside a title can never close the tag and inject markup.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
