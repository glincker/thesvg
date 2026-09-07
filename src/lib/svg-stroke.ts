/**
 * Stroke-to-fill expansion: turns a stroked point sequence (from
 * `parsePathSubpaths` in svg-path-data.ts) into filled ribbon polygons,
 * since Excalidraw's "line" elements only support solid fills, not
 * strokes on their own. See svg-path-to-polygons.ts's module doc for why
 * this exists: `fill="none"` + `stroke` outline logos would otherwise
 * silently render as nothing.
 */

import { parsePathSubpaths, type PathPoint, type RawSubpath } from "./svg-path-data";

/** Raw (unmerged), open-or-closed-as-authored subpaths for stroke
 * expansion: a stroke follows the path exactly as drawn, unlike fill,
 * which implicitly closes every subpath. */
export function flattenPathForStroke(d: string): RawSubpath[] {
  return parsePathSubpaths(d).filter((sp) => sp.points.length >= 2);
}

const STROKE_JOINT_CIRCLE_STEPS = 12;

function circleLoop(cx: number, cy: number, r: number): PathPoint[] {
  const loop: PathPoint[] = [];
  for (let s = 0; s < STROKE_JOINT_CIRCLE_STEPS; s++) {
    const t = (s / STROKE_JOINT_CIRCLE_STEPS) * Math.PI * 2;
    loop.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return loop;
}

/**
 * Expands a stroked point sequence into filled ribbon polygons: one quad
 * per segment plus a circle at every vertex. The circles double as both
 * round joins (filling the gap between adjacent segment quads at a bend)
 * and round end caps for open subpaths; this approximates miter/bevel
 * joins and butt/square caps as round too, which is visually
 * indistinguishable at icon scale (see the module doc for why this
 * trade-off is worth it: a plain outline logo would otherwise render as
 * nothing at all).
 *
 * Each piece is returned separately, not merged into one polygon: they're
 * all fully opaque and the same color, so overlapping/touching pieces
 * already tile seamlessly with no visible join. A merge was tried here
 * and reverted (see svg-to-excalidraw.ts's module doc) since a long
 * stroked path can fold back close to itself, and nearest-point bridging
 * has no notion of path order, so it can bridge to the wrong nearby edge
 * and self-intersect.
 */
export function strokeSubpathToRibbon(
  points: PathPoint[],
  strokeWidth: number,
  closed: boolean,
): PathPoint[][] {
  if (points.length < 2 || strokeWidth <= 0) return [];
  const hw = strokeWidth / 2;
  const polys: PathPoint[][] = [];

  const segmentCount = closed ? points.length : points.length - 1;
  for (let i = 0; i < segmentCount; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-9) continue;
    const nx = (-dy / len) * hw;
    const ny = (dx / len) * hw;
    polys.push([
      { x: p0.x + nx, y: p0.y + ny },
      { x: p1.x + nx, y: p1.y + ny },
      { x: p1.x - nx, y: p1.y - ny },
      { x: p0.x - nx, y: p0.y - ny },
    ]);
  }

  for (const p of points) {
    polys.push(circleLoop(p.x, p.y, hw));
  }

  return polys;
}
