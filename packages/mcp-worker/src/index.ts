// Remote HTTPS MCP server for thesvg.org, running as a Cloudflare Worker.
//
// This is the HTTPS-reachable sibling of packages/mcp (stdio-only, used by
// Claude Desktop/Cursor/Claude Code via `npx`). ChatGPT Apps connectors and
// Claude.ai's web "custom connectors" both require a server reachable over
// HTTPS rather than stdio, hence a separate Worker deployment.
//
// Runtime approach: Cloudflare deprecated the Durable-Object-backed
// `McpAgent` class in Agents SDK v0.20.0 (2026-07-27) in favor of a
// stateless `createMcpHandler(factory)` built on MCP SDK v2
// (`@modelcontextprotocol/server`, which ships a `workerd` export condition
// specifically for the Workers runtime -- no `nodejs_compat` flag needed).
// Source: developers.cloudflare.com/agents/model-context-protocol/guides/migrate-to-mcp-sdk-v2/
// and developers.cloudflare.com/changelog/post/2026-07-27-agents-sdk-v0.20.0-mcp-sdk-v2/.
// A stateless handler is also the right fit here: every request rebuilds the
// same server from the same bundled icons.json, there's no per-session state
// to keep in a Durable Object.
//
// This package intentionally does not share code with packages/mcp -- the
// stdio and HTTP servers are allowed to drift (accepted tradeoff, see task).

import { createMcpHandler } from "agents/mcp/server";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { loadIcons, searchIcons, buildIconUrl, listCategories } from "./icons-data";
import {
  SEARCH_WIDGET_TEMPLATE_URI,
  widgetDescriptorMeta,
  toWidgetIcons,
  buildSearchWidgetHtml,
} from "./widget";
import {
  checkRateLimit,
  clientKeyFromRequest,
  type RateLimitBinding,
} from "./rate-limit";
import { textResult, errorResult, findIconOrNotFound } from "./tool-helpers";
import { slugAndVariantSchema } from "./tool-schemas";

interface Env {
  // Optional: Cloudflare's native Rate Limiting binding. See
  // wrangler.jsonc and rate-limit.ts -- absent by default, no-ops when unset.
  RATE_LIMITER?: RateLimitBinding;
}

const FETCH_TIMEOUT_MS = 10_000;

