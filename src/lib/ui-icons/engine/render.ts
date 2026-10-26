import SVGPathCommander from "svg-path-commander";
import { DEFAULT_ENGINE, DEFAULT_STYLE, type EngineConfig } from "./config";
import { defillet } from "./defillet";
import { arcsToCubics, facet } from "./facet";
import { fillet } from "./fillet";
import { pointInPolygon } from "./geom";
import { nodesToShapes } from "./parse";
import { scaleShapes } from "./transform";
import { edgeTangent } from "./curves";
import { anchorsOf, subpathsToD } from "./serialize";
import type { IconNode, Pt, Shape, StyleParams, Variant } from "./types";

export interface RenderOptions {
  variant?: Variant;
  style?: Partial<StyleParams>;
  engine?: Partial<EngineConfig>;
  /** Unique per rendered svg, masks use it for their id. */
  idPrefix?: string;
  size?: number;
}

export interface RenderMeta {
  /** Closed or silhouette shapes that fill, duotone and glass can paint. */
  bodies: number;
  /** Shapes knocked out of a body in the fill variant. */
  holes: number;
  /** Lit pixel runs in the pixel variant. */
  pixelRuns: number;
  /** True when the variant needs a body but the glyph is line only, so it renders as a bolder outline. */
  fallback: boolean;
}

export interface RenderResult {
  meta: RenderMeta;
  svg: string;
  d: string[];
  anchors: Pt[];
  handles: [Pt, Pt][];
}

const closedOf = (sh: Shape): boolean => sh.subpaths.some((s) => s.closed);

function restyle(shapes: Shape[], style: StyleParams, cfg: EngineConfig): Shape[] {
  return shapes.map((sh) => ({
    subpaths: sh.subpaths.map((sp) => {
      const smooth = style.corner === "source" && style.facetAngle <= 0;
      if (smooth) return sp;
      const base = style.corner === "source" ? sp : defillet(sp, cfg);
      return fillet(facet(arcsToCubics(base), style.facetAngle), style, cfg);
    }),
  }));
}

function flatten(d: string, samples: number): Pt[] {
  const spc = new SVGPathCommander(d);
  const total = spc.getTotalLength();
  const out: Pt[] = [];
  for (let i = 0; i < samples; i++) {
    const p = spc.getPointAtLength((total * i) / samples);
    out.push({ x: p.x, y: p.y });
  }
  return out;
}

/** Lit cells are those whose centre lies within reach of a stroke centreline, merged into row runs. */
function pixelPath(ds: string[], style: StyleParams, cfg: EngineConfig): string {
  const n = Math.max(4, Math.round(style.pixelGrid));
  const cell = cfg.viewBox / n;
  const reach = (style.strokeWidth / 2) * style.pixelReach;
  const lines: Pt[][] = ds.flatMap((d) =>
    d
      .split("M")
      .filter(Boolean)
      .map((part) => {
        const spc = new SVGPathCommander(`M${part}`);
        const total = spc.getTotalLength();
        const count = Math.max(2, Math.ceil(total / (cell / 2)));
        return Array.from({ length: count + 1 }, (_, i) => {
          const q = spc.getPointAtLength((total * i) / count);
          return { x: q.x, y: q.y };
        });
      }),
  );
  const lit: boolean[][] = [];
  for (let r = 0; r < n; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < n; c++) {
      const cx = (c + 0.5) * cell;
      const cy = (r + 0.5) * cell;
      row.push(lines.some((l) => l.some((q) => Math.hypot(q.x - cx, q.y - cy) <= reach)));
    }
    lit.push(row);
  }
  const f = (v: number): string => String(Math.round(v * 1000) / 1000);
  let out = "";
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!lit[r]?.[c]) {
        c++;
        continue;
      }
      let e = c;
      while (lit[r]?.[e + 1]) e++;
      out += `M${f(c * cell)} ${f(r * cell)}h${f((e - c + 1) * cell)}v${f(cell)}h${f(-(e - c + 1) * cell)}z`;
      c = e + 1;
    }
  }
  return out;
}

