import type { IconNode } from "@/lib/ui-icons/engine";
import { SETS } from "./sets.generated";
import popular from "@/data/ui/popular.json";
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
  })),
);
export const VIEW_SETS: ViewSet[] = SETS.map((s) => ({ id: s.id, name: s.name, note: s.note, releaseDate: s.releaseDate, released: true, isNew: s.releaseDate === newest, count: s.glyphs.length }));
export const POPULAR_SLUGS: string[] = (popular as string[]).filter((slug) => GLYPHS.some((g) => g.slug === slug));
export const GLYPH_BY_SLUG = new Map(GLYPHS.map((g) => [g.slug, g]));
export const CATEGORIES: { name: string; count: number }[] = [...new Set(GLYPHS.map((g) => g.category))]
  .map((name) => ({ name, count: GLYPHS.filter((g) => g.category === name).length }))
  .sort((a, b) => b.count - a.count);
