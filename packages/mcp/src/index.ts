#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Fuse from "fuse.js";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

// --- Constants ---

// Pinned to the package version so CDN-served SVGs match the bundled icons.json.
// Bump in lockstep with the version field below when refreshing the data set.
const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/glincker/thesvg@v0.6.0/public/icons";

const FETCH_TIMEOUT_MS = 10_000;

// --- Types ---

interface RawIcon {
  slug: string;
  title: string;
  aliases: string[];
  hex: string;
  categories: string[];
  variants: Record<string, string>;
  license: string;
  url?: string;
  dateAdded: string;
  collection: string;
  guidelines?: string;
}

interface IconEntry {
  slug: string;
  name: string;
  variants: string[];
  categories: string[];
  hex: string;
  license: string;
  url?: string;
  aliases: string[];
}

interface SearchResult {
  slug: string;
  name: string;
  variants: string[];
  categories: string[];
}

interface IconDetail {
  slug: string;
  name: string;
  variants: string[];
  categories: string[];
  hex: string;
  license: string;
  url?: string;
}

// --- Data loading ---

// icons.json is bundled at build time; no network dependency at startup.
// Tradeoff: the binary grows by ~2-3 MB but works offline and starts instantly.
// To refresh data, rebuild the package after pulling the latest icons.json.

let indexCache: IconEntry[] | null = null;
let fuseCache: Fuse<IconEntry> | null = null;

function loadIndex(): IconEntry[] {
  if (indexCache) return indexCache;

  // icons.json is copied into the same directory as index.js at build time.
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const require = createRequire(import.meta.url);
  const iconsPath = path.join(__dirname, "icons.json");
  const raw = require(iconsPath) as RawIcon[];

  indexCache = raw.map((icon) => ({
    slug: icon.slug,
    name: icon.title,
    variants: Object.keys(icon.variants),
    categories: icon.categories ?? [],
    hex: icon.hex,
    license: icon.license,
    url: icon.url,
    aliases: icon.aliases ?? [],
  }));

  return indexCache;
}

function getFuse(): Fuse<IconEntry> {
  if (fuseCache) return fuseCache;

  const icons = loadIndex();
  fuseCache = new Fuse(icons, {
    keys: [
      { name: "slug", weight: 0.4 },
      { name: "name", weight: 0.4 },
      { name: "aliases", weight: 0.2 },
    ],
    threshold: 0.35,
    includeScore: true,
  });

  return fuseCache;
}

// --- Helpers ---

function buildCdnUrl(slug: string, variant: string): string {
  return `${CDN_BASE}/${encodeURIComponent(slug)}/${encodeURIComponent(variant)}.svg`;
}

function findIcon(slug: string): IconEntry | undefined {
  return loadIndex().find((i) => i.slug === slug);
}

// --- Search ---

export function searchIcons(query: string, limit = 20): SearchResult[] {
  const fuse = getFuse();
  const results = fuse.search(query, { limit });
  return results.map((r) => ({
    slug: r.item.slug,
    name: r.item.name,
    variants: r.item.variants,
    categories: r.item.categories,
  }));
}

// --- MCP Server ---

const server = new McpServer({
  name: "thesvg",
  version: "0.6.0",
});

