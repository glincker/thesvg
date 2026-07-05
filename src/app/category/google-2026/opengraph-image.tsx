import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getIconsByCategory } from "@/lib/icons";

// Required for `output: "export"` builds — without force-static, Next refuses
// to collect this route at build time (it has no static params and isn't a
// page, so it falls back to dynamic). For static export we generate the
// image once at build and serve the resulting PNG file.
export const dynamic = "force-static";
export const runtime = "nodejs";
export const alt = "Google 2026 brand icons on thesvg.org";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadSvg(slug: string): Promise<string | null> {
  try {
    const segs = ["public", "icons", slug, "default.svg"];
    const p = segs.reduce((acc, s) => join(acc, s), process.cwd());
    return await readFile(p, "utf-8");
  } catch {
    return null;
  }
}

const HERO_ORDER = [
  "gmail-2026",
  "google-calendar-2026",
  "google-drive-2026",
  "google-docs-2026",
  "google-meet-2026",
];

export default async function Image() {
  const icons = getIconsByCategory("Google 2026");
  const heroSvgs = await Promise.all(
    HERO_ORDER.map(async (slug) => ({ slug, svg: await loadSvg(slug) })),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(180deg, #0b0d12 0%, #14171f 100%)",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* color blobs */}
        <div style={{ position: "absolute", top: -120, left: -80, width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(234,67,53,0.45) 0%, transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", top: 60, right: -80, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,188,4,0.45) 0%, transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -140, left: 240, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,168,83,0.45) 0%, transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -80, right: 60, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(66,133,244,0.45) 0%, transparent 70%)", display: "flex" }} />

        {/* eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 18px",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.7)",
            fontSize: 18,
            letterSpacing: 2,
            marginBottom: 24,
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#34a853", display: "flex" }} />
          {" "}Brand Refresh · Q2 2026
        </div>

        {/* title */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 24,
            fontSize: 130,
            fontWeight: 800,
            letterSpacing: -4,
            lineHeight: 1,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              backgroundImage:
                "linear-gradient(92deg, #4285f4 0%, #34a853 28%, #fbbc04 58%, #ea4335 100%)",
              backgroundClip: "text",
              color: "transparent",
              WebkitBackgroundClip: "text",
            }}
          >
            Google
          </div>
          <div style={{ display: "flex", color: "rgba(255,255,255,0.55)", fontSize: 64 }}>2026</div>
        </div>

        {/* 5-up row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            padding: "20px 28px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 32,
            backdropFilter: "blur(8px)",
          }}
        >
          {heroSvgs.map(({ slug, svg }) =>
            svg ? (
               
              <img
                key={slug}
                src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`}
                width={120}
                height={120}
                alt=""
                style={{ objectFit: "contain" }}
              />
            ) : (
              <div
                key={slug}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.08)",
                  display: "flex",
                }}
              />
            ),
          )}
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 36,
            color: "rgba(255,255,255,0.55)",
            fontSize: 22,
            fontWeight: 500,
          }}
        >
          <div style={{ display: "flex" }}>{icons.length} icons</div>
          <div style={{ display: "flex" }}>·</div>
          <div style={{ display: "flex" }}>SVG · gradient-perfect</div>
          <div style={{ display: "flex" }}>·</div>
          <div style={{ display: "flex" }}>thesvg.org</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
