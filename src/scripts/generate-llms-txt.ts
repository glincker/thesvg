/**
 * Generates public/llms.txt and public/llms-full.txt, the AI-crawler
 * discovery files (llmstxt.org convention), from the live site data so
 * they never drift out of sync with the actual icon count, category
 * list, and package list again.
 *
 * Run: npx tsx src/scripts/generate-llms-txt.ts
 *
 * Outputs:
 *   public/llms.txt       - short-form AI-crawler discovery file
 *   public/llms-full.txt  - full-form AI-crawler discovery file with
 *                           quick start snippets, schema, and stats
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { COLLECTIONS_LIST } from "../lib/collections-meta";

const ROOT = join(__dirname, "../..");
const ICONS_JSON = join(ROOT, "src/data/icons.json");
const PACKAGES_DIR = join(ROOT, "packages");
const PUBLIC_DIR = join(ROOT, "public");
const DATA_DIR = join(ROOT, "src/data");

interface IconEntry {
  slug: string;
  categories: string[];
  variants: Record<string, string | undefined>;
  guidelines?: string;
  collection: string;
}

interface PackageInfo {
  name: string;
  description: string;
  /** Count of entries in this package's own `dependencies` field (not peerDependencies). */
  dependencyCount: number;
}

// Preferred display order for packages. Anything discovered under
// packages/* but not listed here is appended alphabetically at the end,
// so a newly added package still shows up without editing this file.
const PACKAGE_ORDER = [
  "thesvg",
  "@thesvg/icons",
  "@thesvg/react",
  "@thesvg/cli",
  "@thesvg/mcp-server",
  "@thesvg/react-native",
  "@thesvg/vue",
  "@thesvg/svelte",
];

// Install/run command shown per package in the full reference table.
// Falls back to `npm i <name>` for anything not listed here.
const INSTALL_HINTS: Record<string, string> = {
  "@thesvg/cli": "npx @thesvg/cli add {slug}",
  "@thesvg/mcp-server": "npx @thesvg/mcp-server",
};

