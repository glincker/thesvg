import { Suspense } from "react";
import { ArrowRight, FileCode, Globe, Search, Zap } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getCategoryCounts, getIconCount, getAllCategories } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { CodeBlock } from "@/components/api-docs/code-block";
import { TableOfContents } from "@/components/api-docs/table-of-contents";

export const metadata: Metadata = {
  title: "API Reference",
  description:
    "REST API and CDN documentation for theSVG. Fetch brand icons programmatically with no authentication required.",
};

const TOC_ITEMS = [
  { id: "quick-start", label: "Quick Start" },
  { id: "base-url", label: "Base URL" },
  { id: "cdn-direct", label: "CDN - Direct SVG" },
  { id: "search-list", label: "Search & List" },
  { id: "registry-detail", label: "Registry Detail" },
  { id: "jsdelivr", label: "CDN via jsDelivr" },
  { id: "usage-examples", label: "Usage Examples" },
  { id: "caching-limits", label: "Caching & Limits" },
];

async function EndpointCard({
  id,
  method,
  path,
  description,
  params,
  response,
  example,
  exampleLang,
  responseLang,
}: {
  id: string;
  method: string;
  path: string;
  description: string;
  params?: { name: string; type: string; description: string; required?: boolean }[];
  response: string;
  example: string;
  exampleLang?: string;
  responseLang?: string;
}) {
  return (
    <div id={id} className="scroll-mt-20 overflow-hidden rounded-xl border border-border/40 bg-card/30 dark:border-white/[0.06] dark:bg-white/[0.02]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/30 px-5 py-4 dark:border-white/[0.04]">
        <span className="rounded-md bg-green-500/10 px-2.5 py-1 font-mono text-xs font-bold text-green-600 dark:text-green-400">
          {method}
        </span>
        <code className="font-mono text-sm text-foreground">{path}</code>
      </div>

      <div className="space-y-5 p-5">
        <p className="text-sm text-muted-foreground">{description}</p>

        {/* Parameters */}
        {params && params.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              Parameters
            </h4>
            <div className="overflow-hidden rounded-lg border border-border/30 dark:border-white/[0.04]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20 dark:border-white/[0.04]">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {params.map((param) => (
                    <tr key={param.name} className="border-b border-border/20 last:border-0 dark:border-white/[0.03]">
                      <td className="px-4 py-2.5">
                        <code className="font-mono text-xs text-foreground">{param.name}</code>
                        {param.required && (
                          <span className="ml-1.5 text-[10px] font-medium text-orange-500">required</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground dark:bg-white/[0.04]">{param.type}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Example */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Example
          </h4>
          <CodeBlock language={exampleLang || "bash"} label="Request">{example}</CodeBlock>
        </div>

        {/* Response */}
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Response
          </h4>
          <CodeBlock language={responseLang || "json"}>{response}</CodeBlock>
        </div>
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  const categoryCounts = getCategoryCounts();
  const iconCount = getIconCount();
  const categories = getAllCategories();

  return (
    <Suspense>
      <SidebarShell categoryCounts={categoryCounts}>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="grid gap-10 xl:grid-cols-[1fr_180px] xl:gap-16">
            {/* Main content */}
            <div>
              {/* Header */}
              <div className="mb-10">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-green-200/50 bg-green-50/80 px-3 py-1 text-xs font-medium text-green-600 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
                  <Zap className="h-3 w-3" />
                  No authentication required
                </div>
                <h1 className="mb-2 text-2xl font-bold sm:text-3xl">API Reference</h1>
                <p className="max-w-2xl text-muted-foreground">
                  Fetch {iconCount.toLocaleString()} brand icons programmatically. Open API with CORS enabled,
                  cached responses, and multiple output formats.
                </p>
              </div>

              {/* Quick start */}
              <section id="quick-start" className="mb-12 scroll-mt-20">
                <h2 className="mb-4 text-lg font-semibold">Quick Start</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/40 bg-gradient-to-br from-orange-50/30 to-background p-4 dark:border-white/[0.06] dark:from-orange-500/5">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                      <Globe className="h-4 w-4" />
                    </div>
                    <h3 className="mb-1 text-sm font-semibold">CDN</h3>
                    <p className="text-xs text-muted-foreground">Direct URL to any icon SVG file</p>
                    <code className="mt-2 block truncate font-mono text-[11px] text-muted-foreground/80">
                      thesvg.org/icons/github/default.svg
                    </code>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-gradient-to-br from-blue-50/30 to-background p-4 dark:border-white/[0.06] dark:from-blue-500/5">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                      <Search className="h-4 w-4" />
                    </div>
                    <h3 className="mb-1 text-sm font-semibold">Search</h3>
                    <p className="text-xs text-muted-foreground">Find icons by name or category</p>
                    <code className="mt-2 block truncate font-mono text-[11px] text-muted-foreground/80">
                      thesvg.org/api/registry?q=google
                    </code>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-gradient-to-br from-purple-50/30 to-background p-4 dark:border-white/[0.06] dark:from-purple-500/5">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                      <FileCode className="h-4 w-4" />
                    </div>
                    <h3 className="mb-1 text-sm font-semibold">Registry</h3>
                    <p className="text-xs text-muted-foreground">Full metadata + inline SVG</p>
                    <code className="mt-2 block truncate font-mono text-[11px] text-muted-foreground/80">
                      thesvg.org/api/registry/github
                    </code>
                  </div>
                </div>
              </section>

              {/* Base URL */}
              <section id="base-url" className="mb-12 scroll-mt-20">
                <h2 className="mb-4 text-lg font-semibold">Base URL</h2>
                <CodeBlock language="url">https://thesvg.org</CodeBlock>
                <p className="mt-2 text-xs text-muted-foreground">
                  All endpoints return JSON with CORS headers enabled. Responses are cached for 24 hours.
                </p>
              </section>

              {/* Endpoints */}
              <section className="mb-12">
                <h2 className="mb-6 text-lg font-semibold">Endpoints</h2>
                <div className="space-y-6">
                  {/* CDN - Direct SVG */}
                  <EndpointCard
                    id="cdn-direct"
                    method="GET"
                    path="/icons/{slug}/{variant}.svg"
                    description="Serve an SVG file directly. Use in HTML img tags, CSS background-image, or any context that accepts image URLs."
                    params={[
                      { name: "slug", type: "string", description: "Icon identifier (e.g. github, vercel)", required: true },
                      { name: "variant", type: "string", description: "default, light, dark, mono, wordmark, wordmark-light, wordmark-dark", required: true },
                    ]}
                    exampleLang="bash"
                    example={`curl https://thesvg.org/icons/github/default.svg

# HTML
<img src="https://thesvg.org/icons/github/default.svg" alt="GitHub" />

# Markdown
![GitHub](https://thesvg.org/icons/github/default.svg)`}
                    responseLang="xml"
                    response={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M12 .297c-6.63 0-12 ..."/>
</svg>`}
                  />

                  {/* Search / List */}
                  <EndpointCard
                    id="search-list"
                    method="GET"
                    path="/api/registry"
                    description="Search and list icons. Returns a paginated index with slug, title, categories, and available variants."
                    params={[
                      { name: "q", type: "string", description: "Search query (fuzzy match on name, slug, aliases)" },
                      { name: "category", type: "string", description: `Filter by category (e.g. AI, Browser, Design). ${categories.length} categories available.` },
                      { name: "limit", type: "number", description: "Max results to return (default: 50, max: 200)" },
                    ]}
                    exampleLang="bash"
                    example={`# Search for icons
curl "https://thesvg.org/api/registry?q=google"

# Filter by category
curl "https://thesvg.org/api/registry?category=AI&limit=10"`}
                    response={`{
  "total": 212,
  "count": 10,
  "limit": 10,
  "icons": [
    {
      "slug": "openai",
      "title": "OpenAI",
      "categories": ["AI"],
      "variants": ["default", "light", "dark", "wordmark"]
    }
  ]
}`}
                  />

                  {/* Single icon - Registry */}
                  <EndpointCard
                    id="registry-detail"
                    method="GET"
                    path="/api/registry/{slug}"
                    description="Get full metadata for a single icon including inline SVG content for all variants."
                    params={[
                      { name: "slug", type: "string", description: "Icon identifier", required: true },
                      { name: "format", type: "string", description: "Set to 'raw' to return SVG with image/svg+xml content type" },
                    ]}
                    exampleLang="bash"
                    example={`# Full metadata + inline SVGs
curl "https://thesvg.org/api/registry/github"

# Raw SVG only
curl "https://thesvg.org/api/registry/github?format=raw"`}
                    response={`{
  "name": "github",
  "title": "GitHub",
  "categories": ["Software"],
  "hex": "181717",
  "url": "https://github.com",
  "variants": {
    "default": {
      "url": "https://thesvg.org/icons/github/default.svg",
      "svg": "<svg xmlns=\\"...\\" ...>...</svg>"
    },
    "light": { "url": "...", "svg": "..." },
    "dark": { "url": "...", "svg": "..." }
  },
  "cdn": {
    "jsdelivr": "https://cdn.jsdelivr.net/.../github/{variant}.svg",
    "direct": "https://thesvg.org/icons/github/{variant}.svg"
  }
}`}
                  />
                </div>
              </section>

              {/* CDN via jsDelivr */}
              <section id="jsdelivr" className="mb-12 scroll-mt-20">
                <h2 className="mb-4 text-lg font-semibold">CDN via jsDelivr</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  For maximum performance, use jsDelivr CDN which provides global edge caching.
                </p>
                <CodeBlock language="url" label="jsDelivr URL pattern">{`https://cdn.jsdelivr.net/gh/GLINCKER/thesvg@main/public/icons/{slug}/{variant}.svg

# Examples
https://cdn.jsdelivr.net/gh/GLINCKER/thesvg@main/public/icons/github/default.svg
https://cdn.jsdelivr.net/gh/GLINCKER/thesvg@main/public/icons/vercel/wordmark.svg`}</CodeBlock>
              </section>

              {/* Usage examples */}
              <section id="usage-examples" className="mb-12 scroll-mt-20">
                <h2 className="mb-4 text-lg font-semibold">Usage Examples</h2>
                <div className="space-y-4">
                  <CodeBlock language="typescript" label="JavaScript / TypeScript">{`// Fetch icon metadata
const res = await fetch("https://thesvg.org/api/registry/github");
const data = await res.json();
console.log(data.variants.default.svg);

// Search for icons
const search = await fetch("https://thesvg.org/api/registry?q=cloud&limit=5");
const results = await search.json();
results.icons.forEach(icon => console.log(icon.slug));`}</CodeBlock>

                  <CodeBlock language="tsx" label="React Component">{`function BrandIcon({ slug, variant = "default" }) {
  return (
    <img
      src={\`https://thesvg.org/icons/\${slug}/\${variant}.svg\`}
      alt={slug}
      width={24}
      height={24}
    />
  );
}

<BrandIcon slug="github" />
<BrandIcon slug="vercel" variant="wordmark" />`}</CodeBlock>

                  <CodeBlock language="html" label="HTML with Dark Mode">{`<!-- Direct embed -->
<img src="https://thesvg.org/icons/github/default.svg" alt="GitHub" width="24" />

<!-- With dark mode support -->
<picture>
  <source media="(prefers-color-scheme: dark)"
          srcset="https://thesvg.org/icons/github/dark.svg" />
  <img src="https://thesvg.org/icons/github/light.svg" alt="GitHub" width="24" />
</picture>`}</CodeBlock>
                </div>
              </section>

              {/* Rate limits & caching */}
              <section id="caching-limits" className="mb-12 scroll-mt-20">
                <h2 className="mb-4 text-lg font-semibold">Caching & Limits</h2>
                <div className="overflow-hidden rounded-lg border border-border/40 dark:border-white/[0.06]">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        ["Cache TTL", "24 hours (CDN + API)"],
                        ["CORS", "Enabled for all origins"],
                        ["Authentication", "None required"],
                        ["Max results per request", "200"],
                        ["Response format", "JSON (API) / SVG+XML (CDN)"],
                      ].map(([key, value], i) => (
                        <tr key={key} className={i < 4 ? "border-b border-border/20 dark:border-white/[0.03]" : ""}>
                          <td className="px-4 py-3 font-medium">{key}</td>
                          <td className="px-4 py-3 text-muted-foreground">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* CTA */}
              <div className="rounded-xl border border-border/40 bg-gradient-to-br from-card/50 to-muted/20 p-6 dark:border-white/[0.06] dark:from-white/[0.03] dark:to-white/[0.01]">
                <h3 className="mb-2 font-semibold">Build something cool?</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  If you build a tool, plugin, or integration using the API, open a PR to list it on the Extensions page.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/extensions"
                    className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                  >
                    View Extensions
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <a
                    href="https://github.com/GLINCKER/thesvg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent dark:border-white/[0.08]"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>

            {/* Right sidebar - TOC (desktop only) */}
            <TableOfContents items={TOC_ITEMS} />
          </div>
        </div>
      </SidebarShell>
    </Suspense>
  );
}
