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

const NAMED_COLORS: Record<string, string> = {
  black: "000000",
  white: "ffffff",
  currentcolor: "000000",
};

function expandHex(raw: string): string | null {
  const h = raw.replace("#", "").toLowerCase();
  if (/^[0-9a-f]{6}$/.test(h)) return h;
  if (/^[0-9a-f]{3}$/.test(h)) return h.split("").map((c) => c + c).join("");
  return null;
}

function rgbToHex(raw: string): string | null {
  const m = /^rgba?\(\s*([\d.]+)(%?)\s*[, ]\s*([\d.]+)(%?)\s*[, ]\s*([\d.]+)(%?)/i.exec(raw);
  if (!m) return null;
  const ch = (v: string, pct: string) => {
    const n = Math.max(0, Math.min(255, Math.round(pct ? (parseFloat(v) / 100) * 255 : parseFloat(v))));
    return n.toString(16).padStart(2, "0");
  };
  return ch(m[1], m[2]) + ch(m[3], m[4]) + ch(m[5], m[6]);
}

/** Resolves one paint value to a 6 digit hex, or null for none, url() and unknowns. */
function paintToHex(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (v === "" || v === "none" || v === "transparent" || v.startsWith("url(")) return null;
  if (v.startsWith("#")) return expandHex(v);
  if (v.startsWith("rgb")) return rgbToHex(v);
  return NAMED_COLORS[v] ?? null;
}

const PAINT_RE = /\b(?:fill|stroke|stop-color)\s*[:=]\s*["']?\s*(#[0-9a-f]{3,6}\b|rgba?\([^)]*\)|[a-z]+)/gi;
const SHAPE_TAG_RE = /<(?:path|circle|rect|ellipse|polygon|polyline|line)\b[^>]*>/gi;
const NON_RENDERED_RE = /<(clipPath|mask|defs|symbol|pattern|metadata|title|desc)\b[\s\S]*?<\/\1>/gi;

/** True when this shape tag brings its own paint (attribute, inline style or a class). */
function shapeHasPaint(tag: string, hasStyleBlock: boolean): boolean {
  if (/\sfill\s*=/i.test(tag)) return true;
  if (/\sstyle\s*=\s*["'][^"']*fill\s*:/i.test(tag)) return true;
  return hasStyleBlock && /\sclass\s*=/i.test(tag);
}

/**
 * Tone of an icon from the colours its artwork is actually painted with.
 * "dark" when every painted colour is near-black, "light" when every one is
 * near-white, otherwise "neutral". A visible shape with no paint of its own,
 * and no fill on an enclosing svg or group, renders black (the SVG default)
 * and counts as black. Colourful or mixed artwork, and anything that brings
 * its own background (a white square behind a black mark), stays neutral. The
 * registry `hex` is deliberately not used: several full-colour logos carry
 * 000000 there.
 */
export function toneFromSvg(svg: string): IconTone {
  const lums: number[] = [];
  for (const m of svg.matchAll(PAINT_RE)) {
    const hex = paintToHex(m[1]);
    if (hex === null) continue;
    const lum = relativeLuminance(hex);
    if (lum !== null) lums.push(lum);
  }

  const rendered = svg.replace(NON_RENDERED_RE, "");
  const hasInheritedFill = /<(?:svg|g)\b[^>]*\sfill\s*=\s*["'](?!none)/i.test(rendered);
  const hasStyleBlock = /<style\b/i.test(svg);
  let sawShape = false;
  let sawUnpainted = false;
  for (const m of rendered.matchAll(SHAPE_TAG_RE)) {
    sawShape = true;
    if (!shapeHasPaint(m[0], hasStyleBlock)) sawUnpainted = true;
  }
  if (sawUnpainted && !hasInheritedFill) lums.push(0);

  if (lums.length === 0) return sawShape ? "dark" : "neutral";
  if (lums.every((l) => l < DARK_BELOW)) return "dark";
  if (lums.every((l) => l > LIGHT_ABOVE)) return "light";
  return "neutral";
}
