/**
 * Generates static JSON API files in public/api/ for the Raycast extension
 * and any other consumers that need a REST-like interface.
 *
 * Run: npx tsx src/scripts/generate-api.ts
 *
 * Outputs:
 *   public/api/registry.json      - all icons (slug, title, aliases, categories, hex, url, variant keys)
 *   public/api/categories.json    - category list with counts
 *   public/api/icons-full.json    - full icon manifest (all fields) for client-side lazy loading
 *
 * Note: Individual per-icon detail files are NOT generated to stay within
 * Cloudflare Pages' 20,000 file deployment limit. Extensions should fetch
 * SVG content directly from /icons/{slug}/{variant}.svg.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, copyFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "../..");
const ICONS_JSON = join(ROOT, "src/data/icons.json");
const PUBLIC_API = join(ROOT, "public/api");

interface IconEntry {
  slug: string;
  title: string;
  aliases: string[];
  hex: string;
  categories: string[];
  variants: Record<string, string | undefined>;
  license: string;
  url?: string;
  dateAdded?: string;
  collection: string;
  collectionVersion?: string;
  collectionMeta?: Record<string, string | undefined>;
}

function main() {
  const icons: IconEntry[] = JSON.parse(readFileSync(ICONS_JSON, "utf-8"));

  // Clean previous output and ensure directory
  if (existsSync(PUBLIC_API)) {
    rmSync(PUBLIC_API, { recursive: true });
  }
  mkdirSync(PUBLIC_API, { recursive: true });

  // --- registry.json (includes enough data for extensions to work without per-icon files) ---
  const registryList = {
    total: icons.length,
    icons: icons.map((icon) => ({
      slug: icon.slug,
      title: icon.title,
      aliases: icon.aliases,
      categories: icon.categories,
      hex: icon.hex,
      url: icon.url || null,
      license: icon.license,
      variants: Object.keys(icon.variants).filter((k) => icon.variants[k]),
    })),
  };
  writeFileSync(join(PUBLIC_API, "registry.json"), JSON.stringify(registryList));
  console.log(`  registry.json: ${icons.length} icons`);

  // --- categories.json ---
  const counts = new Map<string, number>();
  for (const icon of icons) {
    for (const c of icon.categories) {
      counts.set(c, (counts.get(c) || 0) + 1);
    }
  }
  const categories = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  writeFileSync(
    join(PUBLIC_API, "categories.json"),
    JSON.stringify({ categories }),
  );
  console.log(`  categories.json: ${categories.length} categories`);

  // --- icons-full.json (full manifest for client-side lazy loading) ---
  // Copied verbatim so the client can fetch it on demand instead of receiving
  // the entire 2.5 MB array serialized into the initial HTML payload.
  copyFileSync(ICONS_JSON, join(PUBLIC_API, "icons-full.json"));
  console.log(`  icons-full.json: ${icons.length} icons (full manifest)`);

  console.log("API generation complete.");
}

main();
