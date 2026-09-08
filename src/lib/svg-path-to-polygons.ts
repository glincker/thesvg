/**
 * Minimal, dependency-free SVG -> filled-polygon flattener.
 *
 * Background: Excalidraw's `.excalidrawlib` format has no mechanism for
 * embedding binary/raster data. The app explicitly disallows adding
 * "image" (and "iframe"/"embeddable") elements to a library
 * (`LIBRARY_DISABLED_TYPES` in excalidraw/excalidraw), and the library
 * JSON schema (`ExportedLibraryData` / `ImportedLibraryData`) carries no
 * top-level `files` map the way a full `.excalidraw` scene does. So the
 * only way to ship a brand icon inside a library file is to decompose its
 * SVG paths/shapes into native Excalidraw vector elements. See
 * `svg-to-excalidraw.ts` for that conversion; this module only handles the
 * SVG side of it.
 *
 * This is the orchestrator: it walks a subset of SVG (path, rect, circle,
 * ellipse, polygon, polyline; g/svg for structure, transform and fill
 * inheritance) and flattens it into filled polygons. The affine matrix
 * math lives in `svg-matrix.ts` and the path `d` command parser lives in
 * `svg-path-data.ts`.
 *
 * Known limitations (acceptable for icon-scale brand marks):
 * - Curves are flattened to line segments (no native bezier storage).
 * - Compound paths whose subpaths represent an even-odd "hole" (e.g. a
 *   ring, or the counter of a letter) are merged into a single outline via
 *   a zero-area "slit" bridge between the nearest points of each subpath,
 *   since a single Excalidraw line element has no fill-rule of its own.
 *   This reproduces the hole for the common case but can misfire on
 *   deeply nested or self-overlapping compound paths.
 * - Gradients resolve to their first `<stop>` color (a reasonable stand-in
 *   for the common white-highlight-over-solid-shape pattern); true
 *   multi-stop gradients aren't reproduced. `currentColor` resolves to the
 *   supplied fallback (the icon's brand hex).
 * - `<use>` is resolved by id against the whole parsed document (not just
 *   `<defs>`, since some icons put the source shape as a plain sibling),
 *   composing the use's own x/y/transform with the target's, and recursing
 *   so a `<use>` of a `<g>` that itself contains further `<use>`s works.
 *   The use element's own presentation attributes (fill, etc.) are what
 *   the target inherits if it has none of its own, matching SVG's actual
 *   inheritance context for a `<use>`'s shadow content. Elements inside
 *   `<defs>` still never render on their own, only via a `<use>` reference.
 * - Elements with a non-"normal" `mix-blend-mode` style are skipped
 *   outright rather than painted as an opaque layer: several crypto/badge
 *   icons (ethereum, bitcoin, bnb, dogecoin, algorand) layer a translucent
 *   white "soft-light" sheen circle over their solid background circle,
 *   and painting that sheen at full opacity (the only option without real
 *   blend-mode compositing) would hide the actual brand color underneath
 *   instead of just losing the subtle highlight.
 * - `<mask>`/`<clipPath>` are not applied (the masked content just renders
 *   unclipped) since real alpha masking is out of scope; `<text>` is
 *   skipped.
 * - Stroke-only shapes (`fill="none"` with a `stroke`, a common
 *   outline-logo pattern) are converted to filled geometry: each segment
 *   becomes a rectangular ribbon and every vertex gets a circle, which
 *   approximates joins and caps as round regardless of the real
 *   `stroke-linejoin`/`stroke-linecap`. That's a deliberate simplification
 *   (indistinguishable from miter/bevel/butt/square at icon scale) in
 *   exchange for not silently dropping the only visible content of an
 *   outline-style icon.
 * - `<style>` blocks are parsed for flat class selectors only (`.foo`,
 *   `.foo, .bar`), enough to resolve `class="..."`-based `fill`/`stroke`
 *   and to honor `display: none` (which hides its whole subtree, same as
 *   CSS). This matters for Illustrator/Lottie exports that hide unused
 *   animation-frame duplicates via class rather than attribute, and color
 *   the one real shape the same way. Compound/descendant/id selectors are
 *   ignored, not mis-resolved.
 */