// Tool: search_icons
server.tool(
  "search_icons",
  "Search for brand SVG icons from thesvg.org by name or slug. Returns matching icons with slug, name, variants, and categories. Use get_icon or get_icon_url to retrieve the actual SVG.",
  {
    query: z.string().describe("Brand name or partial slug to search for"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(20)
      .describe("Maximum number of results (1-100, default 20)"),
  },
  async ({ query, limit }) => {
    try {
      const results = searchIcons(query, limit);

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No icons found matching "${query}".`,
            },
          ],
        };
      }

      const lines = [
        `Found ${results.length} icon${results.length === 1 ? "" : "s"} for "${query}":`,
        "",
        ...results.map(
          (icon) =>
            `- **${icon.name}** (slug: \`${icon.slug}\`)` +
            (icon.variants.length > 0
              ? ` | variants: ${icon.variants.join(", ")}`
              : "") +
            (icon.categories.length > 0
              ? ` | categories: ${icon.categories.join(", ")}`
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

// Tool: get_icon
server.tool(
  "get_icon",
  "Fetch the raw SVG content for a specific brand icon from the jsDelivr CDN. Returns SVG markup, metadata, and the CDN URL.",
  {
    slug: z
      .string()
      .describe(
        "Icon slug identifier (e.g. 'github', 'stripe', 'openai'). Use search_icons to find slugs."
      ),
    variant: z
      .string()
      .optional()
      .default("default")
      .describe(
        "Icon variant to fetch: 'default', 'mono', 'light', 'dark', 'wordmark', 'color'. Defaults to 'default'. Use list_variants to see what a specific icon supports."
      ),
  },
  async ({ slug, variant }) => {
    try {
      const icon = findIcon(slug);
      if (!icon) {
        return {
          content: [
            {
              type: "text",
              text: `Icon not found: "${slug}". Use search_icons to find the correct slug.`,
            },
          ],
          isError: true,
        };
      }

      const resolvedVariant = variant ?? "default";
      const cdnUrl = buildCdnUrl(slug, resolvedVariant);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(cdnUrl, { signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Could not fetch SVG for "${slug}" variant "${resolvedVariant}" (${res.status}). Available variants: ${icon.variants.join(", ")}.`,
            },
          ],
          isError: true,
        };
      }

      const svg = await res.text();

      const lines = [
        `# ${icon.name}`,
        "",
        `**Slug**: \`${icon.slug}\``,
        `**Variant**: ${resolvedVariant}`,
        `**CDN URL**: ${cdnUrl}`,
        icon.categories.length > 0
          ? `**Categories**: ${icon.categories.join(", ")}`
          : null,
        `**Brand color**: #${icon.hex}`,
        `**Available variants**: ${icon.variants.join(", ")}`,
        icon.url ? `**Website**: ${icon.url}` : null,
        "",
        "```svg",
        svg,
        "```",
      ].filter((line): line is string => line !== null);

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

// Tool: list_variants
server.tool(
  "list_variants",
  "List all available variants for a specific brand icon. Variants may include: default, mono, light, dark, wordmark, wordmarkLight, wordmarkDark, color.",
  {
    slug: z
      .string()
      .describe(
        "Icon slug identifier (e.g. 'github', 'openai'). Use search_icons to find slugs."
      ),
  },
  async ({ slug }) => {
    try {
      const icon = findIcon(slug);
      if (!icon) {
        return {
          content: [
            {
              type: "text",
              text: `Icon not found: "${slug}". Use search_icons to find the correct slug.`,
            },
          ],
          isError: true,
        };
      }

      const lines = [
        `**${icon.name}** (\`${icon.slug}\`) has ${icon.variants.length} variant${icon.variants.length === 1 ? "" : "s"}:`,
        "",
        ...icon.variants.map(
          (v) => `- \`${v}\` -- ${buildCdnUrl(slug, v)}`
        ),
      ];

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [
          { type: "text", text: `Error listing variants: ${message}` },
        ],
        isError: true,
      };
    }
  }
);

// Tool: get_icon_url
server.tool(
  "get_icon_url",
  "Get a jsDelivr CDN URL for a brand icon without fetching the SVG content. Use this to embed icons in HTML, Markdown, Notion, Webflow, or any img tag. Cheaper than get_icon when you only need the URL.",
  {
    slug: z
      .string()
      .describe(
        "Icon slug identifier (e.g. 'github', 'stripe', 'openai'). Use search_icons to find slugs."
      ),
    variant: z
      .string()
      .optional()
      .default("default")
      .describe(
        "Icon variant: 'default', 'mono', 'light', 'dark', 'wordmark', 'color'. Defaults to 'default'."
      ),
  },
  async ({ slug, variant }) => {
    try {
      const icon = findIcon(slug);
      if (!icon) {
        return {
          content: [
            {
              type: "text",
              text: `Icon not found: "${slug}". Use search_icons to find the correct slug.`,
            },
          ],
          isError: true,
        };
      }

      const resolvedVariant = variant ?? "default";
      if (!icon.variants.includes(resolvedVariant)) {
        return {
          content: [
            {
              type: "text",
              text: `Variant "${resolvedVariant}" not available for "${slug}". Available variants: ${icon.variants.join(", ")}.`,
            },
          ],
          isError: true,
        };
      }

      const url = buildCdnUrl(slug, resolvedVariant);
      const name = icon.name;

      return {
        content: [
          {
            type: "text",
            text: [
              `**CDN URL** for \`${slug}\` (variant: ${resolvedVariant}):`,
              "",
              url,
              "",
              "Example usage:",
              "```html",
              `<img src="${url}" alt="${name}" width="32" height="32" />`,
              "```",
              "",
              "```markdown",
              `![${name}](${url})`,
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

// Tool: list_categories
server.tool(
  "list_categories",
  "List all icon categories available in thesvg.org library with icon counts. Use this to discover what categories exist in the library and to inform follow-up search_icons queries.",
  {},
  async () => {
    try {
      const icons = loadIndex();
      const counts = new Map<string, number>();
      for (const icon of icons) {
        for (const cat of icon.categories) {
          counts.set(cat, (counts.get(cat) ?? 0) + 1);
        }
      }

      const sorted = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

      if (sorted.length === 0) {
        return {
          content: [{ type: "text", text: "No categories found." }],
        };
      }

      const lines = [
        `${sorted.length} categories across ${icons.length} icons:`,
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
          { type: "text", text: `Error listing categories: ${message}` },
        ],
        isError: true,
      };
    }
  }
);

// --- Start ---

const transport = new StdioServerTransport();
await server.connect(transport);