/** Mask that removes a 45 degree wedge from every open stroke end. */
function cutWedges(shapes: Shape[], style: StyleParams, cfg: EngineConfig = DEFAULT_ENGINE): string {
  const hw = style.strokeWidth / 2;
  const f = (v: number): string => String(Math.round(v * 100) / 100);
  const wedges: string[] = [];
  const wedge = (p: Pt, out: Pt): void => {
    const n = { x: -out.y, y: out.x };
    const a = { x: p.x + n.x * hw, y: p.y + n.y * hw };
    const b = { x: a.x - out.x * 2 * hw, y: a.y - out.y * 2 * hw };
    const c = { x: p.x - n.x * hw, y: p.y - n.y * hw };
    // Pad the wedge outwards so round caps and joins beyond the end are removed as well.
    const a2 = { x: a.x + out.x * hw * 2, y: a.y + out.y * hw * 2 };
    const c2 = { x: c.x + out.x * hw * 2, y: c.y + out.y * hw * 2 };
    wedges.push(`<polygon points="${f(a.x)},${f(a.y)} ${f(a2.x)},${f(a2.y)} ${f(c2.x)},${f(c2.y)} ${f(c.x)},${f(c.y)} ${f(b.x)},${f(b.y)}" fill="#000"/>`);
  };
  for (const sh of shapes) {
    for (const sp of sh.subpaths) {
      if (sp.closed || sp.segs.length === 0) continue;
      let chord = 0;
      let at = sp.start;
      for (const g of sp.segs) {
        chord += Math.hypot(g.to.x - at.x, g.to.y - at.y);
        at = g.to;
      }
      if (chord < cfg.cutMinLength) continue;
      const first = sp.segs[0];
      const last = sp.segs[sp.segs.length - 1];
      const before = sp.segs.length > 1 ? (sp.segs[sp.segs.length - 2]?.to ?? sp.start) : sp.start;
      if (!first || !last) continue;
      const tin = edgeTangent(sp.start, first, false);
      wedge(sp.start, { x: -tin.x, y: -tin.y });
      wedge(last.to, edgeTangent(before, last, true));
    }
  }
  return wedges.join("");
}

function cutMask(shapes: Shape[], style: StyleParams, cfg: EngineConfig, id: string): string {
  const w = cutWedges(shapes, style, cfg);
  if (!w) return "";
  const m = cfg.viewBox;
  return `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-2" y="-2" width="${m + 4}" height="${m + 4}"><rect x="-2" y="-2" width="${m + 4}" height="${m + 4}" fill="#fff"/>${w}</mask></defs>`;
}

/** Blurred dark ellipse clipped to the glyph bodies, offset to the lower right, so the pane reads as thick glass. */
function glassDepth(poly: Pt[], ds: string[], bodies: number[], gid: string, strength: number): { defs: string; layer: string } {
  const xs = poly.map((p) => p.x);
  const ys = poly.map((p) => p.y);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const w = x1 - Math.min(...xs);
  const h = y1 - y0;
  const f = (v: number): string => String(Math.round(v * 100) / 100);
  const clip = `<clipPath id="${gid}c">${bodies.map((i) => `<path d="${ds[i]}"/>`).join("")}</clipPath>`;
  const blur = `<filter id="${gid}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(Math.max(1.2, w * 0.12))}"/></filter>`;
  const layer = `<g clip-path="url(#${gid}c)"><ellipse cx="${f(x1 - w * 0.08)}" cy="${f(y1 - h * 0.28)}" rx="${f(w * 0.12)}" ry="${f(h * 0.34)}" transform="rotate(25 ${f(x1 - w * 0.08)} ${f(y1 - h * 0.28)})" fill="#000" opacity="${strength}" filter="url(#${gid}b)"/></g>`;
  return { defs: clip + blur, layer };
}

const f2 = (v: number): string => String(Math.round(v * 100) / 100);

function polygonArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    if (p && q) a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

function insideRatio(detail: Pt[], poly: Pt[]): number {
  if (detail.length === 0) return 0;
  return detail.filter((p) => pointInPolygon(p, poly)).length / detail.length;
}

