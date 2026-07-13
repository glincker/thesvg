import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getAllCategories, getIconsByCategory } from "@/lib/icons";
import { slugifyCategory } from "@/lib/categories";

// force-static is required for `output: "export"` builds (same reason as
// the icon/[slug] and category/google-2026 OG images: this route has no
// static params of its own to infer from, so Next treats it as dynamic
// unless told otherwise).
export const dynamic = "force-static";
export const runtime = "nodejs";
export const alt = "Category SVG icons on thesvg.org";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ slug: string }>;
}

function buildSlugMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const cat of getAllCategories()) {
    const slug = slugifyCategory(cat);
    if (!slug) continue;
    if (map.has(slug)) continue;
    map.set(slug, cat);
  }
  return map;
}

export function generateStaticParams() {
  return [...buildSlugMap().keys()].map((slug) => ({ slug }));
}

async function loadSvg(slug: string): Promise<string | null> {
  try {
    const segments = ["public", "icons", slug, "default.svg"];
    const p = segments.reduce((acc, s) => join(acc, s), process.cwd());
    return await readFile(p, "utf-8");
  } catch {
    return null;
  }
}

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const category = buildSlugMap().get(slug) ?? slug;
  const icons = getIconsByCategory(category);
  const hero = icons.slice(0, 6);
  const heroSvgs = await Promise.all(
    hero.map(async (icon) => ({ slug: icon.slug, svg: await loadSvg(icon.slug) })),
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
          background: "linear-gradient(180deg, #0b0d12 0%, #14171f 100%)",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* soft neutral glow behind the icon row */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
            display: "flex",
          }}
        />

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
            marginBottom: 28,
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#4285f4", display: "flex" }} />
          {" "}Category
        </div>

        {/* category title */}
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: -2,
            lineHeight: 1.1,
            color: "#ffffff",
            marginBottom: 40,
            textAlign: "center",
            maxWidth: 1000,
          }}
        >
          {category} SVG Icons
        </div>

        {/* icon montage */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: "20px 28px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 32,
          }}
        >
          {heroSvgs.map(({ slug: iconSlug, svg }) =>
            svg ? (

              <img
                key={iconSlug}
                src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`}
                width={110}
                height={110}
                alt=""
                style={{ objectFit: "contain" }}
              />
            ) : (
              <div
                key={iconSlug}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 20,
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
          <div style={{ display: "flex" }}>Free · Open Source</div>
          <div style={{ display: "flex" }}>·</div>
          <div style={{ display: "flex" }}>thesvg.org</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
