/**
 * Generates static JSON API files in public/api/ for the Raycast extension
 * and any other consumers that need a REST-like interface.
 *
 * Run: npx tsx src/scripts/generate-api.ts
 *
 * Outputs:
 *   public/api/registry.json      - all icons (slug, title, aliases, categories, hex, url, variant keys)
 *   public/api/categories.json    - category list with counts
 *   public/api/icons-full.json    - slim, minified browse index for client-side lazy loading
 *
 * Note: Individual per-icon detail files are NOT generated to stay within
 * Cloudflare Pages' 20,000 file deployment limit. Extensions should fetch
 * SVG content directly from /icons/{slug}/{variant}.svg.
 */

import { currentOnly } from "../lib/family-current";
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "fs";
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
  guidelines?: string;
  links?: Record<string, string | undefined>;
  family?: string;
  dateAdded?: string;
  collection: string;
  collectionVersion?: string;
  collectionMeta?: Record<string, string | undefined>;
  supersedes?: string;
  supersededBy?: string;
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
      guidelines: icon.guidelines || null,
      links: icon.links || null,
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
  // ⚡ Bolt: Use Array.from with mapping function instead of [...counts.entries()].map()
  // to prevent intermediate tuple array allocations.
  const categories = Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  writeFileSync(
    join(PUBLIC_API, "categories.json"),
    JSON.stringify({ categories }),
  );
  console.log(`  categories.json: ${categories.length} categories`);

  // --- families.json (brand families: parent icon plus current members) ---
  const bySlug = new Map<string, IconEntry>();
  for (let i = 0; i < icons.length; i++) {
    bySlug.set(icons[i].slug, icons[i]);
  }
  const byFamily = new Map<string, IconEntry[]>();
  for (const icon of icons) {
    if (!icon.family) continue;
    const list = byFamily.get(icon.family) ?? [];
    list.push(icon);
    byFamily.set(icon.family, list);
  }
  const families = [...byFamily]
    .map(([slug, all]) => {
      const parent = bySlug.get(slug);
      const members = currentOnly(all);
      return { slug, parent, members };
    })
    .filter((f) => f.parent && f.members.length + 1 >= 4)
    .map((f) => ({
      slug: f.slug,
      title: f.parent!.title,
      url: `https://thesvg.org/family/${f.slug}`,
      count: f.members.length + 1,
      logo: f.parent!.variants.default,
      members: f.members.map((m) => m.slug).sort(),
    }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
  writeFileSync(
    join(PUBLIC_API, "families.json"),
    JSON.stringify({ total: families.length, families }),
  );
  console.log(`  families.json: ${families.length} families`);

  // --- icons-full.json (slim browse index for client-side lazy loading) ---
  // The browse surface (grid, search, quick-preview) reads every field except
  // these collection-lineage extras, so we drop them and write minified JSON
  // instead of copying the pretty-printed source. Omitting by rest-spread keeps
  // any future IconEntry field in the index by default; only the known-unused
  // heavy fields are dropped here. This shrinks the download the browse flow
  // blocks on.
  const browseIndex = icons.map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- rest-spread omit
    ({ collectionVersion, collectionMeta, supersedes, supersededBy, ...browse }) => browse,
  );
  writeFileSync(join(PUBLIC_API, "icons-full.json"), JSON.stringify(browseIndex));
  console.log(`  icons-full.json: ${icons.length} icons (slim browse index)`);

  // --- ui-icons.json (UI icon manifest, a separate file so the brand index never grows with it) ---
  const uiManifest = join(ROOT, "src/data/ui-icons.json");
  if (existsSync(uiManifest)) {
    writeFileSync(join(PUBLIC_API, "ui-icons.json"), readFileSync(uiManifest));
    console.log("  ui-icons.json: copied UI icon manifest");
  }

  console.log("API generation complete.");
}

main();
