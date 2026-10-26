import type { Pt, Seg, Subpath } from "./types";

const fmt = (v: number): string => {
  const r = Math.round(v * 1000) / 1000;
  return Object.is(r, -0) ? "0" : String(r);
};
const pt = (p: Pt): string => `${fmt(p.x)} ${fmt(p.y)}`;

function seg(s: Seg): string {
  if (s.t === "L") return `L${pt(s.to)}`;
  if (s.t === "C") return `C${pt(s.c1)} ${pt(s.c2)} ${pt(s.to)}`;
  return `A${fmt(s.rx)} ${fmt(s.ry)} ${fmt(s.rot)} ${s.large} ${s.sweep} ${pt(s.to)}`;
}

export function subpathToD(sp: Subpath): string {
  const body = sp.segs.map(seg).join("");
  return `M${pt(sp.start)}${body}${sp.closed ? "Z" : ""}`;
}

export function subpathsToD(sps: Subpath[]): string {
  return sps.map(subpathToD).join("");
}

/** Anchor points and bezier handles for the studio overlay. */
export function anchorsOf(sps: Subpath[]): { anchors: Pt[]; handles: [Pt, Pt][] } {
  const anchors: Pt[] = [];
  const handles: [Pt, Pt][] = [];
  for (const sp of sps) {
    anchors.push(sp.start);
    let from = sp.start;
    for (const s of sp.segs) {
      anchors.push(s.to);
      if (s.t === "C") {
        handles.push([from, s.c1], [s.to, s.c2]);
      }
      from = s.to;
    }
  }
  return { anchors, handles };
}
