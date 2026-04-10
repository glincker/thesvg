/**
 * Generates static JSON API files in public/api/ for the Raycast extension
 * and any other consumers that need a REST-like interface.
 *
 * Run: npx tsx src/scripts/generate-api.ts
 *
 * Outputs:
 *   public/api/registry.json      - all icons (lightweight: slug, title, categories, variant keys)
 *   public/api/categories.json    - category list with counts
 *   public/api/registry/<slug>.json - per-icon detail (includes inline SVGs)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "../..");
const ICONS_JSON = join(ROOT, "src/data/icons.json");
const PUBLIC_API = join(ROOT, "public/api");
const REGISTRY_DIR = join(PUBLIC_API, "registry");

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

function readSvgFile(relativePath: string): string {
  const safePath = relativePath.replace(/^\//, "");
  const fullPath = join(ROOT, "public", safePath);
  if (!existsSync(fullPath)) return "";
  try {
    return readFileSync(fullPath, "utf-8").trim();
  } catch {
    return "";
  }
}

function main() {
  const icons: IconEntry[] = JSON.parse(readFileSync(ICONS_JSON, "utf-8"));

  // Clean previous output and ensure directories
  if (existsSync(PUBLIC_API)) {
    rmSync(PUBLIC_API, { recursive: true });
  }
  mkdirSync(REGISTRY_DIR, { recursive: true });

  // --- registry.json (lightweight list) ---
  const registryList = {
    total: icons.length,
    icons: icons.map((icon) => ({
      slug: icon.slug,
      title: icon.title,
      categories: icon.categories,
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

  // --- per-icon detail files ---
  let detailCount = 0;
  for (const icon of icons) {
    const variantsWithSvg: Record<string, { url: string; svg: string }> = {};
    for (const [key, path] of Object.entries(icon.variants)) {
      if (!path) continue;
      variantsWithSvg[key] = {
        url: `https://thesvg.org${path}`,
        svg: readSvgFile(path),
      };
    }

    const detail = {
      name: icon.slug,
      title: icon.title,
      aliases: icon.aliases,
      categories: icon.categories,
      hex: icon.hex,
      url: icon.url || null,
      variants: variantsWithSvg,
      cdn: {
        jsdelivr: `https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/${icon.slug}/default.svg`,
        direct: `https://thesvg.org/icons/${icon.slug}/default.svg`,
      },
    };

    writeFileSync(
      join(REGISTRY_DIR, `${icon.slug}.json`),
      JSON.stringify(detail),
    );
    detailCount++;
  }
  console.log(`  registry/*.json: ${detailCount} detail files`);
  console.log("API generation complete.");
}

main();
