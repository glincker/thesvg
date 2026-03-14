#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = "https://thesvg.org/api";
const CDN_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public";

// --- Types ---

interface RegistryIcon {
  slug: string;
  title: string;
  categories: string[];
  variants: string[];
}

interface RegistryListResponse {
  total: number;
  count: number;
  limit: number;
  icons: RegistryIcon[];
}

interface VariantDetail {
  url: string;
  svg: string;
}

interface IconDetail {
  name: string;
  title: string;
  categories: string[];
  hex: string;
  url?: string;
  variants: Record<string, VariantDetail>;
  cdn: {
    jsdelivr: string;
    direct: string;
  };
}

interface Category {
  name: string;
  count: number;
}

interface CategoriesResponse {
  categories: Category[];
}

// --- Helpers ---

async function fetchRegistry(query?: string, limit = 50): Promise<RegistryIcon[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("limit", String(limit));
  const url = `${BASE_URL}/registry${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Registry fetch failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as RegistryListResponse;
  return data.icons;
}

async function fetchIconDetail(slug: string): Promise<IconDetail> {
  const res = await fetch(`${BASE_URL}/registry/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Icon not found: "${slug}"`);
    }
    throw new Error(`Icon fetch failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as IconDetail;
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE_URL}/categories`);
  if (!res.ok) {
    throw new Error(`Categories fetch failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as CategoriesResponse;
  return data.categories;
}

function buildIconUrl(slug: string, variant: string, useCdn: boolean): string {
  const variantFile = variant === "default" ? "default" : variant;
  if (useCdn) {
    return `${CDN_BASE}/icons/${slug}/${variantFile}.svg`;
  }
  return `https://thesvg.org/icons/${slug}/${variantFile}.svg`;
}

// --- MCP Server ---

const server = new McpServer({
  name: "thesvg",
  version: "0.1.0",
});

server.tool(
  "search_icons",
  "Search for brand SVG icons from thesvg.org by name, slug, or category. Returns a list of matching icons with their slugs, titles, and categories.",
  {
    query: z.string().describe("Search term to filter icons by name or slug"),
    category: z
      .string()
      .optional()
      .describe("Filter by category slug (e.g. 'social', 'tech')"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(20)
      .describe("Maximum number of results to return (1-100, default 20)"),
  },
  async ({ query, category, limit }) => {
    try {
      const icons = await fetchRegistry(query, limit ?? 20);

      let results = icons;
      if (category) {
        const cat = category.toLowerCase().trim();
        results = results.filter((icon) =>
          icon.categories.some((c) => c.toLowerCase() === cat)
        );
      }

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No icons found matching "${query}"${category ? ` in category "${category}"` : ""}.`,
            },
          ],
        };
      }

      const lines = [
        `Found ${results.length} icon${results.length === 1 ? "" : "s"}:`,
        "",
        ...results.map(
          (icon) =>
            `- **${icon.title}** (slug: \`${icon.slug}\`)` +
            (icon.categories.length > 0
              ? ` — categories: ${icon.categories.join(", ")}`
              : "")
        ),
      ];

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text", text: `Error searching icons: ${message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_icon",
  "Fetch a specific brand SVG icon from thesvg.org by slug. Returns the raw SVG markup inline along with metadata.",
  {
    slug: z
      .string()
      .describe("Icon slug identifier (e.g. 'github', 'stripe', 'openai')"),
    variant: z
      .string()
      .optional()
      .default("default")
      .describe(
        "Icon variant to fetch (e.g. 'default', 'dark', 'light'). Defaults to 'default'."
      ),
  },
  async ({ slug, variant }) => {
    try {
      const icon = await fetchIconDetail(slug);

      const resolvedVariant = variant ?? "default";
      const availableVariants = Object.keys(icon.variants);
      const variantData = icon.variants[resolvedVariant] || icon.variants["default"];
      const svgContent = variantData?.svg || "SVG content not available";

      const lines = [
        `# ${icon.title}`,
        "",
        `**Slug**: \`${icon.name}\``,
        `**Categories**: ${icon.categories.length > 0 ? icon.categories.join(", ") : "none"}`,
        `**Brand color**: #${icon.hex}`,
        availableVariants.length > 0
          ? `**Available variants**: ${availableVariants.join(", ")}`
          : "",
        icon.url ? `**Website**: ${icon.url}` : "",
        "",
        `**Variant**: ${resolvedVariant}`,
        `**Direct URL**: ${variantData?.url || "N/A"}`,
        "",
        "```svg",
        svgContent,
        "```",
      ].filter((line) => line !== undefined);

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text", text: `Error fetching icon: ${message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_icon_url",
  "Get a direct URL for a brand SVG icon from thesvg.org. Useful when you need a URL to embed in HTML or Markdown rather than the raw SVG content.",
  {
    slug: z
      .string()
      .describe("Icon slug identifier (e.g. 'github', 'stripe', 'openai')"),
    variant: z
      .string()
      .optional()
      .default("default")
      .describe("Icon variant (e.g. 'default', 'dark', 'light')"),
    cdn: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        "Use the CDN URL for better performance (default: true). Set to false for the direct API URL."
      ),
  },
  async ({ slug, variant, cdn }) => {
    try {
      const resolvedVariant = variant ?? "default";
      const useCdn = cdn !== false;
      const url = buildIconUrl(slug, resolvedVariant, useCdn);

      return {
        content: [
          {
            type: "text",
            text: [
              `**Icon URL** for \`${slug}\` (variant: ${resolvedVariant}):`,
              "",
              url,
              "",
              `Source: ${useCdn ? "CDN" : "API"}`,
              "",
              "Example usage:",
              `\`\`\`html`,
              `<img src="${url}" alt="${slug}" width="32" height="32" />`,
              "```",
            ].join("\n"),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [
          { type: "text", text: `Error building icon URL: ${message}` },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "list_categories",
  "List all available icon categories from thesvg.org with their icon counts. Use this to discover what categories exist before searching.",
  {},
  async () => {
    try {
      const categories = await fetchCategories();

      if (categories.length === 0) {
        return {
          content: [{ type: "text", text: "No categories found." }],
        };
      }

      const sorted = [...categories].sort((a, b) => b.count - a.count);

      const lines = [
        `${sorted.length} categories available:`,
        "",
        ...sorted.map(
          (cat) =>
            `- **${cat.name}** - ${cat.count} icon${cat.count === 1 ? "" : "s"}`
        ),
      ];

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [
          { type: "text", text: `Error fetching categories: ${message}` },
        ],
        isError: true,
      };
    }
  }
);

// --- Start ---

const transport = new StdioServerTransport();
await server.connect(transport);
