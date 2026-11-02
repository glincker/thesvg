import { type StyleParams, type Variant, DEFAULT_STYLE } from "@/lib/ui-icons/engine";

// Pure helpers with no icon data, so the build script and the app can both import them.

export const VARIANTS = ["outline", "glass", "duotone", "offset", "fill", "glass-outline", "depth"] as const satisfies readonly Variant[];

const SIGNATURE: Partial<StyleParams> = {
  corner: "chamfer", radius: 1.5, strokeWidth: 1.75, join: "miter", cap: "butt", cutTerminals: true, scale: 1,
};
const DEPTH: Partial<StyleParams> = { corner: "chamfer", radius: 1.5, strokeWidth: 1.75, join: "miter", cap: "butt", scale: 0.96, depth: 1.8 };
const FROST: Partial<StyleParams> = { corner: "round", radius: 4, strokeWidth: 1.5, glassDepth: 0.55 };
const PANE: Partial<StyleParams> = { corner: "round", radius: 3, strokeWidth: 1.75, scale: 1 };

/** One house style per variant. Glass gets its own, it needs rounder shapes to read as a pane. */
export function styleFor(variant: Variant, lab: Partial<StyleParams> = {}): StyleParams {
  return { ...DEFAULT_STYLE, ...(variant === "glass" ? FROST : variant === "glass-outline" ? PANE : variant === "depth" ? DEPTH : SIGNATURE), ...lab };
}


