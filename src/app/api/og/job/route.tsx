import { ImageResponse } from "next/og";

export const runtime = "edge";

const NAVY = "#14273E";
const GOLD = "#E4C87F";
const TEAL = "#0d9488";
const SAFFRON = "#FF9933";
const INDIA_GREEN = "#138808";

function safeParam(value: string | null, fallback: string, max: number): string {
  const cleaned = (value || fallback).replace(/\s+/g, " ").trim().slice(0, max);
  return cleaned || fallback;
}

function optionalParam(value: string | null, max: number): string {
  return (value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function TricolorBar({ height = 12 }: { height?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", height, width: "100%" }}>
      <div style={{ flex: 1, background: SAFFRON }} />
      <div style={{ flex: 1, background: "#F5F2EA" }} />
      <div style={{ flex: 1, background: INDIA_GREEN }} />
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: 16,
        padding: "13px 24px",
      }}
    >
      <div style={{ fontSize: 14, letterSpacing: 2.5, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
        {label}
      </div>
      <div style={{ fontSize: 27, fontWeight: 800, color: "#FFFFFF" }}>{value}</div>
    </div>
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const title = safeParam(searchParams.get("title"), "Latest Sarkari Job", 90);
    const dept = safeParam(searchParams.get("dept"), "ChayanJobs Jobs", 50);
    const meta = safeParam(searchParams.get("meta"), "Apply now", 40);
    const vacancies = optionalParam(searchParams.get("vacancies"), 20);
    const lastDate = optionalParam(searchParams.get("lastDate"), 24);

    const titleSize = title.length > 70 ? 38 : title.length > 45 ? 46 : 54;

    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            background: NAVY,
            color: "#FFFFFF",
            fontFamily: "sans-serif",
          }}
        >
          <TricolorBar />

          {/* body */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              padding: "0 64px",
              gap: 20,
            }}
          >
            {/* brand row */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 16 }}>
                {/* exact site logo mark: teal tile + white check (see LogoSmall) */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 13,
                    background: TEAL,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="38" height="38" viewBox="0 0 80 80">
                    <path
                      d="M20 48 L30 58 L55 28"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                {/* exact site wordmark + tag (see LogoSmall) */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      fontSize: 38,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      lineHeight: 1.25,
                    }}
                  >
                    ChayanJobs
                  </div>
                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 500,
                      letterSpacing: 1,
                      color: "rgba(255,255,255,0.6)",
                      marginTop: -2,
                    }}
                  >
                    select right. serve right.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  border: "1.5px solid rgba(255,255,255,0.35)",
                  borderRadius: 999,
                  padding: "9px 24px",
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: 999, background: GOLD }} />
                <div style={{ fontSize: 19, fontWeight: 600, color: "#FFFFFF" }}>
                  Verified notification
                </div>
              </div>
            </div>

            {/* department eyebrow */}
            <div
              style={{
                fontSize: 21,
                fontWeight: 700,
                letterSpacing: 3,
                color: GOLD,
              }}
            >
              {dept.toUpperCase()}
            </div>

            {/* job title */}
            <div
              style={{
                fontSize: titleSize,
                fontWeight: 800,
                lineHeight: 1.18,
                color: "#FFFFFF",
              }}
            >
              {title}
            </div>

            {/* key facts */}
            <div style={{ display: "flex", flexDirection: "row", gap: 14, marginTop: 4 }}>
              {vacancies ? <InfoCard label="VACANCIES" value={vacancies} /> : null}
              {lastDate ? <InfoCard label="LAST DATE" value={lastDate} /> : null}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  background: GOLD,
                  borderRadius: 16,
                  padding: "13px 28px",
                  fontSize: 24,
                  fontWeight: 800,
                  color: NAVY,
                }}
              >
                {meta}
              </div>
            </div>
          </div>

          {/* footer */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 64px",
                marginBottom: 22,
              }}
            >
              <div style={{ fontSize: 21, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                chayanjobs.com
              </div>
              <div style={{ fontSize: 19, color: "rgba(255,255,255,0.6)" }}>
                Share with fellow aspirants
              </div>
            </div>
            <TricolorBar />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      }
    );
  } catch (err) {
    return new Response(`Poster generation failed: ${err instanceof Error ? err.message : "unknown error"}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
