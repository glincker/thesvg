import type { Variant } from "@/lib/ui-icons/engine";

// Glass is a translucent pane and loses its detail when it is very small, so below this size the icon draws as outline.
export const GLASS_MIN_PX = 16;

/** Glass by default, outline for the smallest sizes. The size is read from the Tailwind class (`size-4`, `h-3.5`, ...). */
export function chromeLook(className: string): Variant {
  const m = /\b(?:size|h)-(\d+(?:\.\d+)?)\b/.exec(className);
  const px = m ? Number(m[1]) * 4 : GLASS_MIN_PX;
  return px >= GLASS_MIN_PX ? "glass" : "outline";
}
