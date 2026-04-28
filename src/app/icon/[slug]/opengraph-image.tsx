import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getAllIcons, getIconBySlug } from "@/lib/icons";

// Pin to Node.js runtime so node:fs/promises and node:path are available.
// Edge runtime would crash for any slug not in generateStaticParams (e.g., a
// social crawler hitting a path that wasn't pre-rendered).
export const runtime = "nodejs";

export const alt = "Brand SVG icon on thesvg.org";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const icons = getAllIcons();
  return icons.map((icon) => ({ slug: icon.slug }));
}

/**
 * Normalize an icons.json `hex` value to a 6-digit form suitable for parsing.
 * Accepts 3 or 6 digit hex (with or without leading #), strips alpha if present.
 * Returns null when the input is unparseable.
 */
function normalizeHex(raw: string): string | null {
  const stripped = raw.replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(stripped)) {
    // Expand 3-digit to 6-digit (#abc -> #aabbcc)
    return stripped.split("").map((c) => c + c).join("");
  }
  if (/^[0-9a-fA-F]{6}$/.test(stripped)) {
    return stripped;
  }
  if (/^[0-9a-fA-F]{8}$/.test(stripped)) {
    // Drop alpha channel
    return stripped.substring(0, 6);
  }
  return null;
}

/**
 * Returns true when the hex color is light enough that white text / white icon
 * would be hard to read. We switch to a dark-on-light layout in that case.
 * Uses raw sRGB values weighted by BT.709 coefficients - close enough for an
 * OG image; full gamma correction is unnecessary at this fidelity.
 */
function isLightHex(hex: string): boolean {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 180;
}

/**
 * Ensures an SVG string has a viewBox attribute so ImageResponse can render it.
 * If viewBox is missing but width/height are present, derives viewBox from them.
 * Returns null if the SVG cannot be made renderable.
 */
function ensureViewBox(svgContent: string): string | null {
  // Already has viewBox - good to go
  if (/viewBox\s*=/i.test(svgContent)) {
    return svgContent;
  }

  // Try to derive viewBox from width and height attributes
  const widthMatch = svgContent.match(/\bwidth\s*=\s*["']?([\d.]+)/i);
  const heightMatch = svgContent.match(/\bheight\s*=\s*["']?([\d.]+)/i);

  if (widthMatch && heightMatch) {
    const w = widthMatch[1];
    const h = heightMatch[1];
    // Insert viewBox after the opening <svg tag
    return svgContent.replace(/<svg\b/, `<svg viewBox="0 0 ${w} ${h}"`);
  }

  // Cannot make renderable
  return null;
}

/**
 * Tries to load the default SVG for a given slug from the filesystem.
 * Returns the raw SVG string or null if not found / not renderable.
 */
async function loadSvg(slug: string): Promise<string | null> {
  try {
    const svgPath = join(process.cwd(), "public", "icons", slug, "default.svg");
    const raw = await readFile(svgPath, "utf-8");
    return ensureViewBox(raw);
  } catch {
    return null;
  }
}

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const icon = getIconBySlug(slug);

  const title = icon?.title ?? slug;
  // Normalize to 6-digit hex; fall back to a neutral dark slate when the
  // entry has an empty, missing, or malformed hex (e.g., 3-digit, alpha).
  const rawHex = normalizeHex(icon?.hex ?? "") ?? "1a1a2e";
  const brandColor = `#${rawHex}`;

  const light = isLightHex(rawHex);

  // Background: use brand color if dark enough, otherwise a neutral dark slate
  const bgColor = light ? "#0f0f1a" : brandColor;
  const textColor = "#ffffff";
  const subtleColor = "rgba(255,255,255,0.45)";

  // Derive a muted version of the brand color for the card glow
  const glowColor = light ? brandColor : `${brandColor}33`;

  const svgContent = await loadSvg(slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: bgColor,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Radial glow behind icon */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            display: "flex",
          }}
        />

        {/* Icon area */}
        <div
          style={{
            width: "180px",
            height: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
            position: "relative",
          }}
        >
          {svgContent ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`}
              width={160}
              height={160}
              alt={title}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                width: "160px",
                height: "160px",
                borderRadius: "24px",
                background: "rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "64px",
                color: textColor,
              }}
            >
              {title.charAt(0)}
            </div>
          )}
        </div>

        {/* Brand title */}
        <div
          style={{
            fontSize: "52px",
            fontWeight: 700,
            color: textColor,
            letterSpacing: "-1px",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.1,
            marginBottom: "12px",
            display: "flex",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            color: subtleColor,
            display: "flex",
          }}
        >
          Free SVG icon on thesvg.org
        </div>

        {/* thesvg.org wordmark - bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            right: "44px",
            fontSize: "20px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.5px",
            display: "flex",
          }}
        >
          thesvg.org
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
