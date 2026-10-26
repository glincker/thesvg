import type { EngineConfig } from "./config";
import { edgeTangent, pointAt, segLength, subSeg, tAtDistance, tangentAt } from "./curves";
import { add, cross, dist, dot, scale, sub } from "./geom";
import type { Pt, Seg, StyleParams, Subpath } from "./types";

interface Cut {
  p1: Pt;
  p2: Pt;
  tEnd: number;
  tStart: number;
  fillet: Seg;
}

/**
 * Re-round every corner between lines and cubics with the chosen corner style.
 * Expects arcs to be converted already, except line to line round corners keep true arcs.
 */
export function fillet(input: Subpath, style: StyleParams, cfg: EngineConfig): Subpath {
  if (style.corner === "source" || style.corner === "sharp" || style.radius <= 0) return input;
  const n = input.segs.length;
  if (n < 2) return input;
  const from: Pt[] = [input.start, ...input.segs.map((s) => s.to)];
  const minTurn = (cfg.minCornerTurnDeg * Math.PI) / 180;
  const cuts = new Map<number, Cut>();
  const lens = input.segs.map((s, i) => (s.t === "A" ? 0 : segLength(from[i] ?? input.start, s)));
  const vertexCount = input.closed ? n : n - 1;
  const xs = from.map((p) => p.x);
  const ys = from.map((p) => p.y);
  const side = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const radius = Math.min(style.radius, Math.max(0.5, cfg.maxRadiusRatio * side));

  for (let i = 0; i < vertexCount; i++) {
    const j = (i + 1) % n;
    const a = input.segs[i];
    const b = input.segs[j];
    if (!a || !b || a.t === "A" || b.t === "A") continue;
    const pa = from[i];
    const pb = from[j];
    if (!pa || !pb) continue;
    const ta = edgeTangent(pa, a, true);
    const tb = edgeTangent(pb, b, false);
    const turn = Math.acos(Math.max(-1, Math.min(1, dot(ta, tb))));
    if (turn < minTurn || turn > Math.PI - 1e-3) continue;
    const half = Math.tan(turn / 2);
    // A round corner needs a long tangent on a sharp tip, a chamfer does not: its cut stays about one radius long,
    // otherwise a triangle turns into a hexagon and a star into a blob.
    // Acute tips get a smaller radius: 90 degrees keeps the full radius, 60 degrees about two thirds, sharp stars half.
    const rr = radius * Math.min(1, Math.max(0.5, (Math.PI - turn) / (Math.PI / 2)));
    let d = rr * (style.corner === "chamfer" ? Math.min(half, 1.2) : half);
    d = Math.min(d, (lens[i] ?? 0) / 2, (lens[j] ?? 0) / 2);
    if (d < 0.05) continue;
    const tEnd = tAtDistance(pa, a, d, true);
    const tStart = tAtDistance(pb, b, d, false);
    const p1 = pointAt(pa, a, tEnd);
    const p2 = pointAt(pb, b, tStart);
    const r = d / half;
    let seg: Seg;
    if (style.corner === "round" && a.t === "L" && b.t === "L") {
      seg = { t: "A", rx: r, ry: r, rot: 0, large: 0, sweep: cross(ta, tb) > 0 ? 1 : 0, to: p2 };
    } else if (style.corner === "chamfer") {
      seg = { t: "L", to: p2 };
    } else {
      const h = style.corner === "round" ? ((4 / 3) * Math.tan(turn / 4) * d) / half : style.squircleK * d;
      const t1 = tangentAt(pa, a, tEnd);
      const t2 = tangentAt(pb, b, tStart);
      seg = { t: "C", c1: add(p1, scale(t1, h)), c2: sub(p2, scale(t2, h)), to: p2 };
    }
    cuts.set(i, { p1, p2, tEnd, tStart, fillet: seg });
  }
  if (cuts.size === 0) return input;

  const out: Seg[] = [];
  for (let i = 0; i < n; i++) {
    const s = input.segs[i];
    const p0 = from[i];
    if (!s || !p0) continue;
    const prev = cuts.get((i - 1 + n) % n);
    const next = cuts.get(i);
    const wraps = !input.closed && i === 0;
    const t0 = prev && !wraps ? prev.tStart : 0;
    const t1 = next ? next.tEnd : 1;
    out.push(t0 === 0 && t1 === 1 ? s : subSeg(p0, s, t0, t1));
    if (next) out.push(next.fillet);
  }
  const wrapCut = input.closed ? cuts.get(n - 1) : undefined;
  const start = wrapCut ? wrapCut.p2 : input.start;
  // Two neighbouring fillets can consume a whole segment, drop the zero length leftovers.
  const clean: Seg[] = [];
  let at = start;
  for (const s of out) {
    if (s.t === "L" && dist(at, s.to) < 1e-4) continue;
    clean.push(s);
    at = s.to;
  }
  return { start, segs: clean, closed: input.closed };
}

export function pathLength(sp: Subpath): number {
  let total = 0;
  let p = sp.start;
  for (const s of sp.segs) {
    total += dist(p, s.to);
    p = s.to;
  }
  return total;
}
