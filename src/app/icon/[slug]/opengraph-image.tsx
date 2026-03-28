import { ImageResponse } from "next/og";
import { getIconBySlug } from "@/lib/icons";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

function hexToRgba(hex: string, alpha: number): string {
  const safe = hex.length >= 6 ? hex.slice(0, 6) : hex.padEnd(6, "0");
  const r = parseInt(safe.slice(0, 2), 16);
  const g = parseInt(safe.slice(2, 4), 16);
  const b = parseInt(safe.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const icon = getIconBySlug(slug);

  if (!icon) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "#0a0a0a",
            color: "#fafafa",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          Icon not found
        </div>
      ),
      size
    );
  }

  const variantCount = Object.values(icon.variants).filter(Boolean).length;
  const hex = icon.hex && icon.hex !== "000000" ? icon.hex : "3b82f6";
  const brandColor = `#${hex.length >= 6 ? hex.slice(0, 6) : hex.padEnd(6, "0")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          padding: 60,
          position: "relative",
        }}
      >
        {/* Gradient glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at 70% 50%, ${hexToRgba(hex, 0.12)} 0%, transparent 50%)`,
          }}
        />

        {/* Left: text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            gap: 20,
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 700, color: "#fafafa", lineHeight: 1.1 }}>
            {icon.title}
          </div>

          <div style={{ fontSize: 24, color: "#a1a1aa", display: "flex", gap: 16, alignItems: "center" }}>
            <span>SVG Icon</span>
            <span style={{ color: "#52525b" }}>|</span>
            <span>{variantCount} variant{variantCount !== 1 ? "s" : ""}</span>
            {icon.categories[0] && (
              <>
                <span style={{ color: "#52525b" }}>|</span>
                <span>{icon.categories[0]}</span>
              </>
            )}
          </div>

          {icon.hex && icon.hex !== "000000" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: brandColor }} />
              <span style={{ fontSize: 18, color: "#71717a", fontFamily: "monospace" }}>
                #{icon.hex}
              </span>
            </div>
          )}

          <div style={{ display: "flex", marginTop: 20, fontSize: 20, color: "#52525b" }}>
            thesvg.org
          </div>
        </div>

        {/* Right: brand initial */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 300 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 240,
              height: 240,
              borderRadius: 48,
              background: `linear-gradient(135deg, ${hexToRgba(hex, 0.19)}, ${hexToRgba(hex, 0.06)})`,
              border: `2px solid ${hexToRgba(hex, 0.25)}`,
            }}
          >
            <div style={{ fontSize: 80, fontWeight: 700, color: brandColor, opacity: 0.8 }}>
              {icon.title.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
