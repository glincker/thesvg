import { GLYPH_BY_SLUG, POPULAR_SLUGS, type Glyph } from "./glyphs";

/** The glyphs our own apps reach for most, in real usage order, limited to what this build shows. */
export const POPULAR: Glyph[] = POPULAR_SLUGS.map((s) => GLYPH_BY_SLUG.get(s)).filter((g): g is Glyph => g !== undefined);
