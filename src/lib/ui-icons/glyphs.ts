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
const scores = new Map<
  string,
  { slug: string; score?: number; q?: number[] }
>();
const manifestIcons = manifest.icons as {
  slug: string;
  score?: number;
  q?: number[];
}[];
for (let i = 0; i < manifestIcons.length; i++) {
  scores.set(manifestIcons[i].slug, manifestIcons[i]);
}
const newest = SETS.reduce(
  (max, s) => (s.releaseDate > max ? s.releaseDate : max),
  "",
);

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
    quality:
      scores.get(g.slug)?.score !== undefined
        ? {
            score: scores.get(g.slug)?.score ?? 0,
            parts: scores.get(g.slug)?.q ?? [],
          }
        : undefined,
  })),
);
export const VIEW_SETS: ViewSet[] = SETS.map((s) => ({
  id: s.id,
  name: s.name,
  note: s.note,
  releaseDate: s.releaseDate,
  released: true,
  isNew: s.releaseDate === newest,
  count: s.glyphs.length,
}));
export const GLYPH_BY_SLUG = new Map<string, Glyph>();
for (let i = 0; i < GLYPHS.length; i++) {
  GLYPH_BY_SLUG.set(GLYPHS[i].slug, GLYPHS[i]);
}

export const POPULAR_SLUGS: string[] = [];
const popularArray = popular as string[];
for (let i = 0; i < popularArray.length; i++) {
  if (GLYPH_BY_SLUG.has(popularArray[i])) {
    POPULAR_SLUGS.push(popularArray[i]);
  }
}

const categoryCounts = new Map<string, number>();
for (let i = 0; i < GLYPHS.length; i++) {
  const cat = GLYPHS[i].category;
  categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
}
export const CATEGORIES: { name: string; count: number }[] = Array.from(
  categoryCounts,
  ([name, count]) => ({ name, count }),
).sort((a, b) => b.count - a.count);
