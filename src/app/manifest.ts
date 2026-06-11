import type { MetadataRoute } from "next";

/**
 * PWA manifest for Catalog 2026. Replaces the static `public/manifest.json`
 * by emitting at build time through Next's metadata route — keeps icon
 * paths, theme colors, and shortcuts in code review instead of static JSON.
 *
 * Maskable icons reuse the existing `/apple-touch-icon.png` (180x180) and
 * `/favicon-32.png` — both already shipped. When the dedicated PWA PNGs
 * land (192/512), wire them in here.
 *
 * `dynamic = "force-static"` is required when `next.config.ts` has
 * `output: "export"` — the manifest is emitted once at build time.
 */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "thesvg - Open SVG Brand Library",
    short_name: "thesvg",
    description: "Search, copy, and ship 6,000+ brand SVG icons.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    categories: ["developer", "design", "productivity", "utilities"],
    lang: "en",
    icons: [
      {
        src: "/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo-transparent.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Search icons",
        short_name: "Search",
        description: "Open the icon search sheet",
        url: "/?action=search",
        icons: [{ src: "/favicon-32.png", sizes: "32x32" }],
      },
      {
        name: "Submit an icon",
        short_name: "Submit",
        description: "Submit a new brand icon",
        url: "/submit",
        icons: [{ src: "/favicon-32.png", sizes: "32x32" }],
      },
      {
        name: "Recents",
        short_name: "Recents",
        description: "Your recently viewed icons",
        url: "/recents",
        icons: [{ src: "/favicon-32.png", sizes: "32x32" }],
      },
    ],
  };
}
