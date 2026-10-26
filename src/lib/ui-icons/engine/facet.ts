import { arcToCubics, cubicAt, edgeTangent } from "./curves";
import { dot } from "./geom";
import type { Pt, Seg, Subpath } from "./types";

/** Replace every arc with cubics so later stages only deal with lines and cubics. */
export function arcsToCubics(sp: Subpath): Subpath {
  const segs: Seg[] = [];
  let from = sp.start;
  for (const s of sp.segs) {
    if (s.t === "A") segs.push(...arcToCubics(from, s));
    else segs.push(s);
    from = s.to;
  }
  return { ...sp, segs };
}

/** Turn curves into chords so that no chord turns more than `angleDeg`. Gives an angular, cut-gem look. */
export function facet(sp: Subpath, angleDeg: number): Subpath {
  if (angleDeg <= 0) return sp;
  const step = (angleDeg * Math.PI) / 180;
  const segs: Seg[] = [];
  let from: Pt = sp.start;
  for (const s of sp.segs) {
    if (s.t !== "C") {
      segs.push(s);
    } else {
      const a = edgeTangent(from, s, false);
      const b = edgeTangent(from, s, true);
      const turn = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
      const n = Math.max(1, Math.ceil(turn / step - 1e-6));
      for (let i = 1; i <= n; i++) segs.push({ t: "L", to: i === n ? s.to : cubicAt(from, s, i / n) });
    }
    from = s.to;
  }
  return { ...sp, segs };
}
