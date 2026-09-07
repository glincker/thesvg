/**
 * Style-source extraction that operates on the raw SVG text rather than
 * the parsed tree: `<style>` block class rules and `<linearGradient>`/
 * `<radialGradient>` stop colors. Both are looked up by the walker in
 * svg-path-to-polygons.ts while resolving an element's fill/stroke.
 */

import type { Attrs } from "./svg-xml";

/**
 * Parses `<style>` blocks into a `className -> declarations` map. Only
 * flat class selectors (`.foo`, comma-separated) are recognized; compound
 * or descendant selectors are skipped rather than mis-resolved. This
 * targets a common Illustrator/Lottie export pattern (confirmed on the
 * "amazon-q" icon): several near-duplicate groups of one animation's
 * frames, each tagged with its own class and hidden via `display: none`
 * except for the frame meant to show, with the actually-visible shapes'
 * colors also set via class (`fill: ...`) rather than a `fill` attribute.
 * Without resolving classes at all, every "hidden" frame renders anyway
 * (display:none is invisible to us) and the one real shape has no fill
 * we can see, producing a solid mess of overlapping duplicates instead of
 * the intended icon.
 */
export function parseStylesheet(svgContent: string): Map<string, Record<string, string>> {
  const map = new Map<string, Record<string, string>>();
  const styleBlockRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let sm: RegExpExecArray | null;
  while ((sm = styleBlockRe.exec(svgContent))) {
    const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
    let rm: RegExpExecArray | null;
    while ((rm = ruleRe.exec(sm[1]))) {
      const decls: Record<string, string> = {};
      for (const decl of rm[2].split(";")) {
        const idx = decl.indexOf(":");
        if (idx === -1) continue;
        const prop = decl.slice(0, idx).trim();
        const value = decl.slice(idx + 1).trim();
        if (prop && value) decls[prop] = value;
      }
      if (!Object.keys(decls).length) continue;
      for (const selector of rm[1].split(",")) {
        const trimmed = selector.trim();
        // Only ".classname" - no element/id/descendant/pseudo selectors.
        if (!/^\.[\w-]+$/.test(trimmed)) continue;
        const className = trimmed.slice(1);
        map.set(className, { ...map.get(className), ...decls });
      }
    }
  }
  return map;
}

export function resolveClassStyle(
  attrs: Attrs,
  stylesheet: Map<string, Record<string, string>>,
): Record<string, string> | undefined {
  const classAttr = attrs.class;
  if (!classAttr || stylesheet.size === 0) return undefined;
  let merged: Record<string, string> | undefined;
  for (const cls of classAttr.trim().split(/\s+/)) {
    const rule = stylesheet.get(cls);
    if (rule) merged = { ...merged, ...rule };
  }
  return merged;
}

export interface GradientStop {
  color: string;
  /** The first stop's own `stop-opacity` (defaults to 1). A gradient that
   * fades in from transparent (e.g. a highlight sheen) has a near-zero
   * opacity here, which matters just as much as its color: collapsing it
   * to just the color and ignoring the opacity would render a highlight
   * that's meant to start invisible as a solid, opaque wash instead. */
  opacity: number;
}

/**
 * Extracts a representative solid color (and that stop's own opacity) per
 * gradient id, from its first `<stop>`. Many brand marks layer a
 * white-to-transparent gradient as a highlight over a solid-color base
 * shape (e.g. Next.js, or the "epsagon" icon's soft shading); resolving
 * those to the gradient's own first stop (usually white, sometimes fully
 * transparent) keeps the highlight's intended visibility instead of
 * collapsing it onto an opaque color that hides the shape underneath it.
 */
export function extractGradientColors(svgContent: string): Map<string, GradientStop> {
  const map = new Map<string, GradientStop>();
  const gradRe = /<(linearGradient|radialGradient)\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = gradRe.exec(svgContent))) {
    const id = m[2];
    const body = m[3];
    const firstStop = /<stop\b([^>]*)\/?>/i.exec(body);
    if (!firstStop) continue;
    const stopTag = firstStop[1];
    const colorMatch =
      /\bstop-color="([^"]+)"/i.exec(stopTag) ||
      /\bstyle="[^"]*stop-color:\s*([^;"]+)/i.exec(stopTag);
    if (!colorMatch) continue;
    const opacityMatch =
      /\bstop-opacity="([^"]+)"/i.exec(stopTag) ||
      /\bstyle="[^"]*stop-opacity:\s*([^;"]+)/i.exec(stopTag);
    let opacity = 1;
    if (opacityMatch) {
      const raw = opacityMatch[1].trim();
      const parsed = raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw);
      if (!Number.isNaN(parsed)) opacity = Math.min(1, Math.max(0, parsed));
    }
    map.set(id, { color: colorMatch[1].trim(), opacity });
  }
  return map;
}
