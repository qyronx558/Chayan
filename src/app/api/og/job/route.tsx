import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "Latest Sarkari Job").slice(0, 90);
  const dept = (searchParams.get("dept") || "Chayan Jobs").slice(0, 50);
  const meta = (searchParams.get("meta") || "Apply before last date").slice(0, 80);

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#1c2e44", color: "#eef2f6", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 12, background: "#e8e2d2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800, color: "#1c2e44" }}>C</div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>Chayan <span style={{ fontWeight: 400, fontSize: 19, opacity: 0.75 }}>select right. serve right.</span></div>
        </div>
        <div>
          <div style={{ fontSize: 25, opacity: 0.8 }}>{dept}</div>
          <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.15, marginTop: 8 }}>{title}</div>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <div style={{ background: "#e8e2d2", color: "#1c2e44", fontWeight: 700, fontSize: 25, padding: "10px 28px", borderRadius: 999 }}>{meta}</div>
            <div style={{ border: "1px solid rgba(255,255,255,.35)", fontWeight: 600, fontSize: 25, padding: "10px 28px", borderRadius: 999 }}>Verified notification</div>
          </div>
        </div>
        <div style={{ fontSize: 21, opacity: 0.75 }}>chayanjobs.com - share with fellow aspirants</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
