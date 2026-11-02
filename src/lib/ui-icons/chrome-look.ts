import type { Variant } from "@/lib/ui-icons/engine";

// Glass is a translucent pane and loses its detail when it is very small, so below this size the icon draws as outline.
export const GLASS_MIN_PX = 14;
// Glass has less ink than a plain outline, so in site chrome it is drawn a little larger inside its box to carry the same weight.
export const CHROME_SCALE = 1.12;

/** Glass by default, outline only for the smallest sizes. The size is read from the Tailwind class (`size-4`, `h-3.5`, ...). */
export function chromeLook(className: string): Variant {
  const m = /\b(?:size|h)-(\d+(?:\.\d+)?)\b/.exec(className);
  const px = m ? Number(m[1]) * 4 : GLASS_MIN_PX;
  return px < GLASS_MIN_PX ? "outline" : "glass";
}
