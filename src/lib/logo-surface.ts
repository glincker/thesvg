import iconTones from "@/data/icon-tones.json";
import type { IconTone } from "@/lib/icon-tone";

/**
 * Small-tile helpers for logos that would otherwise disappear: near-white
 * marks get a shadow on the artwork (the look the icon page uses), and
 * near-black marks get a light plate in dark mode only. Used where a tile
 * is too small for the full adaptive preview surface (recents, strips).
 */
function toneOf(slug: string): IconTone {
  return (iconTones as Record<string, IconTone>)[slug] ?? "neutral";
}

/** Class for the <img>: a shadow so white marks read on a light tile. */
export function logoImgClass(slug: string): string {
  return toneOf(slug) === "light"
    ? "drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]"
    : "";
}

/** Class for the tile behind the <img>: a light plate for black marks in dark mode. */
export function logoPlateClass(slug: string): string {
  return toneOf(slug) === "dark" ? "dark:bg-neutral-200" : "";
}
