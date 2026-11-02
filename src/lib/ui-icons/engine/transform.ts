import type { Pt, Seg, Shape } from "./types";

/** Scale every shape about a centre point. Radii scale too, stroke width does not. */
export function scaleShapes(shapes: Shape[], k: number, centre: Pt): Shape[] {
  if (Math.abs(k - 1) < 1e-6) return shapes;
  const p = (a: Pt): Pt => ({ x: centre.x + (a.x - centre.x) * k, y: centre.y + (a.y - centre.y) * k });
  const seg = (s: Seg): Seg =>
    s.t === "L" ? { t: "L", to: p(s.to) }
    : s.t === "C" ? { t: "C", c1: p(s.c1), c2: p(s.c2), to: p(s.to) }
    : { ...s, rx: s.rx * k, ry: s.ry * k, to: p(s.to) };
  return shapes.map((sh) => ({ subpaths: sh.subpaths.map((sp) => ({ ...sp, start: p(sp.start), segs: sp.segs.map(seg) })) }));
}
