import type { Glyph } from "./glyphs";
import type { Searchable } from "./search";

/** What search looks at for one icon: its name, its tags and concept, its category as a weak label, and its craft score as a tie-break. */
export function searchableOf(g: Glyph): Searchable {
  return { name: g.slug, extra: [...g.tags, g.concept], weak: [g.category], boost: g.quality?.score };
}
