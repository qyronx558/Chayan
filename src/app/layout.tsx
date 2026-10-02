import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Suspense } from "react"
import { Providers } from "@/components/layout/Providers"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ConditionalChrome } from "@/components/layout/ConditionalChrome"
import { HideOnAdmin } from "@/components/layout/HideOnAdmin"
import { SpotlightTour } from "@/components/onboarding/SpotlightTour"
import { ActivityTracker } from "@/components/layout/ActivityTracker"
import { CookieConsent } from "@/components/layout/CookieConsent"
import { GoogleAnalytics } from "@/components/layout/GoogleAnalytics"
import { AdSenseScript } from "@/components/ads/AdSenseScript"
import { siteConfig } from "@/lib/constants"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} - Latest Government Jobs, Results, Admit Cards`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: ["government jobs", "sarkari jobs", "govt jobs", "jobs in india", "sarkari result", "upcoming jobs", "sarkari naukri", "govt job alert"],
  authors: [{ name: siteConfig.name }],
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.name,
    url: siteConfig.url,
    title: `${siteConfig.name} - Latest Government Jobs, Results, Admit Cards`,
    description: siteConfig.description,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} - Latest Government Jobs, Results, Admit Cards`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  alternates: { canonical: siteConfig.url },
  other: {
    "google-adsense-account":
      process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-6200474851569598",
  },
  verification: process.env.GOOGLE_SEARCH_CONSOLE_ID
    ? { google: process.env.GOOGLE_SEARCH_CONSOLE_ID }
    : undefined,
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/og.png`,
  sameAs: [siteConfig.links.twitter, siteConfig.links.facebook, siteConfig.links.youtube],
  description: siteConfig.description,
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" />
            <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
          </>
        )}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Providers>
          <ConditionalChrome header={<Header />} footer={<Footer />}>
            {children}
          </ConditionalChrome>
          <HideOnAdmin>
            <SpotlightTour />
          </HideOnAdmin>
          <ActivityTracker />
          <HideOnAdmin>
            <CookieConsent />
          </HideOnAdmin>
          <Suspense fallback={null}>
            <GoogleAnalytics />
            <AdSenseScript />
          </Suspense>
        </Providers>
      </body>
    </html>
  )
}
