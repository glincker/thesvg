import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getIconBySlug } from "@/lib/icons";

/**
 * Shared pieces for the generated social images. Everything here runs at
 * build time (static export), reading SVGs straight from public/.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;

const C = {
  bg: "#0a0a0b",
  text: "#fafafa",
  muted: "rgba(250,250,250,0.62)",
} as const;

function ensureViewBox(svg: string): string {
  if (/viewBox=/i.test(svg)) return svg;
  const w = /<svg[^>]*\swidth="([\d.]+)/i.exec(svg)?.[1];
  const h = /<svg[^>]*\sheight="([\d.]+)/i.exec(svg)?.[1];
  return w && h ? svg.replace(/<svg/i, `<svg viewBox="0 0 ${w} ${h}"`) : svg;
}

/** A public/ SVG as a data URI, or null when it cannot be read. */
export async function svgDataUri(path: string): Promise<string | null> {
  try {
    const raw = await readFile(join(process.cwd(), "public", path), "utf-8");
    return `data:image/svg+xml;base64,${Buffer.from(ensureViewBox(raw)).toString("base64")}`;
  } catch {
    return null;
  }
}

/** The logo for a slug on a light tile: the light variant when there is one. */
export async function logoUri(slug: string): Promise<string | null> {
  const icon = getIconBySlug(slug);
  if (!icon) return null;
  const rel = icon.variants.light || icon.variants.default;
  return svgDataUri(rel.replace(/^\//, ""));
}

interface FamilyCardProps {
  title: string;
  tagline: string;
  count: number;
  accents: [string, string];
  parentUri: string | null;
  logos: string[];
}

/** Per-family 1200x630 card: parent logo, tagline, and a row of flagships. */
export function FamilyCard({ title, tagline, count, accents, parentUri, logos }: FamilyCardProps) {
  const c = C;
  return (
    <div
      style={{
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        display: "flex",
        position: "relative",
        background: c.bg,
        color: c.text,
        fontFamily: "sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -200,
          left: -140,
          width: 700,
          height: 700,
          borderRadius: 700,
          background: `radial-gradient(circle, ${accents[0]}66 0%, ${accents[0]}00 70%)`,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -240,
          right: -120,
          width: 700,
          height: 700,
          borderRadius: 700,
          background: `radial-gradient(circle, ${accents[1]}55 0%, ${accents[1]}00 70%)`,
          display: "flex",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 26,
              background: "#ffffff",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            {parentUri ? (

              <img src={parentUri} width={58} height={58} alt="" style={{ objectFit: "contain" }} />
            ) : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 22, letterSpacing: 3, color: c.muted }}>
              BRAND FAMILY
            </div>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>
              {title}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.1, maxWidth: 900 }}>
            {tagline}
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 26, color: c.muted }}>
            {count} official SVG logos on thesvg.org
          </div>
        </div>

        <div style={{ display: "flex", gap: 18 }}>
          {logos.slice(0, 7).map((src, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 112,
                height: 112,
                borderRadius: 26,
                background: "#ffffff",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}
            >
              { }
              <img src={src} width={64} height={64} alt="" style={{ objectFit: "contain" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
