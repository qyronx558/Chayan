"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function sessionId(): string {
  try {
    let v = sessionStorage.getItem("cj_sid");
    if (!v) {
      v = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("cj_sid", v);
    }
    return v;
  } catch {
    return `${Date.now().toString(36)}`;
  }
}

export function Tracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { doNotTrack?: string }).doNotTrack === "1") return;
    const started = Date.now();
    const sid = sessionId();
    const utm = search ?? new URLSearchParams();
    const payload = {
      path: pathname ?? "/",
      referrer: document.referrer || undefined,
      utmSource: utm.get("utm_source") ?? undefined,
      utmMedium: utm.get("utm_medium") ?? undefined,
      utmCampaign: utm.get("utm_campaign") ?? undefined,
      sessionId: sid,
    };
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track/view", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track/view", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => null);
    }
    let lcp = 0;
    const po = typeof PerformanceObserver !== "undefined" ? new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.entryType === "largest-contentful-paint") lcp = Math.max(lcp, e.startTime);
      }
    }) : null;
    try { po?.observe({ type: "largest-contentful-paint", buffered: true }); } catch { /* noop */ }
    const sendVitals = () => {
      const dwell = Date.now() - started;
      fetch("/api/track/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metric: "time-on-page", value: Math.round(dwell / 1000), path: pathname ?? "/", sessionId: sid }),
        keepalive: true,
      }).catch(() => null);
      if (lcp > 0) {
        fetch("/api/track/vitals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metric: "LCP", value: Math.round(lcp), path: pathname ?? "/", sessionId: sid }),
          keepalive: true,
        }).catch(() => null);
      }
      po?.disconnect();
    };
    window.addEventListener("pagehide", sendVitals, { once: true });
    return () => window.removeEventListener("pagehide", sendVitals);
  }, [pathname, search]);
  return null;
}