import { IDENTITY, applyMat, multiplyMat, parseTransform, type Mat } from "./svg-matrix";
import { NumScanner, flattenPathData, type PathPoint } from "./svg-path-data";
import { flattenPathForStroke, strokeSubpathToRibbon } from "./svg-stroke";
import {
  parseStylesheet,
  resolveClassStyle,
  extractGradientColors,
  type GradientStop,
} from "./svg-style";
import { parseXml, VOID_UNSUPPORTED, type Attrs, type XmlNode } from "./svg-xml";

export interface FlattenedPolygon {
  points: [number, number][];
  fill: string;
  opacity: number;
}

export interface SvgToPolygonsResult {
  shapes: FlattenedPolygon[];
  viewBox: { minX: number; minY: number; width: number; height: number };
}

/** Safety cap on <use> -> <use> chains, in case of a reference cycle. */
const MAX_USE_DEPTH = 10;

interface ResolvedFill {
  fill: string;
  /** Multiplies into the element's own opacity; only ever <1 for a
   * `url(#gradient)` fill whose first stop itself has stop-opacity <1. */
  opacityMultiplier: number;
}

function resolveFill(
  attrs: Attrs,
  inherited: string,
  fallback: string,
  gradients: Map<string, GradientStop>,
  classStyle?: Record<string, string>,
): ResolvedFill {
  let fill = attrs.fill;
  if (!fill) {
    const style = attrs.style;
    if (style) {
      const m = /fill\s*:\s*([^;]+)/.exec(style);
      if (m) fill = m[1].trim();
    }
  }
  if (!fill && classStyle?.fill) fill = classStyle.fill;
  if (!fill) return { fill: inherited, opacityMultiplier: 1 };
  const trimmed = fill.trim();
  if (trimmed === "currentColor") return { fill: fallback, opacityMultiplier: 1 };
  if (trimmed.startsWith("url(")) {
    const idMatch = /url\(#([^)]+)\)/.exec(trimmed);
    const stop = idMatch ? gradients.get(idMatch[1]) : undefined;
    if (stop) return { fill: stop.color, opacityMultiplier: stop.opacity };
    return { fill: fallback, opacityMultiplier: 1 };
  }
  return { fill: trimmed, opacityMultiplier: 1 };
}

/**
 * True if this element carries a non-"normal" `mix-blend-mode` (a common
 * pattern for a translucent "sheen" circle layered over a solid badge
 * background, e.g. the ethereum/bitcoin/bnb/dogecoin/algorand crypto
 * icons). We have no way to composite blend modes correctly, and the
 * naive alternative, painting the layer as a plain opaque/semi-opaque
 * fill, is actively wrong: a white "soft-light" sheen at full opacity
 * paints over and hides the real background color entirely rather than
 * subtly brightening it. Skipping the shape loses a cosmetic highlight
 * but keeps the actual brand color intact, which matters far more here.
 */
function hasUnsupportedBlendMode(attrs: Attrs): boolean {
  const style = attrs.style;
  if (!style) return false;
  const m = /mix-blend-mode\s*:\s*([^;]+)/i.exec(style);
  return Boolean(m && m[1].trim().toLowerCase() !== "normal");
}

function resolveOpacity(attrs: Attrs, inherited: number): number {
  const raw = attrs["fill-opacity"] ?? attrs.opacity;
  if (raw === undefined) return inherited;
  const parsed = raw.trim().endsWith("%")
    ? parseFloat(raw) / 100
    : parseFloat(raw);
  if (Number.isNaN(parsed)) return inherited;
  return Math.min(1, Math.max(0, parsed)) * inherited;
}

function resolveStrokeOpacity(attrs: Attrs, inherited: number): number {
  const raw = attrs["stroke-opacity"] ?? attrs.opacity;
  if (raw === undefined) return inherited;
  const parsed = raw.trim().endsWith("%")
    ? parseFloat(raw) / 100
    : parseFloat(raw);
  if (Number.isNaN(parsed)) return inherited;
  return Math.min(1, Math.max(0, parsed)) * inherited;
}

/** Mirrors `resolveFill` for the `stroke` presentation attribute (default
 * inherited value "none", per the SVG initial value). Gradient/pattern
 * strokes are rare enough on icon-scale outline logos that we just fall
 * back to the icon's brand color rather than resolving them properly. */
function resolveStroke(
  attrs: Attrs,
  inherited: string,
  fallback: string,
  classStyle?: Record<string, string>,
): string {
  let stroke = attrs.stroke;
  if (!stroke) {
    const style = attrs.style;
    if (style) {
      const m = /(?<!-)stroke\s*:\s*([^;]+)/.exec(style);
      if (m) stroke = m[1].trim();
    }
  }
  if (!stroke && classStyle?.stroke) stroke = classStyle.stroke;
  if (!stroke) return inherited;
  const trimmed = stroke.trim();
  if (trimmed === "currentColor" || trimmed.startsWith("url(")) return fallback;
  return trimmed;
}

/** `stroke-width`'s initial value is 1 (not inherited-from-nothing like
 * fill's "none" for stroke); it inherits down like any other presentation
 * attribute once set. */
function resolveStrokeWidth(attrs: Attrs, inherited: number): number {
  const raw = attrs["stroke-width"];
  if (raw === undefined) return inherited;
  const parsed = parseFloat(raw);
  return Number.isNaN(parsed) ? inherited : parsed;
}

function pointsFromAttr(pointsAttr: string): PathPoint[] {
  const scanner = new NumScanner(pointsAttr);
  const pts: PathPoint[] = [];
  while (scanner.hasMore()) {
    const x = scanner.readNumber();
    if (!scanner.hasMore()) break;
    const y = scanner.readNumber();
    pts.push({ x, y });
  }
  return pts;
}

/** Indexes every node with an `id` attribute, anywhere in the document
 * (including inside `<defs>`), so `<use>` can resolve its target
 * regardless of where the source shape happens to live. */
function buildIdIndex(root: XmlNode): Map<string, XmlNode> {
  const index = new Map<string, XmlNode>();
  const visit = (node: XmlNode) => {
    if (node.attrs.id && !index.has(node.attrs.id)) {
      index.set(node.attrs.id, node);
    }
    for (const child of node.children) visit(child);
  };
  visit(root);
  return index;
}

function resolveUseHref(attrs: Attrs): string | undefined {
  const href = attrs.href || attrs["xlink:href"];
  if (!href || !href.startsWith("#")) return undefined;
  return href.slice(1);
}

interface PaintContext {
  fill: string;
  opacity: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  fallback: string;
  gradients: Map<string, GradientStop>;
  idIndex: Map<string, XmlNode>;
  stylesheet: Map<string, Record<string, string>>;
}

function walk(node: XmlNode, matrix: Mat, ctx: PaintContext, out: FlattenedPolygon[], depth = 0) {
  if (VOID_UNSUPPORTED.has(node.tag)) return;
  if (hasUnsupportedBlendMode(node.attrs)) return;

  const classStyle = resolveClassStyle(node.attrs, ctx.stylesheet);
  // display:none hides the whole subtree, same as CSS. Real-world case:
  // Illustrator/Lottie exports with several duplicate animation-frame
  // groups, all but one hidden via a class rule rather than an attribute.
  if (classStyle?.display === "none") return;

  const ownMatrix = parseTransform(node.attrs.transform);
  const combined = multiplyMat(matrix, ownMatrix);
  const fillResolution = resolveFill(node.attrs, ctx.fill, ctx.fallback, ctx.gradients, classStyle);
  const resolvedFill = fillResolution.fill;
  const resolvedOpacity = resolveOpacity(node.attrs, ctx.opacity) * fillResolution.opacityMultiplier;
  const resolvedStroke = resolveStroke(node.attrs, ctx.stroke, ctx.fallback, classStyle);
  const resolvedStrokeWidth = resolveStrokeWidth(node.attrs, ctx.strokeWidth);
  const resolvedStrokeOpacity = resolveStrokeOpacity(node.attrs, ctx.strokeOpacity);

  const isFillNone = !resolvedFill || resolvedFill.toLowerCase() === "none";
  const hasStroke =
    Boolean(resolvedStroke) &&
    resolvedStroke.toLowerCase() !== "none" &&
    resolvedStrokeWidth > 0;
  // Only fall back to stroke-as-fill when there's genuinely no fill: an
  // icon that fills AND strokes a shape already looks right from the fill
  // alone (the thin outline on top is a minor, accepted omission).
  const strokeOnly = isFillNone && hasStroke;

  const childCtx: PaintContext = {
    ...ctx,
    fill: resolvedFill,
    opacity: resolvedOpacity,
    stroke: resolvedStroke,
    strokeWidth: resolvedStrokeWidth,
    strokeOpacity: resolvedStrokeOpacity,
  };

  const emit = (localPts: PathPoint[][]) => {
    if (isFillNone) return;
    for (const loop of localPts) {
      const pts: [number, number][] = loop.map((p) => applyMat(combined, p.x, p.y));
      if (pts.length >= 3) {
        out.push({ points: pts, fill: resolvedFill, opacity: resolvedOpacity });
      }
    }
  };

  const emitStroke = (subpaths: { points: PathPoint[]; closed: boolean }[]) => {
    if (!hasStroke) return;
    for (const sp of subpaths) {
      const ribbon = strokeSubpathToRibbon(sp.points, resolvedStrokeWidth, sp.closed);
      // Each quad/circle is pushed as its own element, deliberately not
      // merged into one polygon: they're all fully opaque and the same
      // color, so overlapping/touching pieces already tile seamlessly
      // with no visible join. Merging them via the slit technique was
      // tried and reverted - a long stroked path can fold back close to
      // itself (e.g. a wavy line's peaks and valleys), and nearest-point
      // bridging has no notion of path order, so it can bridge to the
      // "wrong" nearby edge and create self-intersections that cancel
      // large areas under nonzero fill instead of just union-ing (this
      // silently rendered a real icon, "midjourney", completely blank).
      for (const loop of ribbon) {
        const pts: [number, number][] = loop.map((p) => applyMat(combined, p.x, p.y));
        if (pts.length >= 3) {
          out.push({ points: pts, fill: resolvedStroke, opacity: resolvedStrokeOpacity });
        }
      }
    }
  };

  switch (node.tag) {
    case "path": {
      if (node.attrs.d) {
        try {
          if (strokeOnly) {
            emitStroke(flattenPathForStroke(node.attrs.d));
          } else {
            emit(flattenPathData(node.attrs.d));
          }
        } catch {
          // skip malformed path data rather than aborting the whole icon
        }
      }
      break;
    }
    case "rect": {
      const x = parseFloat(node.attrs.x || "0");
      const y = parseFloat(node.attrs.y || "0");
      const w = parseFloat(node.attrs.width || "0");
      const h = parseFloat(node.attrs.height || "0");
      if (w > 0 && h > 0) {
        const loop: PathPoint[] = [
          { x, y },
          { x: x + w, y },
          { x: x + w, y: y + h },
          { x, y: y + h },
        ];
        if (strokeOnly) emitStroke([{ points: loop, closed: true }]);
        else emit([loop]);
      }
      break;
    }
    case "circle":
    case "ellipse": {
      const cx = parseFloat(node.attrs.cx || "0");
      const cy = parseFloat(node.attrs.cy || "0");
      const rx = parseFloat(node.attrs.rx || node.attrs.r || "0");
      const ry = parseFloat(node.attrs.ry || node.attrs.r || "0");
      if (rx > 0 && ry > 0) {
        const loop: PathPoint[] = [];
        const steps = 32;
        for (let s = 0; s < steps; s++) {
          const t = (s / steps) * Math.PI * 2;
          loop.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) });
        }
        if (strokeOnly) emitStroke([{ points: loop, closed: true }]);
        else emit([loop]);
      }
      break;
    }
    case "polygon":
    case "polyline": {
      if (node.attrs.points) {
        const pts = pointsFromAttr(node.attrs.points);
        if (strokeOnly && pts.length >= 2) {
          // A <polygon> is implicitly closed even for its stroke; a
          // <polyline> is not.
          emitStroke([{ points: pts, closed: node.tag === "polygon" }]);
        } else if (!strokeOnly && pts.length >= 3) {
          emit([pts]);
        }
      }
      break;
    }
    case "use": {
      if (depth >= MAX_USE_DEPTH) {
        console.warn(`  svg-to-excalidraw: <use> nesting exceeded ${MAX_USE_DEPTH}, likely a cycle; skipping`);
        break;
      }
      const targetId = resolveUseHref(node.attrs);
      const target = targetId ? ctx.idIndex.get(targetId) : undefined;
      if (!target || target === node) break;

      // <use x, y> is a plain additional translate for an ordinary
      // referenced element. For a <symbol> target, x/y/width/height
      // instead establish a *viewport* that the symbol's own viewBox gets
      // fit into (real SVG-in-SVG semantics we don't implement) - treating
      // them as a plain translate double-counts an offset that a
      // hand-authored `transform` on the same <use> may already fully
      // compensate for (confirmed on a real icon: marqeta's use element
      // carries both `x="-752.1" y="-107.3"` *and*
      // `transform="matrix(0.37 0 0 0.37 278.3 39.7)"`, where the matrix
      // alone already maps the symbol's declared viewBox exactly onto the
      // root viewBox). So x/y are only applied when the target isn't a
      // <symbol>.
      let targetMatrix = combined;
      if (target.tag !== "symbol") {
        const ux = parseFloat(node.attrs.x || "0");
        const uy = parseFloat(node.attrs.y || "0");
        if (ux || uy) targetMatrix = multiplyMat(combined, [1, 0, 0, 1, ux, uy]);
      }

      if (VOID_UNSUPPORTED.has(target.tag)) {
        // The target is a container that's never painted directly (e.g. a
        // <symbol>, or a shape parked inside <defs> alongside real defs);
        // walk its children in its place instead of bailing on it.
        for (const child of target.children) {
          walk(child, targetMatrix, childCtx, out, depth + 1);
        }
      } else {
        walk(target, targetMatrix, childCtx, out, depth + 1);
      }
      break;
    }
    default:
      break;
  }

  for (const child of node.children) {
    walk(child, combined, childCtx, out, depth);
  }
}

