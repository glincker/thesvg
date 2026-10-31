import type { IconNode } from "@/lib/ui-icons/engine";
import { SETS } from "./sets.generated";
import popular from "@/data/ui/popular.json";
import manifest from "@/data/ui-icons.json";
import { conceptOf, domainLabel } from "./taxonomy";

export { VARIANTS, styleFor } from "./style";
export { DOMAINS, MODIFIERS, domainLabel } from "./taxonomy";

export interface Glyph {
  slug: string;
  nodes: IconNode[];
  tags: string[];
  /** Controlled vocabulary id from src/data/ui/taxonomy.json. */
  domain: string;
  /** Display label of the domain. */
  category: string;
  /** What the glyph shows, with variations split off into modifiers: "folder-plus" is concept "folder". */
  concept: string;
  modifiers: string[];
  setId: string;
  setName: string;
  released: boolean;
  isNew: boolean;
  releasedOn: string | null;
  /** Craft score from the build, with the four parts that make it up. */
  quality?: { score: number; parts: number[] };
}

export interface ViewSet {
  id: string;
  name: string;
  note: string;
  releaseDate: string | null;
  released: boolean;
  isNew: boolean;
  count: number;
}

// Every set file committed under src/data/ui/sets is released. The newest release date is the "new" drop,
// so the label never depends on today's date and server and browser always agree.
// ⚡ Bolt: Use a single-pass loop to avoid intermediate array allocations
const scores = new Map<string, { slug: string; score?: number; q?: number[] }>();
for (const i of manifest.icons as { slug: string; score?: number; q?: number[] }[]) {
  scores.set(i.slug, i);
}
const newest = SETS.reduce((max, s) => (s.releaseDate > max ? s.releaseDate : max), "");

export const GLYPHS: Glyph[] = SETS.flatMap((s) =>
  s.glyphs.map((g) => ({
    slug: g.slug,
    nodes: g.nodes as IconNode[],
    tags: g.tags,
    domain: g.domain,
    category: domainLabel(g.domain),
    ...conceptOf(g.slug),
    setId: s.id,
    setName: s.name,
    released: true,
    isNew: s.releaseDate === newest,
    releasedOn: s.releaseDate,
    quality: scores.get(g.slug)?.score !== undefined ? { score: scores.get(g.slug)?.score ?? 0, parts: scores.get(g.slug)?.q ?? [] } : undefined,
  })),
);
export const VIEW_SETS: ViewSet[] = SETS.map((s) => ({ id: s.id, name: s.name, note: s.note, releaseDate: s.releaseDate, released: true, isNew: s.releaseDate === newest, count: s.glyphs.length }));
// ⚡ Bolt: Use a single-pass loop to avoid intermediate array allocations
export const GLYPH_BY_SLUG = new Map<string, Glyph>();
for (const g of GLYPHS) {
  GLYPH_BY_SLUG.set(g.slug, g);
}
// ⚡ Bolt: Single-pass loop with O(1) Map lookup instead of O(N*M) chained .filter().some()
export const POPULAR_SLUGS: string[] = [];
for (const slug of popular as string[]) {
  if (GLYPH_BY_SLUG.has(slug)) {
    POPULAR_SLUGS.push(slug);
  }
}
const _catCounts = new Map<string, number>();
for (let i = 0; i < GLYPHS.length; i++) {
  const cat = GLYPHS[i].category;
  _catCounts.set(cat, (_catCounts.get(cat) || 0) + 1);
}

export const CATEGORIES: { name: string; count: number }[] = Array.from(_catCounts, ([name, count]) => ({
  name,
  count,
})).sort((a, b) => b.count - a.count);
