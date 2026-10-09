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

/** Luminance used for a named or unparsed colour: neither near-black nor near-white. */
const MID_LUMINANCE = 0.3;

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

type Paint =
  | { kind: "none" }
  | { kind: "url" }
  | { kind: "color"; luminance: number };

/**
 * Resolves one paint value. `none`, `transparent` and `inherit` paint nothing,
 * url() is a gradient or pattern, black, white and currentColor are exact, and
 * any other colour word (red, gray, ...) counts as a mid tone so a colourful
 * logo is never mistaken for a near-black or near-white one.
 */
function resolvePaint(value: string): Paint {
  const v = value.trim().toLowerCase();
  if (v === "" || v === "none" || v === "transparent" || v === "inherit") return { kind: "none" };
  if (v.startsWith("url(")) return { kind: "url" };
  if (v === "black" || v === "currentcolor") return { kind: "color", luminance: 0 };
  if (v === "white") return { kind: "color", luminance: 1 };
  const hex = v.startsWith("#") ? expandHex(v) : v.startsWith("rgb") ? rgbToHex(v) : null;
  const lum = hex === null ? null : relativeLuminance(hex);
  return { kind: "color", luminance: lum ?? MID_LUMINANCE };
}

const NON_RENDERED_RE = /<(clipPath|mask|defs|symbol|pattern|metadata|title|desc)\b[\s\S]*?<\/\1>/gi;
const TAG_RE = /<(\/?)([a-zA-Z][\w:-]*)\b([^>]*?)(\/?)>/g;
const SHAPES = new Set(["path", "circle", "rect", "ellipse", "polygon", "polyline", "line"]);
const STOP_RE = /\bstop-color\s*[:=]\s*["']?\s*(#[0-9a-f]{3,6}\b|rgba?\([^)]*\)|[a-z]+)/gi;
const STYLE_BLOCK_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const STYLE_PAINT_RE = /\b(?:fill|stroke)\s*:\s*(#[0-9a-f]{3,6}\b|rgba?\([^)]*\)|[a-z]+)/gi;

function attr(attrs: string, name: string): string | undefined {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(attrs);
  if (m) return (m[1] ?? m[2]).trim();
  const style = /(?:^|\s)style\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
  if (style) {
    const decl = new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`, "i").exec(style[1] ?? style[2]);
    if (decl) return decl[1].trim();
  }
  return undefined;
}

/**
 * Tone of an icon from the colours its artwork is actually painted with.
 * "dark" when every painted colour is near-black, "light" when every one is
 * near-white, otherwise "neutral". Each visible shape resolves its own fill
 * (its attribute or style, else the nearest enclosing svg or group, else the
 * SVG default of black). Clip paths, masks and defs paint nothing visible and
 * are ignored, except that gradient stops are read when a shape uses a
 * gradient. Colourful or mixed artwork, and anything that brings its own
 * background (a white square behind a black mark), stays neutral. The registry
 * `hex` is deliberately not used: several full-colour logos carry 000000 there.
 */
export function toneFromSvg(svg: string): IconTone {
  const rendered = svg.replace(NON_RENDERED_RE, "");
  const hasStyleBlock = /<style\b/i.test(svg);
  const lums: number[] = [];
  let sawShape = false;
  let usesGradient = false;
  const add = (p: Paint): void => {
    if (p.kind === "color") lums.push(p.luminance);
    else if (p.kind === "url") usesGradient = true;
  };

  // Stack of the fill/stroke each open element passes down to its children.
  const stack: Array<{ fill?: string; stroke?: string }> = [{}];
  for (const m of rendered.matchAll(TAG_RE)) {
    const closing = m[1] === "/";
    const name = m[2].toLowerCase();
    const attrs = m[3];
    const selfClosing = m[4] === "/";
    if (closing) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const top = stack[stack.length - 1];
    const ownFill = attr(attrs, "fill");
    const ownStroke = attr(attrs, "stroke");
    const fill = ownFill ?? top.fill;
    const stroke = ownStroke ?? top.stroke;
    if (SHAPES.has(name)) {
      sawShape = true;
      const classPainted = hasStyleBlock && /(?:^|\s)class\s*=/i.test(attrs);
      if (fill !== undefined) add(resolvePaint(fill));
      else if (!classPainted) lums.push(0); // unpainted shape renders black
      if (stroke !== undefined) add(resolvePaint(stroke));
    }
    if (!selfClosing) stack.push({ fill, stroke });
  }

  // Colours set through a <style> block apply to classes we cannot map back.
  for (const block of svg.matchAll(STYLE_BLOCK_RE)) {
    for (const m of block[1].matchAll(STYLE_PAINT_RE)) add(resolvePaint(m[1]));
  }
  if (usesGradient) {
    for (const m of svg.matchAll(STOP_RE)) add(resolvePaint(m[1]));
  }

  if (!sawShape) return "neutral";
  if (lums.length === 0) return "dark";
  if (lums.every((l) => l < DARK_BELOW)) return "dark";
  if (lums.every((l) => l > LIGHT_ABOVE)) return "light";
  return "neutral";
}
