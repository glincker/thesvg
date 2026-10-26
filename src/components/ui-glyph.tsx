import { renderIcon, type Variant } from "@/lib/ui-icons/engine";
import { GLYPH_BY_SLUG, styleFor } from "@/lib/ui-icons/glyphs";
import { cn } from "@/lib/utils";

const cache = new Map<string, string>();

function markup(name: string, look: Variant): string | null {
  const key = `${name}:${look}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const glyph = GLYPH_BY_SLUG.get(name);
  if (!glyph) return null;
  // The size comes from the wrapper's class, so strip the fixed width and height from the root.
  const svg = renderIcon(glyph.nodes, { variant: look, style: styleFor(look), size: 24, idPrefix: `g-${name}-${look}` }).svg.replace(/ width="24" height="24"/, "");
  cache.set(key, svg);
  return svg;
}

/**
 * One of our own UI icons for site chrome, the same icons the UI icon section ships.
 * Size it with a class (`size-4`), it takes the text color. Names are checked by a test, so a typo fails CI.
 */
export function UiGlyph({ name, look = "outline", className }: { name: string; look?: Variant; className?: string }) {
  const svg = markup(name, look);
  if (!svg) return null;
  return <span aria-hidden="true" className={cn("inline-flex shrink-0 [&>svg]:size-full", className ?? "size-4")} dangerouslySetInnerHTML={{ __html: svg }} />;
}
