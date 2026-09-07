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
 *   Elements inside `<defs>` still never render on their own, only via a
 *   `<use>` reference. `<mask>`/`<clipPath>` are not applied (the masked
 *   content just renders unclipped) since real alpha masking is out of
 *   scope; `<text>` and stroke-only shapes are skipped.
 */

import { IDENTITY, applyMat, multiplyMat, parseTransform, type Mat } from "./svg-matrix";
import { NumScanner, flattenPathData, type PathPoint } from "./svg-path-data";

export interface FlattenedPolygon {
  points: [number, number][];
  fill: string;
  opacity: number;
}

export interface SvgToPolygonsResult {
  shapes: FlattenedPolygon[];
  viewBox: { minX: number; minY: number; width: number; height: number };
}

interface Attrs {
  [key: string]: string;
}

function parseAttrs(tagBody: string): Attrs {
  const attrs: Attrs = {};
  const re = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tagBody))) {
    attrs[m[1]] = m[2] !== undefined ? m[2] : m[3];
  }
  return attrs;
}

interface XmlNode {
  tag: string;
  attrs: Attrs;
  children: XmlNode[];
  selfClosing: boolean;
}

const VOID_UNSUPPORTED = new Set([
  "defs",
  "clippath",
  "mask",
  "style",
  "title",
  "desc",
  "symbol",
  "text",
  "tspan",
  "filter",
  "lineargradient",
  "radialgradient",
  "metadata",
]);

/** Safety cap on <use> -> <use> chains, in case of a reference cycle. */
const MAX_USE_DEPTH = 10;

/** Extremely small XML tag walker, sufficient for well-formed icon SVGs. */
function parseXml(src: string): XmlNode | null {
  const cleaned = src
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "");

  const tagRe = /<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  const stack: XmlNode[] = [];
  let root: XmlNode | null = null;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(cleaned))) {
    const [, closing, tagNameRaw, body, selfClose] = m;
    const tagName = tagNameRaw.toLowerCase();
    if (closing) {
      if (stack.length && stack[stack.length - 1].tag === tagName) {
        stack.pop();
      }
      continue;
    }
    const node: XmlNode = {
      tag: tagName,
      attrs: parseAttrs(body),
      children: [],
      selfClosing: Boolean(selfClose),
    };
    if (!root) root = node;
    if (stack.length) stack[stack.length - 1].children.push(node);
    if (!selfClose) stack.push(node);
  }
  return root;
}

/**
 * Extracts a representative solid color per gradient id, from its first
 * `<stop>`. Many brand marks layer a white-to-transparent gradient as a
 * highlight over a solid-color base shape (e.g. Next.js); resolving those
 * to the gradient's own first stop (usually white) keeps the highlight
 * visible instead of collapsing it onto the same fallback color as the
 * shape underneath it.
 */
function extractGradientColors(svgContent: string): Map<string, string> {
  const map = new Map<string, string>();
  const gradRe = /<(linearGradient|radialGradient)\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = gradRe.exec(svgContent))) {
    const id = m[2];
    const body = m[3];
    const stopColor =
      /<stop\b[^>]*\bstop-color="([^"]+)"/i.exec(body) ||
      /<stop\b[^>]*\bstyle="[^"]*stop-color:\s*([^;"]+)/i.exec(body);
    if (stopColor) map.set(id, stopColor[1].trim());
  }
  return map;
}

function resolveFill(
  attrs: Attrs,
  inherited: string,
  fallback: string,
  gradients: Map<string, string>,
): string {
  let fill = attrs.fill;
  if (!fill) {
    const style = attrs.style;
    if (style) {
      const m = /fill\s*:\s*([^;]+)/.exec(style);
      if (m) fill = m[1].trim();
    }
  }
  if (!fill) return inherited;
  const trimmed = fill.trim();
  if (trimmed === "currentColor") return fallback;
  if (trimmed.startsWith("url(")) {
    const idMatch = /url\(#([^)]+)\)/.exec(trimmed);
    const resolved = idMatch && gradients.get(idMatch[1]);
    return resolved || fallback;
  }
  return trimmed;
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

function walk(
  node: XmlNode,
  matrix: Mat,
  fill: string,
  opacity: number,
  fallback: string,
  gradients: Map<string, string>,
  idIndex: Map<string, XmlNode>,
  out: FlattenedPolygon[],
  depth = 0,
) {
  if (VOID_UNSUPPORTED.has(node.tag)) return;

  const ownMatrix = parseTransform(node.attrs.transform);
  const combined = multiplyMat(matrix, ownMatrix);
  const resolvedFill = resolveFill(node.attrs, fill, fallback, gradients);
  const resolvedOpacity = resolveOpacity(node.attrs, opacity);

  const emit = (localPts: PathPoint[][]) => {
    if (!resolvedFill || resolvedFill.toLowerCase() === "none") return;
    for (const loop of localPts) {
      const pts: [number, number][] = loop.map((p) => applyMat(combined, p.x, p.y));
      if (pts.length >= 3) {
        out.push({ points: pts, fill: resolvedFill, opacity: resolvedOpacity });
      }
    }
  };

  switch (node.tag) {
    case "path": {
      if (node.attrs.d) {
        try {
          emit(flattenPathData(node.attrs.d));
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
        emit([
          [
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + h },
            { x, y: y + h },
          ],
        ]);
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
        emit([loop]);
      }
      break;
    }
    case "polygon":
    case "polyline": {
      if (node.attrs.points) {
        const pts = pointsFromAttr(node.attrs.points);
        if (pts.length >= 3) emit([pts]);
      }
      break;
    }
    case "use": {
      if (depth >= MAX_USE_DEPTH) {
        console.warn(`  svg-to-excalidraw: <use> nesting exceeded ${MAX_USE_DEPTH}, likely a cycle; skipping`);
        break;
      }
      const targetId = resolveUseHref(node.attrs);
      const target = targetId ? idIndex.get(targetId) : undefined;
      if (!target || target === node) break;

      // <use x, y> is an additional translate applied to the referenced
      // content, on top of the use element's own transform (already
      // folded into `combined` above).
      const ux = parseFloat(node.attrs.x || "0");
      const uy = parseFloat(node.attrs.y || "0");
      const targetMatrix = ux || uy ? multiplyMat(combined, [1, 0, 0, 1, ux, uy]) : combined;

      if (VOID_UNSUPPORTED.has(target.tag)) {
        // The target is a container that's never painted directly (e.g. a
        // <symbol>, or a shape parked inside <defs> alongside real defs);
        // walk its children in its place instead of bailing on it.
        for (const child of target.children) {
          walk(child, targetMatrix, resolvedFill, resolvedOpacity, fallback, gradients, idIndex, out, depth + 1);
        }
      } else {
        walk(target, targetMatrix, resolvedFill, resolvedOpacity, fallback, gradients, idIndex, out, depth + 1);
      }
      break;
    }
    default:
      break;
  }

  for (const child of node.children) {
    walk(child, combined, resolvedFill, resolvedOpacity, fallback, gradients, idIndex, out, depth);
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
  const rootFill = resolveFill(root.attrs, "#000000", fallbackFill, gradients);
  const rootOpacity = resolveOpacity(root.attrs, 1);
  const shapes: FlattenedPolygon[] = [];
  for (const child of root.children) {
    walk(child, IDENTITY, rootFill, rootOpacity, fallbackFill, gradients, idIndex, shapes);
  }
  return { shapes, viewBox };
}