function getPackages(): PackageInfo[] {
  const dirs = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const packages: PackageInfo[] = [];
  for (const dir of dirs) {
    const pkgPath = join(PACKAGES_DIR, dir, "package.json");
    if (!existsSync(pkgPath)) continue;
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    if (pkg.private) continue;
    packages.push({
      name: pkg.name,
      description: pkg.description || "",
      dependencyCount: Object.keys(pkg.dependencies || {}).length,
    });
  }

  return packages.sort((a, b) => {
    const ai = PACKAGE_ORDER.indexOf(a.name);
    const bi = PACKAGE_ORDER.indexOf(b.name);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function installHint(name: string): string {
  return INSTALL_HINTS[name] || `npm i ${name}`;
}

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** Comma-joined category names, truncated with "and more" past `limit`. */
function formatCategoryList(categories: string[], limit: number): string {
  const shown = categories.slice(0, limit);
  return categories.length > limit ? `${shown.join(", ")}, and more.` : `${shown.join(", ")}.`;
}

/**
 * Package descriptions in packages/*\/package.json carry their own hand-written
 * icon counts (e.g. "6,500+ brand icons", "4000+ brand icons") that drift from
 * the live count just like the old hand-maintained llms files did. Swap any
 * such count for the one this script just computed from icons.json, so the
 * description never contradicts the rest of the document.
 */
function normalizeDescription(description: string, formattedIconCount: string): string {
  return description.replace(
    /[\d,]+\+\s*brand\s+(?:SVG\s+)?(?:icons?|SVGs?)/gi,
    `${formattedIconCount}+ icons`,
  );
}

/** Human-readable summary of how many packages ship with zero runtime dependencies. */
function summarizeRuntimeDeps(packages: PackageInfo[]): string {
  const zeroDepCount = packages.filter((pkg) => pkg.dependencyCount === 0).length;
  if (zeroDepCount === packages.length) {
    return `All ${packages.length} packages ship with zero runtime dependencies (framework peers like React, Vue, and Svelte are not counted)`;
  }
  return `${zeroDepCount} of ${packages.length} packages ship with zero runtime dependencies (framework peers like React, Vue, and Svelte are not counted); the rest declare a small, explicit dependency list, see the Packages table`;
}

function main() {
  const icons: IconEntry[] = JSON.parse(readFileSync(ICONS_JSON, "utf-8"));
  const iconCount = icons.length;
  const formattedIconCount = iconCount.toLocaleString("en-US");

  const categoryCounts = new Map<string, number>();
  for (const icon of icons) {
    for (const category of icon.categories) {
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
  }
  const categories = [...categoryCounts.keys()].sort((a, b) => a.localeCompare(b));

  let variantCount = 0;
  let guidelinesCount = 0;
  for (const icon of icons) {
    variantCount += Object.values(icon.variants).filter(Boolean).length;
    if (icon.guidelines) guidelinesCount++;
  }
  const formattedVariantCount = variantCount.toLocaleString("en-US");

  const collectionLabels = COLLECTIONS_LIST.map((c) => c.label);
  const collectionCount = collectionLabels.length;
  const collectionSummary = joinWithAnd(collectionLabels);

  const packages = getPackages();

  // Written to src/data/ (not read via fs at app runtime) so docs-content.ts
  // can pull the current release tag via a plain JSON import - bundler-safe
  // in both server and client code, unlike readFileSync. Regenerated (and
  // recommitted) on every build, same treatment as the other src/data/*.json
  // outputs.
  const thesvgPkgVersion: string = JSON.parse(
    readFileSync(join(PACKAGES_DIR, "thesvg/package.json"), "utf-8"),
  ).version;
  writeFileSync(join(DATA_DIR, "thesvg-version.json"), JSON.stringify({ version: thesvgPkgVersion }, null, 2) + "\n");

  const llmsTxt = buildLlmsTxt({
    formattedIconCount,
    collectionCount,
    collectionSummary,
    packages,
    categories,
  });
  writeFileSync(join(PUBLIC_DIR, "llms.txt"), llmsTxt);
  console.log(`  llms.txt: ${formattedIconCount} icons, ${categories.length} categories, ${packages.length} packages`);

  const llmsFullTxt = buildLlmsFullTxt({
    formattedIconCount,
    collectionCount,
    collectionSummary,
    packages,
    categories,
    formattedVariantCount,
    guidelinesCount,
  });
  writeFileSync(join(PUBLIC_DIR, "llms-full.txt"), llmsFullTxt);
  console.log(
    `  llms-full.txt: ${formattedIconCount} icons, ${categories.length} categories, ${packages.length} packages`,
  );

  console.log("llms.txt generation complete.");
}

function buildLlmsTxt(data: {
  formattedIconCount: string;
  collectionCount: number;
  collectionSummary: string;
  packages: PackageInfo[];
  categories: string[];
}): string {
  const { formattedIconCount, collectionCount, collectionSummary, packages, categories } = data;

  const packageLines = packages
    .map((pkg) => `- \`${pkg.name}\` - ${normalizeDescription(pkg.description, formattedIconCount)}`)
    .join("\n");
  const categoryList = formatCategoryList(categories, 35);

  return `# theSVG

> The largest open-source brand SVG icon library for developers, designers, and AI agents.

## About

theSVG provides ${formattedIconCount}+ SVG icons across ${collectionCount} collections: ${collectionSummary}. Each icon supports multi-variant rendering (color, mono, light, dark, wordmark). Available as npm packages, React components, CLI, REST API, CDN, and MCP server.

## Links

- Website: https://thesvg.org
- Docs & Guides: https://thesvg.org/docs
- Compare Libraries: https://thesvg.org/compare
- GitHub: https://github.com/glincker/thesvg
- npm: https://www.npmjs.com/package/thesvg
- Submit Icon: https://thesvg.org/submit
- Extensions: https://thesvg.org/extensions
- Contact: https://thesvg.org/contact
- Full LLM context: https://thesvg.org/llms-full.txt

## Packages

${packageLines}

## API

thesvg ships as a static site. There are no dynamic search endpoints; fetch the manifest once and filter client-side.

Base URL: https://thesvg.org

- \`GET /icons/{slug}/{variant}.svg\` - Direct SVG file (CDN)
- \`GET /api/registry.json\` - Full icon manifest (slug, title, aliases, categories, hex, url, license, variant keys)
- \`GET /api/categories.json\` - All categories with counts

No authentication required. CORS enabled. A gated, token-based API at api.thesvg.org is on the roadmap for advanced search and analytics.

## Icon Variants

Each icon can have up to 7 variants:
- \`default\` - Primary brand color (always present)
- \`mono\` - Single color, inherits text color
- \`light\` - White, for dark backgrounds
- \`dark\` - Black, for light backgrounds
- \`wordmark\` - Full text logo
- \`wordmarkLight\` - White text logo
- \`wordmarkDark\` - Dark text logo

## CDN Usage

\`\`\`
https://thesvg.org/icons/{slug}/{variant}.svg
https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/{slug}/{variant}.svg
\`\`\`

## Categories

${categories.length} categories including: ${categoryList}

## Legal

All brand icons are property of their respective owners. Provided for identification and development purposes under nominative fair use. See https://thesvg.org/legal and TRADEMARK.md.
`;
}

function buildLlmsFullTxt(data: {
  formattedIconCount: string;
  collectionCount: number;
  collectionSummary: string;
  packages: PackageInfo[];
  categories: string[];
  formattedVariantCount: string;
  guidelinesCount: number;
}): string {
  const {
    formattedIconCount,
    collectionCount,
    collectionSummary,
    packages,
    categories,
    formattedVariantCount,
    guidelinesCount,
  } = data;

  const packageRows = packages
    .map(
      (pkg) =>
        `| \`${pkg.name}\` | ${normalizeDescription(pkg.description, formattedIconCount)} | \`${installHint(pkg.name)}\` |`,
    )
    .join("\n");
  const categoryList = formatCategoryList(categories, 50);
  const runtimeDepsSummary = summarizeRuntimeDeps(packages);

  const docsLink = `Full human-readable framework guides, best practices, tricks, and FAQ: https://thesvg.org/docs`;

  return `# theSVG - Full LLM Context

> The largest open-source brand SVG icon library. ${formattedIconCount}+ SVG icons with multi-variant support.

## Overview

theSVG (thesvg.org) is a free, open-source library of ${formattedIconCount}+ SVG icons across ${collectionCount} collections: ${collectionSummary}. Every icon includes core metadata such as a name, hex color, categories, and license. Where present, icons also include a website URL, guideline links, and up to 7 SVG variants.

${docsLink}

## Quick Start

### Install via npm
\`\`\`bash
npm install thesvg
# or
npm install @thesvg/icons
# or
npm install @thesvg/react
\`\`\`

### Use via CDN (no install)
\`\`\`html
<img src="https://thesvg.org/icons/github/default.svg" width="24" alt="GitHub" />
\`\`\`

### Use via CLI
\`\`\`bash
npx @thesvg/cli add github
npx @thesvg/cli search "ai"
\`\`\`

### Use via API
\`\`\`bash
# fetch the manifest once, filter client-side
curl "https://thesvg.org/api/registry.json"
# direct SVG
curl "https://thesvg.org/icons/openai/default.svg"
\`\`\`

### Use via MCP Server (AI Assistants)
\`\`\`json
{
  "mcpServers": {
    "thesvg": {
      "command": "npx",
      "args": ["@thesvg/mcp-server"]
    }
  }
}
\`\`\`

## Packages

| Package | Description | Install |
|---------|-------------|---------|
${packageRows}

## Icon Data Schema

\`\`\`typescript
interface IconEntry {
  slug: string;            // kebab-case identifier (e.g. "github")
  title: string;           // display name (e.g. "GitHub")
  aliases: string[];       // alternative names
  hex: string;             // brand color without # (e.g. "181717")
  categories: string[];    // tags (e.g. ["Software", "Platform"])
  variants: {
    default: string;       // always present - URL path to SVG
    mono?: string;         // single color variant
    light?: string;        // white variant for dark backgrounds
    dark?: string;         // dark variant for light backgrounds
    wordmark?: string;     // full logo with text
    wordmarkLight?: string;
    wordmarkDark?: string;
  };
  license: string;         // e.g. "CC0-1.0", "MIT", "Fair Use"
  url?: string;            // brand website
  guidelines?: string;     // brand guidelines URL
}
\`\`\`

## API Reference

thesvg ships as a fully static site. There is no dynamic search endpoint. Fetch the manifest once and filter client-side.

Base URL: \`https://thesvg.org\`

### Direct SVG (CDN)
\`\`\`
GET /icons/{slug}/{variant}.svg
\`\`\`
Returns raw SVG with \`image/svg+xml\` content type, served from Cloudflare CDN.

Example: \`https://thesvg.org/icons/github/default.svg\`

### Icon Manifest
\`\`\`
GET /api/registry.json
\`\`\`
Returns the full manifest as \`{ total, icons: [...] }\`. Each icon has: \`slug\`, \`title\`, \`aliases\`, \`categories\`, \`hex\`, \`url\`, \`license\`, \`variants\` (array of variant keys). Use this to power search, filtering, and listing.

### Categories
\`\`\`
GET /api/categories.json
\`\`\`
Returns all categories with icon counts as \`{ categories: [{ name, count }, ...] }\`.

### jsDelivr Mirror

For high-traffic apps, use jsDelivr instead of \`thesvg.org\` directly:
\`\`\`
https://cdn.jsdelivr.net/gh/glincker/thesvg@main/src/data/icons.json
https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/{slug}/{variant}.svg
\`\`\`
\`src/data/icons.json\` is the source-of-truth manifest with all per-icon fields including \`dateAdded\` and \`collection\`.

### Roadmap

A gated, token-based API with relevance search and webhooks is planned at \`api.thesvg.org\`.

## Framework Examples

### React (CDN approach - recommended for performance)
\`\`\`tsx
function BrandIcon({ slug, size = 24 }: { slug: string; size?: number }) {
  return (
    <img
      src={\`https://thesvg.org/icons/\${slug}/default.svg\`}
      width={size}
      height={size}
      alt={slug}
    />
  );
}
\`\`\`

### React (Component approach)
\`\`\`tsx
import { Github } from "@thesvg/react";

<Github width={24} height={24} className="text-gray-900" />
\`\`\`

### Vue
\`\`\`vue
<template>
  <img :src="\`https://thesvg.org/icons/\${slug}/default.svg\`" :width="size" :alt="slug" />
</template>
\`\`\`

### HTML with dark mode
\`\`\`html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://thesvg.org/icons/github/light.svg" />
  <img src="https://thesvg.org/icons/github/dark.svg" alt="GitHub" width="24" />
</picture>
\`\`\`

### Markdown
\`\`\`markdown
![GitHub](https://thesvg.org/icons/github/default.svg)
\`\`\`

## Variants Explained

| Variant | Key | Best for |
|---------|-----|----------|
| Default | \`default\` | General use, brand's primary colors |
| Mono | \`mono\` | Monochrome UIs, inherits \`currentColor\` |
| Light | \`light\` | Dark backgrounds (white fill) |
| Dark | \`dark\` | Light backgrounds (dark fill) |
| Wordmark | \`wordmark\` | Full logo with brand text |
| Wordmark Light | \`wordmarkLight\` | Wordmark for dark backgrounds |
| Wordmark Dark | \`wordmarkDark\` | Wordmark for light backgrounds |

Not every icon has all variants. \`default\` is always present.

## Categories (${categories.length} total)

${categoryList}

## Statistics

- ${formattedIconCount}+ SVG icons across ${collectionCount} collections
- ${categories.length} categories
- ${formattedVariantCount}+ total SVG variants
- ${guidelinesCount.toLocaleString("en-US")} icons with verified brand guidelines links
- All icons have license metadata
- ${runtimeDepsSummary}

## License

MIT for the codebase and tooling. Brand icons are property of their respective trademark holders, provided under nominative fair use for identification purposes.

## Links

- Website: https://thesvg.org
- Docs & Guides: https://thesvg.org/docs
- GitHub: https://github.com/glincker/thesvg
- npm: https://www.npmjs.com/package/thesvg
- Compare Libraries: https://thesvg.org/compare
- Legal: https://thesvg.org/legal
- Submit Icon: https://thesvg.org/submit
- Contact: https://thesvg.org/contact
`;
}

main();
