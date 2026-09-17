// Pure data-layer functions: search ranking, variant listing, category
// counts, and CDN URL construction. Kept independent of the Worker's fetch
// handler so they can be unit tested with plain vitest, no Workers runtime
// required.
//
// Data source: icons.json is copied from ../../src/data/icons.json into this
// directory at build/dev/deploy time (see package.json's pre* scripts) and
// imported here as a bundled JSON module. Same tradeoff as packages/mcp:
// offline-capable, refreshed on redeploy, not live-fetched per request.

import Fuse from "fuse.js";
import rawIcons from "./icons.json";

// Serves icons.json's public/icons/ files. thesvg.org is a static export, so
// this is the same CDN the browser itself uses.
export const ICON_CDN_BASE = "https://thesvg.org/icons";

export interface RawIcon {
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

export interface IconEntry {
  slug: string;
  name: string;
  variants: string[];
  categories: string[];
  hex: string;
  license: string;
  url?: string;
  aliases: string[];
}

export interface SearchResult {
  slug: string;
  name: string;
  variants: string[];
  categories: string[];
}

export interface CategoryCount {
  name: string;
  count: number;
}

function toIconEntry(icon: RawIcon): IconEntry {
  return {
    slug: icon.slug,
    name: icon.title,
    variants: Object.keys(icon.variants ?? {}),
    categories: icon.categories ?? [],
    hex: icon.hex,
    license: icon.license,
    url: icon.url,
    aliases: icon.aliases ?? [],
  };
}

let indexCache: IconEntry[] | null = null;
let fuseCache: Fuse<IconEntry> | null = null;

/** Builds (and caches) the in-memory icon index from the bundled registry. */
export function loadIcons(): IconEntry[] {
  if (indexCache) return indexCache;
  // rawIcons is inferred as a large literal union from the bundled JSON;
  // it structurally satisfies RawIcon[] at runtime, but TS's literal
  // inference doesn't unify cleanly with our looser interface, hence the
  // `unknown` bounce.
  indexCache = (rawIcons as unknown as RawIcon[]).map(toIconEntry);
  return indexCache;
}

/** Resets module-level caches. Test-only; production Workers never call this. */
export function resetCachesForTests(): void {
  indexCache = null;
  fuseCache = null;
}

function getFuse(icons: IconEntry[]): Fuse<IconEntry> {
  if (fuseCache) return fuseCache;
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

/** Fuzzy search by slug, name, or alias. Mirrors packages/mcp's ranking. */
export function searchIcons(query: string, limit = 20): SearchResult[] {
  const icons = loadIcons();
  const fuse = getFuse(icons);
  return fuse.search(query, { limit }).map((r) => ({
    slug: r.item.slug,
    name: r.item.name,
    variants: r.item.variants,
    categories: r.item.categories,
  }));
}

/** Exact slug lookup. */
export function findIcon(slug: string): IconEntry | undefined {
  return loadIcons().find((i) => i.slug === slug);
}

/** Builds the public CDN URL for a given icon slug + variant. */
export function buildIconUrl(slug: string, variant: string): string {
  return `${ICON_CDN_BASE}/${encodeURIComponent(slug)}/${encodeURIComponent(variant)}.svg`;
}

/** Counts icons per category across the whole registry, sorted descending. */
export function listCategories(): CategoryCount[] {
  const icons = loadIcons();
  const counts = new Map<string, number>();
  for (const icon of icons) {
    for (const cat of icon.categories) {
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}