function createServer(): McpServer {
  const server = new McpServer({
    name: "thesvg",
    version: "0.1.0",
  });

  // --- Resource: search_icons widget (Apps SDK) ---
  server.registerResource(
    "icon-search-results",
    SEARCH_WIDGET_TEMPLATE_URI,
    {
      title: "Icon search results",
      description: "Grid of matched brand icon thumbnails",
      mimeType: "text/html+skybridge",
      _meta: widgetDescriptorMeta(),
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: buildSearchWidgetHtml(),
        },
      ],
    })
  );

  // --- Tool: search_icons (the only tool with a UI widget) ---
  server.registerTool(
    "search_icons",
    {
      title: "Search icons",
      description:
        "Search for brand SVG icons from thesvg.org by name, slug, or alias. Returns matching icons with slug, name, variants, and categories, plus a visual thumbnail grid. Use get_icon or get_icon_url to retrieve the actual SVG.",
      inputSchema: z.object({
        query: z.string().describe("Brand name or partial slug to search for"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .default(20)
          .describe("Maximum number of results (1-100, default 20)"),
      }),
      _meta: widgetDescriptorMeta(),
    },
    async ({ query, limit }) => {
      const results = searchIcons(query, limit);

      if (results.length === 0) {
        return {
          ...textResult(`No icons found matching "${query}".`),
          structuredContent: { query, count: 0, icons: [] },
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
        ...textResult(lines.join("\n")),
        structuredContent: {
          query,
          count: results.length,
          icons: toWidgetIcons(results, buildIconUrl),
        },
      };
    }
  );

  // --- Tool: get_icon ---
  server.registerTool(
    "get_icon",
    {
      title: "Get icon SVG",
      description:
        "Fetch the raw SVG content for a specific brand icon from thesvg.org. Returns SVG markup, metadata, and the CDN URL.",
      inputSchema: slugAndVariantSchema(
        "Icon variant to fetch: 'default', 'mono', 'light', 'dark', 'wordmark', 'color'. Defaults to 'default'. Use list_variants to see what a specific icon supports."
      ),
    },
    async ({ slug, variant }) => {
      const found = findIconOrNotFound(slug);
      if (!found.ok) return found.result;
      const icon = found.icon;

      const resolvedVariant = variant ?? "default";
      const url = buildIconUrl(slug, resolvedVariant);

      let svg: string;
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!res.ok) {
          return errorResult(
            `Could not fetch SVG for "${slug}" variant "${resolvedVariant}" (${res.status}). Available variants: ${icon.variants.join(", ")}.`
          );
        }
        svg = await res.text();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return errorResult(`Error fetching icon: ${message}`);
      }

      const lines = [
        `# ${icon.name}`,
        "",
        `**Slug**: \`${icon.slug}\``,
        `**Variant**: ${resolvedVariant}`,
        `**CDN URL**: ${url}`,
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

      return textResult(lines.join("\n"));
    }
  );

  // --- Tool: list_variants ---
  server.registerTool(
    "list_variants",
    {
      title: "List icon variants",
      description:
        "List all available variants for a specific brand icon. Variants may include: default, mono, light, dark, wordmark, wordmarkLight, wordmarkDark, color.",
      inputSchema: z.object({
        slug: z
          .string()
          .describe(
            "Icon slug identifier (e.g. 'github', 'openai'). Use search_icons to find slugs."
          ),
      }),
    },
    async ({ slug }) => {
      const found = findIconOrNotFound(slug);
      if (!found.ok) return found.result;
      const icon = found.icon;

      const lines = [
        `**${icon.name}** (\`${icon.slug}\`) has ${icon.variants.length} variant${icon.variants.length === 1 ? "" : "s"}:`,
        "",
        ...icon.variants.map((v) => `- \`${v}\` -- ${buildIconUrl(slug, v)}`),
      ];

      return textResult(lines.join("\n"));
    }
  );

  // --- Tool: get_icon_url ---
  server.registerTool(
    "get_icon_url",
    {
      title: "Get icon CDN URL",
      description:
        "Get a thesvg.org CDN URL for a brand icon without fetching the SVG content. Use this to embed icons in HTML, Markdown, Notion, Webflow, or any img tag. Cheaper than get_icon when you only need the URL.",
      inputSchema: slugAndVariantSchema(
        "Icon variant: 'default', 'mono', 'light', 'dark', 'wordmark', 'color'. Defaults to 'default'."
      ),
    },
    async ({ slug, variant }) => {
      const found = findIconOrNotFound(slug);
      if (!found.ok) return found.result;
      const icon = found.icon;

      const resolvedVariant = variant ?? "default";
      if (!icon.variants.includes(resolvedVariant)) {
        return errorResult(
          `Variant "${resolvedVariant}" not available for "${slug}". Available variants: ${icon.variants.join(", ")}.`
        );
      }

      const url = buildIconUrl(slug, resolvedVariant);

      return textResult(
        [
          `**CDN URL** for \`${slug}\` (variant: ${resolvedVariant}):`,
          "",
          url,
          "",
          "Example usage:",
          "```html",
          `<img src="${url}" alt="${icon.name}" width="32" height="32" />`,
          "```",
          "",
          "```markdown",
          `![${icon.name}](${url})`,
          "```",
        ].join("\n")
      );
    }
  );

  // --- Tool: list_categories ---
  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description:
        "List all icon categories available in thesvg.org library with icon counts. Use this to discover what categories exist in the library and to inform follow-up search_icons queries.",
      inputSchema: z.object({}),
    },
    async () => {
      const categories = listCategories();
      const total = loadIcons().length;

      if (categories.length === 0) {
        return textResult("No categories found.");
      }

      const lines = [
        `${categories.length} categories across ${total} icons:`,
        "",
        ...categories.map(
          (cat) => `- **${cat.name}** - ${cat.count} icon${cat.count === 1 ? "" : "s"}`
        ),
      ];

      return textResult(lines.join("\n"));
    }
  );

  return server;
}

const mcpHandler = createMcpHandler(createServer, { route: "/mcp" });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({ name: "thesvg-mcp", status: "ok", mcpEndpoint: "/mcp" }),
        { headers: { "content-type": "application/json" } }
      );
    }

    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
      const clientKey = clientKeyFromRequest(request);
      const { allowed } = await checkRateLimit(env, clientKey);
      if (!allowed) {
        return new Response(
          JSON.stringify({
            error: "rate_limited",
            message: "Too many requests. Please slow down and try again shortly.",
          }),
          {
            status: 429,
            headers: { "content-type": "application/json", "retry-after": "60" },
          }
        );
      }
    }

    return mcpHandler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
