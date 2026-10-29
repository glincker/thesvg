import { useId } from "react";
import { renderIcon, type Variant } from "@/lib/ui-icons/engine";
import { chromeLook } from "@/lib/ui-icons/chrome-look";
import { GLYPH_BY_SLUG, styleFor } from "@/lib/ui-icons/glyphs";
import { defaultColorOf } from "@/lib/ui-icons/default-color";
import { scopeIds } from "@/lib/ui-icons/scope-ids";
import { cn } from "@/lib/utils";

const cache = new Map<string, string>();

function markup(name: string, look: Variant): string | null {
  const key = `${name}:${look}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const glyph = GLYPH_BY_SLUG.get(name);
  if (!glyph) return null;
  // The size comes from the wrapper's class, so the fixed width and height go. The size-full class on the svg also keeps
  // buttons that force a size on bare svgs (our Button does) from shrinking it.
  const svg = renderIcon(glyph.nodes, { variant: look, style: styleFor(look), size: 24, idPrefix: `g-${name}-${look}` }).svg.replace(/ width="24" height="24"/, "").replace(/^<svg /, '<svg class="size-full" ');
  cache.set(key, svg);
  return svg;
}

/**
 * One of our own UI icons for site chrome, the same icons the UI icon section ships.
 * Size it with a class (`size-4`), it takes the text color. Glass by default, outline below 16px, or pass `look` to choose.
 * Each icon has a default colour (a check is green, an alert red). A `text-*` class in `className` overrides it, and `plain` keeps it neutral.
 * Names are checked by a test, so a typo fails CI.
 */
export function UiGlyph({ name, look, className = "size-5", style, plain = false }: Readonly<{ name: string; look?: Variant; className?: string; style?: React.CSSProperties; plain?: boolean }>) {
  const uid = useId().replaceAll(/[^a-zA-Z0-9]/g, "");
  const lookUsed = look ?? chromeLook(className);
  const svg = markup(name, lookUsed);
  if (!svg) return null;
  // The drawing is cached, but each copy on the page gets its own ids so copies never share a gradient or a mask.
  return <span aria-hidden="true" style={style} className={cn("inline-flex shrink-0 [&>svg]:size-full", lookUsed === "glass" && "drop-shadow-[0_1px_1.5px_rgb(0_0_0/0.28)] dark:drop-shadow-[0_1px_2px_rgb(0_0_0/0.6)]", !plain && !/(^|\s)text-/.test(className) && defaultColorOf(name), className)} dangerouslySetInnerHTML={{ __html: scopeIds(svg, uid) }} />;
}
