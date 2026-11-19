import type { NextConfig } from "next";
import { isProduction } from "./src/lib/app-env";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  output: process.env.DOCKER === "true" ? "standalone" : undefined,
  poweredByHeader: false,
  async headers() {
    // Pages that host the in-app browser. Official application forms framed
    // there need the camera (live photo), location (exam centre) and payment
    // sheets, and a frame can only be granted what its host page is allowed.
    const browserShellPolicy = {
      key: "Permissions-Policy",
      value: "camera=*, microphone=(), geolocation=*, payment=*, usb=()",
    }
    const browserShellRoutes = [
      "/browse",
      "/apply/:slug/start",
      "/private-jobs/:slug/apply",
      "/result/:slug/view",
      "/admit-card/:slug/view",
      "/answer-key/:slug/view",
      "/syllabus/:slug/view",
      "/admission/:slug/view",
    ]
    return [
      {
        source: "/:path*",
        headers: [
          // Browsers must use HTTPS for this site for the next two years.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // Never guess a file's type from its content.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Only this site may frame its own pages (blocks clickjacking).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
      ...[
        "/api/admin/:path*",
        "/api/auth/:path*",
        "/api/users/:path*",
        "/api/user/:path*",
        "/api/employer/:path*",
        "/api/applications/:path*",
        "/api/private-applications/:path*",
        "/api/bookmarks/:path*",
        "/api/stats",
        "/api/comments/:path*",
        "/api/private-jobs/recommendations",
        "/api/cron/:path*",
        "/api/track/:path*",
      ].map((source) => ({ source, headers: [{ key: "Cache-Control", value: "private, no-store" }] })),
      // Listed after the site-wide rule so this value wins on these routes.
      ...browserShellRoutes.map((source) => ({ source, headers: [browserShellPolicy] })),
      // Local and dev copies: tell search engines not to index anything.
      ...(isProduction() ? [] : [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]),
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
