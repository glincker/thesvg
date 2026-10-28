import type { IconNode } from "@/lib/ui-icons/engine";
import { SETS } from "./sets.generated";
import popular from "@/data/ui/popular.json";
import manifest from "@/data/ui-icons.json";
import { categoryOf } from "./style";

export { VARIANTS, categoryOf, styleFor } from "./style";

export interface Glyph {
  slug: string;
  nodes: IconNode[];
  tags: string[];
  category: string;
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
// ⚡ Bolt: Avoid intermediate array allocation via `manifest.icons.map`
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
    category: categoryOf(g.slug),
    setId: s.id,
    setName: s.name,
    released: true,
    isNew: s.releaseDate === newest,
    releasedOn: s.releaseDate,
    quality: scores.get(g.slug)?.score !== undefined ? { score: scores.get(g.slug)?.score ?? 0, parts: scores.get(g.slug)?.q ?? [] } : undefined,
  })),
);
export const VIEW_SETS: ViewSet[] = SETS.map((s) => ({ id: s.id, name: s.name, note: s.note, releaseDate: s.releaseDate, released: true, isNew: s.releaseDate === newest, count: s.glyphs.length }));
export const POPULAR_SLUGS: string[] = (popular as string[]).filter((slug) => GLYPHS.some((g) => g.slug === slug));
// ⚡ Bolt: Avoid intermediate array allocation via `GLYPHS.map`
export const GLYPH_BY_SLUG = new Map<string, Glyph>();
for (const g of GLYPHS) {
  GLYPH_BY_SLUG.set(g.slug, g);
}
// ⚡ Bolt: Use a single-pass loop with a Map to tally counts instead of chained O(N*C) operations
const categoryCounts = new Map<string, number>();
for (const g of GLYPHS) {
  categoryCounts.set(g.category, (categoryCounts.get(g.category) || 0) + 1);
}
export const CATEGORIES: { name: string; count: number }[] = Array.from(categoryCounts, ([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count);
