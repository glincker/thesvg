import { add, dist, len, scale, sub, unit } from "./geom";
import type { Pt, Seg } from "./types";

type Cubic = Extract<Seg, { t: "C" }>;
type Arc = Extract<Seg, { t: "A" }>;

const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export function cubicAt(p0: Pt, s: Cubic, t: number): Pt {
  const a = lerp(p0, s.c1, t);
  const b = lerp(s.c1, s.c2, t);
  const c = lerp(s.c2, s.to, t);
  return lerp(lerp(a, b, t), lerp(b, c, t), t);
}

/** Split at t, returns the control points of both halves. */
export function splitCubic(p0: Pt, s: Cubic, t: number): [Cubic, Cubic] {
  const a = lerp(p0, s.c1, t);
  const b = lerp(s.c1, s.c2, t);
  const c = lerp(s.c2, s.to, t);
  const d = lerp(a, b, t);
  const e = lerp(b, c, t);
  const m = lerp(d, e, t);
  return [
    { t: "C", c1: a, c2: d, to: m },
    { t: "C", c1: e, c2: c, to: s.to },
  ];
}

/** Piece of a segment between two parameters, as a new segment starting at the point at t0. */
export function subSeg(p0: Pt, s: Seg, t0: number, t1: number): Seg {
  if (s.t === "L") return { t: "L", to: lerp(p0, s.to, t1) };
  if (s.t === "A") return s;
  const [left] = t1 >= 1 ? [s] : splitCubic(p0, s, t1);
  if (t0 <= 0) return left as Cubic;
  const start = cubicAt(p0, s, t0);
  const k = t1 >= 1 ? t0 : t0 / t1;
  const lp0 = p0;
  const [, right] = splitCubic(lp0, left as Cubic, k);
  void start;
  return right;
}

export function pointAt(p0: Pt, s: Seg, t: number): Pt {
  return s.t === "L" ? lerp(p0, s.to, t) : s.t === "C" ? cubicAt(p0, s, t) : lerp(p0, s.to, t);
}

/** Unit tangent at the start (end=false) or end (end=true) of a segment. */
export function edgeTangent(p0: Pt, s: Seg, end: boolean): Pt {
  if (s.t !== "C") return unit(sub(s.to, p0));
  const cands = end ? [sub(s.to, s.c2), sub(s.to, s.c1), sub(s.to, p0)] : [sub(s.c1, p0), sub(s.c2, p0), sub(s.to, p0)];
  for (const v of cands) if (len(v) > 1e-6) return unit(v);
  return { x: 0, y: 0 };
}

export function tangentAt(p0: Pt, s: Seg, t: number): Pt {
  if (s.t !== "C") return unit(sub(s.to, p0));
  const u = 1 - t;
  const d = add(
    add(scale(sub(s.c1, p0), 3 * u * u), scale(sub(s.c2, s.c1), 6 * u * t)),
    scale(sub(s.to, s.c2), 3 * t * t),
  );
  return len(d) > 1e-9 ? unit(d) : edgeTangent(p0, s, t > 0.5);
}

const SAMPLES = 40;

/** Cumulative arc length table over t in [0,1]. */
function table(p0: Pt, s: Seg): { ts: number[]; ls: number[] } {
  const ts: number[] = [];
  const ls: number[] = [];
  let prev = p0;
  let total = 0;
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const p = pointAt(p0, s, t);
    total += dist(prev, p);
    prev = p;
    ts.push(t);
    ls.push(total);
  }
  return { ts, ls };
}

export function segLength(p0: Pt, s: Seg): number {
  return table(p0, s).ls[SAMPLES] ?? 0;
}

/** Parameter reached after walking `d` of arc length from the start (fromEnd=false) or the end. */
export function tAtDistance(p0: Pt, s: Seg, d: number, fromEnd: boolean): number {
  const { ts, ls } = table(p0, s);
  const total = ls[SAMPLES] ?? 0;
  if (total <= 0) return fromEnd ? 1 : 0;
  const target = fromEnd ? total - Math.min(d, total) : Math.min(d, total);
  for (let i = 1; i <= SAMPLES; i++) {
    const l1 = ls[i] ?? 0;
    const l0 = ls[i - 1] ?? 0;
    if (l1 >= target) {
      const f = l1 === l0 ? 0 : (target - l0) / (l1 - l0);
      return (ts[i - 1] ?? 0) + f / SAMPLES;
    }
  }
  return 1;
}

/** Elliptical arc to cubic pieces of at most 90 degrees each. */
export function arcToCubics(p0: Pt, a: Arc): Seg[] {
  let rx = Math.abs(a.rx);
  let ry = Math.abs(a.ry);
  if (rx < 1e-9 || ry < 1e-9 || dist(p0, a.to) < 1e-9) return [{ t: "L", to: a.to }];
  const phi = (a.rot * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (p0.x - a.to.x) / 2;
  const dy = (p0.y - a.to.y) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  const lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lam > 1) {
    const s = Math.sqrt(lam);
    rx *= s;
    ry *= s;
  }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const co = (a.large === a.sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (co * rx * y1) / ry;
  const cyp = (-co * ry * x1) / rx;
  const cx = cos * cxp - sin * cyp + (p0.x + a.to.x) / 2;
  const cy = sin * cxp + cos * cyp + (p0.y + a.to.y) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number): number => {
    const s = ux * vy - uy * vx;
    return Math.atan2(s, ux * vx + uy * vy);
  };
  const th1 = ang(1, 0, (x1 - cxp) / rx, (y1 - cyp) / ry);
  let dth = ang((x1 - cxp) / rx, (y1 - cyp) / ry, (-x1 - cxp) / rx, (-y1 - cyp) / ry);
  if (!a.sweep && dth > 0) dth -= 2 * Math.PI;
  if (a.sweep && dth < 0) dth += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(dth) / (Math.PI / 2) - 1e-9));
  const step = dth / n;
  const k = (4 / 3) * Math.tan(step / 4);
  const pt = (t: number): Pt => ({
    x: cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin,
    y: cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos,
  });
  const dv = (t: number): Pt => ({
    x: -rx * Math.sin(t) * cos - ry * Math.cos(t) * sin,
    y: -rx * Math.sin(t) * sin + ry * Math.cos(t) * cos,
  });
  const out: Seg[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = th1 + i * step;
    const t1 = t0 + step;
    const p = pt(t0);
    const q = i === n - 1 ? a.to : pt(t1);
    const d0 = dv(t0);
    const d1 = dv(t1);
    out.push({ t: "C", c1: { x: p.x + k * d0.x, y: p.y + k * d0.y }, c2: { x: q.x - k * d1.x, y: q.y - k * d1.y }, to: q });
  }
  return out;
}