export function renderIcon(nodes: IconNode[], opts: RenderOptions = {}): RenderResult {
  const style: StyleParams = { ...DEFAULT_STYLE, ...opts.style };
  const cfg: EngineConfig = { ...DEFAULT_ENGINE, ...opts.engine };
  const variant = opts.variant ?? "outline";
  const mid = cfg.viewBox / 2;
  const shapes = restyle(scaleShapes(nodesToShapes(nodes), style.scale, { x: mid, y: mid }), style, cfg);
  const ds = shapes.map((sh) => subpathsToD(sh.subpaths));
  const all = shapes.flatMap((sh) => sh.subpaths);
  const { anchors, handles } = anchorsOf(all);
  const size = opts.size ?? cfg.viewBox;
  const sw = `stroke-width="${style.strokeWidth}" stroke-linecap="${style.cap}" stroke-linejoin="${style.join}"`;
  // Each shape gets its own cut mask so a wedge never eats a neighbouring stroke.
  const cuts = shapes.map((sh, i) => (style.cutTerminals ? cutMask([sh], style, cfg, `${opts.idPrefix ?? "m"}-c${i}`) : ""));
  const strokeAll = `${cuts.join("")}<g fill="none" stroke="currentColor" ${sw}>${ds
    .map((d, i) => `<path d="${d}"${cuts[i] ? ` mask="url(#${opts.idPrefix ?? "m"}-c${i})"` : ""}/>`)
    .join("")}</g>`;
  const tone = /^#[0-9a-f]{6}$/i.test(style.accent) ? style.accent : "currentColor";
  const meta: RenderMeta = { bodies: 0, holes: 0, pixelRuns: 0, fallback: false };
  const wrap = (inner: string): string =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${cfg.viewBox} ${cfg.viewBox}" overflow="visible">${inner}</svg>`;

  if (variant === "outline") return { svg: wrap(strokeAll), d: ds, anchors, handles, meta };

  if (variant === "pixel") {
    const pd = pixelPath(ds, style, cfg);
    meta.pixelRuns = (pd.match(/M/g) ?? []).length;
    return {
      meta,
      svg: wrap(`<path d="${pd}" fill="currentColor" shape-rendering="crispEdges"/>`),
      d: ds,
      anchors,
      handles,
    };
  }

  const polys = ds.map((d) => flatten(d, cfg.flattenSamples * 2));
  const isBodyCandidate = (i: number): boolean => {
    if (closedOf(shapes[i] ?? { subpaths: [] })) return true;
    const poly = polys[i] ?? [];
    if (poly.length < 3) return false;
    const xs = poly.map((p) => p.x);
    const ys = poly.map((p) => p.y);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    if (w < cfg.fillOpenMinSpan || h < cfg.fillOpenMinSpan) return false;
    const first = poly[0];
    const last = poly[poly.length - 1];
    const chord = first && last ? Math.hypot(first.x - last.x, first.y - last.y) : 0;
    return polygonArea(poly) / (w * h) >= cfg.fillOpenMinRatio && chord <= cfg.fillOpenMaxChord * Math.max(w, h);
  };
  const candidates = shapes.map((_, i) => i).filter(isBodyCandidate);
  // Bodies are candidates that no other candidate contains, so order in the source never matters.
  const bodies = candidates.filter(
    (i) => !candidates.some((j) => j !== i && insideRatio(polys[i] ?? [], polys[j] ?? []) > 0.6),
  );
  const rest = shapes.map((_, i) => i).filter((i) => !bodies.includes(i));
  const holes = rest.filter((i) => bodies.some((b) => insideRatio(polys[i] ?? [], polys[b] ?? []) > 0.6));
  const free = rest.filter((i) => !holes.includes(i));
  meta.bodies = bodies.length;
  meta.holes = holes.length;
  meta.fallback = bodies.length === 0;
  if (variant === "fill" && meta.fallback) {
    // Line-only glyphs have nothing to fill. Keep the same shapes and cut ends, just heavier, so the active
    // state reads as the same icon at a higher weight.
    const heavy: StyleParams = { ...style, strokeWidth: Math.round(style.strokeWidth * style.fillFallbackBoost * 100) / 100 };
    const heavyCuts = shapes.map((sh, i) => (style.cutTerminals ? cutMask([sh], heavy, cfg, `${opts.idPrefix ?? "m"}-h${i}`) : ""));
    const bold = `${heavyCuts.join("")}<g fill="none" stroke="currentColor" stroke-width="${heavy.strokeWidth}" stroke-linecap="${style.cap}" stroke-linejoin="${style.join}">${ds
      .map((d, i) => `<path d="${d}"${heavyCuts[i] ? ` mask="url(#${opts.idPrefix ?? "m"}-h${i})"` : ""}/>`)
      .join("")}</g>`;
    return { svg: wrap(bold), d: ds, anchors, handles, meta };
  }

  if (variant === "offset") {
    const tr = `translate(${style.offsetX} ${style.offsetY})`;
    const back = bodies.map((i) => `<path d="${ds[i]}" fill="${tone}" stroke="none"/>`).join("");
    const ghost = rest
      .map((i) => `<path d="${ds[i]}" fill="none" stroke="${tone}" ${sw}/>`)
      .join("");
    // Group opacity composites the shadow once, so overlapping shapes do not stack into darker patches.
    return {
      svg: wrap(`<g opacity="${style.duotoneOpacity}" transform="${tr}">${back}${ghost}</g>${strokeAll}`),
      d: ds,
      anchors,
      handles,
      meta,
    };
  }

  if (variant === "glass") {
    const gid = `${opts.idPrefix ?? "m"}-g`;
    const m = cfg.viewBox;
    const margin = 2;
    const lineOnly = bodies.length === 0;
    const rim = lineOnly ? [1, 0.55] : [1, 0.12];
    const edgeW = Math.round((lineOnly ? Math.max(1.4, style.strokeWidth * 1.6) : Math.max(0.75, style.strokeWidth * 0.6)) * 100) / 100;
    // Light comes from above: the pane and the rim both fade towards the bottom.
    const defs0 = `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${m}"><stop offset="0" stop-color="${tone}" stop-opacity="0.78"/><stop offset="1" stop-color="${tone}" stop-opacity="0.36"/></linearGradient><linearGradient id="${gid}e" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${m}"><stop offset="0" stop-color="currentColor" stop-opacity="${rim[0]}"/><stop offset="1" stop-color="currentColor" stop-opacity="${rim[1]}"/></linearGradient>`;
    const bodyPoly = bodies.flatMap((i) => polys[i] ?? []);
    const depth = style.glassDepth > 0 && bodies.length > 0 && bodyPoly.length > 0 ? glassDepth(bodyPoly, ds, bodies, gid, style.glassDepth) : { defs: "", layer: "" };
    const rimIdx = [...bodies, ...free];
    const defs = `<defs>${defs0}${depth.defs}<mask id="${gid}m" maskUnits="userSpaceOnUse" x="${-margin}" y="${-margin}" width="${m + margin * 2}" height="${m + margin * 2}">${rimIdx
      .map(
        (i) =>
          `<path d="${ds[i]}" fill="none" stroke="#fff" stroke-width="${edgeW}" stroke-linecap="${style.cap}" stroke-linejoin="${style.join}"/>`,
      )
      .join("")}${style.cutTerminals ? cutWedges(shapes, { ...style, strokeWidth: edgeW }, cfg) : ""}</mask></defs>`;
    const pane = bodies.map((i) => `<path d="${ds[i]}" fill="url(#${gid})" stroke="none"/>`).join("");
    // One opaque union of every stroke, painted through a single gradient: overlaps never double up.
    const edge = `<rect x="${-margin}" y="${-margin}" width="${m + margin * 2}" height="${m + margin * 2}" fill="url(#${gid}e)" mask="url(#${gid}m)"/>`;
    const openHolesG = holes.filter((i) => !closedOf(shapes[i] ?? { subpaths: [] }));
    const outsideMaskG = `<mask id="${gid}o" maskUnits="userSpaceOnUse" x="-2" y="-2" width="${m + 4}" height="${m + 4}"><rect x="-2" y="-2" width="${m + 4}" height="${m + 4}" fill="#fff"/>${bodies.map((i) => `<path d="${ds[i]}" fill="#000"/>`).join("")}</mask>`;
    const sticking = openHolesG
      .map((i) => `<path d="${ds[i]}" fill="none" stroke="url(#${gid}e)" stroke-width="${edgeW}" stroke-linecap="${style.cap}" stroke-linejoin="${style.join}" mask="url(#${gid}o)"/>`)
      .join("");
    const etch = holes
      .map(
        (i) =>
          `<path d="${ds[i]}" fill="none" stroke="#000" stroke-opacity="0.92" stroke-width="${Math.round(Math.max(0.9, edgeW * 1.4) * 100) / 100}" stroke-linecap="${style.cap}" stroke-linejoin="${style.join}"/>`,
      )
      .join("");
    // Details are cut out of the pane, not painted on it. Painted dark ink only reads on a light pane, which is a dark page.
    // A cut-out shows whatever is behind the icon, so it stays readable on both light and dark pages.
    const paneMask = `<mask id="${gid}p" maskUnits="userSpaceOnUse" x="-2" y="-2" width="${m + 4}" height="${m + 4}"><rect x="-2" y="-2" width="${m + 4}" height="${m + 4}" fill="#fff"/>${etch}</mask>`;
    const withMasks = defs.replace("</defs>", `${paneMask}${outsideMaskG}</defs>`);
    return { svg: wrap(withMasks + `<g mask="url(#${gid}p)">${pane}${depth.layer}</g>` + sticking + edge), d: ds, anchors, handles, meta };
  }

  if (variant === "depth") {
    const n = Math.max(1, Math.ceil(style.depth / 0.2));
    const a = (style.depthAngle * Math.PI) / 180;
    const step = style.depth / n;
    const layer = (i: number, ink: string): string => {
      const tr = `translate(${f2(Math.cos(a) * step * i)} ${f2(Math.sin(a) * step * i)})`;
      const solid = bodies.map((b) => `<path d="${ds[b]}" fill="${ink}" stroke="${ink}" ${sw}/>`).join("");
      const lines = [...holes, ...free].map((k) => `<path d="${ds[k]}" fill="none" stroke="${ink}" ${sw}/>`).join("");
      return `<g transform="${tr}">${solid}${lines}</g>`;
    };
    // Sides are the face color at half strength, never black: on a light page the face is dark and the sides a
    // lighter grey, on a dark page the reverse. Black would vanish into a dark face.
    const sides = Array.from({ length: n }, (_, k) => layer(n - k, tone)).join("");
    // Face reuses the fill look, so details stay knocked out and line-only glyphs fall back to a bold outline.
    const face = renderIcon(nodes, { ...opts, variant: "fill", idPrefix: `${opts.idPrefix ?? "m"}-f` }).svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    // Light from the top left: the face fades to a darker lower right, and a thin bright edge runs along the lit sides.
    const gid = `${opts.idPrefix ?? "m"}-dl`;
    const lit =
      bodies.length > 0
        ? `<defs><linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${cfg.viewBox}" y2="${cfg.viewBox}"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.34"/></linearGradient></defs>${bodies.map((b) => `<path d="${ds[b]}" fill="url(#${gid})" stroke="none"/>`).join("")}`
        : "";
    return {
      svg: wrap(`<g opacity="0.45">${sides}</g>${face}${lit}`),
      d: ds,
      anchors,
      handles,
      meta,
    };
  }

  if (variant === "duotone") {
    const back = bodies
      .map((i) => `<path d="${ds[i]}" fill="${tone}" opacity="${style.duotoneOpacity}"/>`)
      .join("");
    return { svg: wrap(back + strokeAll), d: ds, anchors, handles, meta };
  }

  const prefix = opts.idPrefix ?? "m";
  const knockW = Math.round((style.strokeWidth + style.fillGap * 2) * 100) / 100;
  const openHoles = holes.filter((i) => !closedOf(shapes[i] ?? { subpaths: [] }));
  // Open details (a handle, a strap) are cut with a thin line, a full stroke width would carve the body into bars.
  const holeW = Math.round(Math.max(0.75, style.strokeWidth * 0.55 + style.fillGap * 0.4) * 100) / 100;
  const knock = holes
    .map((i) => {
      const closed = closedOf(shapes[i] ?? { subpaths: [] });
      // A big inner shape (the meridian of a globe) is cut as a line, only small ones (a pupil, a gear hole) are punched out.
      const host = bodies.find((b) => insideRatio(polys[i] ?? [], polys[b] ?? []) > 0.6);
      const share = host === undefined ? 0 : polygonArea(polys[i] ?? []) / Math.max(1e-6, polygonArea(polys[host] ?? []));
      const fillIt = closed && share < 0.3;
      return `<path d="${ds[i]}" fill="${fillIt ? "#000" : "none"}" stroke="#000" stroke-width="${fillIt ? knockW : holeW}" stroke-linecap="${style.cap}" stroke-linejoin="${style.join}"/>`;
    })
    .join("");
  const mask = `<mask id="${prefix}-k" maskUnits="userSpaceOnUse" x="0" y="0" width="${cfg.viewBox}" height="${cfg.viewBox}"><rect width="${cfg.viewBox}" height="${cfg.viewBox}" fill="#fff"/>${knock}</mask>`;
  // Everything outside the solid bodies, used to keep the part of an open detail that sticks out above or beside one.
  const outsideMask = `<mask id="${prefix}-o" maskUnits="userSpaceOnUse" x="-2" y="-2" width="${cfg.viewBox + 4}" height="${cfg.viewBox + 4}"><rect x="-2" y="-2" width="${cfg.viewBox + 4}" height="${cfg.viewBox + 4}" fill="#fff"/>${bodies.map((i) => `<path d="${ds[i]}" fill="#000"/>`).join("")}</mask>`;
  const solid = bodies
    .map((i) => `<path d="${ds[i]}" fill="currentColor" stroke="currentColor" ${sw} mask="url(#${prefix}-k)"/>`)
    .join("");
  const outside = free.map((i) => `<path d="${ds[i]}" fill="none" stroke="currentColor" ${sw}/>`).join("");
  const sticking = openHoles.map((i) => `<path d="${ds[i]}" fill="none" stroke="currentColor" ${sw} mask="url(#${prefix}-o)"/>`).join("");
  return { svg: wrap(`<defs>${mask}${outsideMask}</defs>${solid}${sticking}${outside}`), d: ds, anchors, handles, meta };
}