function parseViewBox(root: XmlNode): { minX: number; minY: number; width: number; height: number } {
  const vb = root.attrs.viewBox || root.attrs.viewbox;
  if (vb) {
    const parts = vb.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
      return { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
    }
  }
  const width = parseFloat(root.attrs.width || "24") || 24;
  const height = parseFloat(root.attrs.height || "24") || 24;
  return { minX: 0, minY: 0, width, height };
}

/**
 * Parses an SVG string and flattens its visible fills into polygons, in
 * the SVG's own viewBox coordinate space (no normalization applied here).
 */
export function svgToPolygons(svgContent: string, fallbackFill: string): SvgToPolygonsResult {
  const root = parseXml(svgContent);
  if (!root || root.tag !== "svg") {
    return { shapes: [], viewBox: { minX: 0, minY: 0, width: 24, height: 24 } };
  }
  const viewBox = parseViewBox(root);
  const gradients = extractGradientColors(svgContent);
  const idIndex = buildIdIndex(root);
  const stylesheet = parseStylesheet(svgContent);
  const rootClassStyle = resolveClassStyle(root.attrs, stylesheet);
  const rootFillResolution = resolveFill(root.attrs, "#000000", fallbackFill, gradients, rootClassStyle);
  const rootCtx: PaintContext = {
    fill: rootFillResolution.fill,
    opacity: resolveOpacity(root.attrs, 1) * rootFillResolution.opacityMultiplier,
    // SVG initial values: no stroke, width 1, fully opaque.
    stroke: resolveStroke(root.attrs, "none", fallbackFill, rootClassStyle),
    strokeWidth: resolveStrokeWidth(root.attrs, 1),
    strokeOpacity: resolveStrokeOpacity(root.attrs, 1),
    fallback: fallbackFill,
    gradients,
    idIndex,
    stylesheet,
  };
  const shapes: FlattenedPolygon[] = [];
  for (const child of root.children) {
    walk(child, IDENTITY, rootCtx, shapes);
  }
  return { shapes, viewBox };
}
