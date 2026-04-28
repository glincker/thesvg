import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      // Explicit allow for AI crawlers to find the machine-readable index at /llms.txt
      {
        userAgent: [
          "GPTBot",
          "Claude-Web",
          "Amazonbot",
          "PerplexityBot",
          "anthropic-ai",
        ],
        allow: ["/", "/llms.txt"],
      },
    ],
    sitemap: "https://thesvg.org/sitemap.xml",
  };
}
