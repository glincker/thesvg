import type { Variant } from "@/lib/ui-icons/engine";

// Glass is a translucent pane and loses its detail when it is very small, so below this size the icon draws as outline.
export const GLASS_MIN_PX = 16;
// From here up the frosted glass has room to read. Between the two sizes the crisp glass outline keeps the line sharp.
export const FROSTED_MIN_PX = 24;

/** Glass by default (crisp glass outline at chrome sizes, frosted glass from 24px), outline for the smallest sizes. The size is read from the Tailwind class (`size-4`, `h-3.5`, ...). */
export function chromeLook(className: string): Variant {
  const m = /\b(?:size|h)-(\d+(?:\.\d+)?)\b/.exec(className);
  const px = m ? Number(m[1]) * 4 : GLASS_MIN_PX;
  if (px < GLASS_MIN_PX) return "outline";
  return px >= FROSTED_MIN_PX ? "glass" : "glass-outline";
}
