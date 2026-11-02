import type { EngineConfig } from "./config";
import { dist, lineIntersect } from "./geom";
import type { Pt, Subpath } from "./types";

function fromOf(sp: Subpath, i: number): Pt {
  return i === 0 ? sp.start : (sp.segs[i - 1]?.to ?? sp.start);
}

/**
 * Collapse "line, small arc, line" back to a sharp vertex so a global corner
 * style can be applied. Source sets bake their own radii into the geometry.
 */
export function defillet(input: Subpath, cfg: EngineConfig): Subpath {
  const sp: Subpath = { start: { ...input.start }, segs: input.segs.map((s) => ({ ...s })), closed: input.closed };
  let changed = true;
  while (changed) {
    changed = false;
    const n = sp.segs.length;
    for (let k = 0; k < n; k++) {
      const arc = sp.segs[k];
      if (!arc || arc.t !== "A") continue;
      const pi = sp.closed ? (k - 1 + n) % n : k - 1;
      const ni = sp.closed ? (k + 1) % n : k + 1;
      if (pi < 0 || ni >= n || pi === ni) continue;
      const prev = sp.segs[pi];
      const next = sp.segs[ni];
      if (!prev || !next || prev.t !== "L" || next.t !== "L") continue;
      if (Math.abs(arc.rx - arc.ry) > 1e-3 || arc.rx > cfg.defilletMaxRadius) continue;
      const p0 = fromOf(sp, pi);
      const p1 = prev.to;
      const p2 = arc.to;
      const p3 = next.to;
      const x = lineIntersect(p0, p1, p2, p3);
      if (!x) continue;
      const reach = arc.rx * 2.6 + 1e-3;
      if (dist(x, p1) > reach || dist(x, p2) > reach) continue;
      prev.to = x;
      sp.segs.splice(k, 1);
      if (sp.closed) {
        const last = sp.segs[sp.segs.length - 1];
        if (last) sp.start = { ...last.to };
      }
      changed = true;
      break;
    }
  }
  return sp;
}
