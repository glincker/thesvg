import type { MetadataRoute } from "next";

// `force-static` is required when next.config has `output: "export"`.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "thesvg - Open SVG Brand Library",
    short_name: "thesvg",
    description: "Search, copy, and ship 6,400+ brand SVG icons.",
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
        src: "/favicon-16.png",
        sizes: "16x16",
        type: "image/png",
      },
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
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
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
