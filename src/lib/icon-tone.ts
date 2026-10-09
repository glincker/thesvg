/**
 * Picks the preview tile for an icon from its brand colour.
 *
 * About 18% of the library has a near-black brand colour and almost none of
 * those ship a dark-theme variant, so on a dark tile they vanish; a handful of
 * near-white brands have the opposite problem on a light tile. Rather than
 * recolouring the artwork (brand marks should stay faithful), the tile adapts:
 * "dark" brands get a light chip in dark mode, "light" brands get a dark chip
 * in light mode, everything else keeps the neutral spotlight.
 */
export type IconTone = "dark" | "light" | "neutral";

/** WCAG relative luminance of a 6-digit hex colour, or null if it is not one. */
export function relativeLuminance(hex: string | undefined): number | null {
  if (!hex) return null;
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const channel = (start: number) => {
    const c = parseInt(clean.slice(start, start + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

const DARK_BELOW = 0.04;
const LIGHT_ABOVE = 0.7;

export function iconTone(hex: string | undefined): IconTone {
  const lum = relativeLuminance(hex);
  if (lum === null) return "neutral";
  if (lum < DARK_BELOW) return "dark";
  if (lum > LIGHT_ABOVE) return "light";
  return "neutral";
}
