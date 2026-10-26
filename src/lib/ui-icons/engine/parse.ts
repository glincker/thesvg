import SVGPathCommander from "svg-path-commander";
import { same } from "./geom";
import type { IconNode, Pt, Seg, Shape, Subpath } from "./types";

const num = (v: string | undefined, d = 0): number => (v === undefined ? d : Number.parseFloat(v));

function quadToCubic(p0: Pt, q: Pt, p1: Pt): Seg {
  return {
    t: "C",
    c1: { x: p0.x + (2 / 3) * (q.x - p0.x), y: p0.y + (2 / 3) * (q.y - p0.y) },
    c2: { x: p1.x + (2 / 3) * (q.x - p1.x), y: p1.y + (2 / 3) * (q.y - p1.y) },
    to: p1,
  };
}

/** SVG lets a path continue after Z without a new M, it resumes at the start of the closed subpath. */
export function parsePath(d: string): Subpath[] {
  const chunks = d.split(/(?<=[zZ])(?=\s*[^MmzZ\s])/);
  if (chunks.length === 1) return parseChunk(d);
  const out: Subpath[] = [];
  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const last = out[out.length - 1];
    const resume = !/^[Mm]/.test(trimmed) && last ? `M${last.start.x} ${last.start.y}` : "";
    out.push(...parseChunk(resume + trimmed));
  }
  return out;
}

function parseChunk(d: string): Subpath[] {
  const segments = new SVGPathCommander(d).toAbsolute().segments as (string | number)[][];
  const out: Subpath[] = [];
  let cur: Subpath | null = null;
  let pos: Pt = { x: 0, y: 0 };
  let lastC: Pt | null = null;
  let lastQ: Pt | null = null;

  const close = () => {
    if (!cur) return;
    if (cur.closed && cur.segs.length > 0) {
      const last = cur.segs[cur.segs.length - 1];
      if (last && !same(last.to, cur.start)) cur.segs.push({ t: "L", to: { ...cur.start } });
    }
    out.push(cur);
    cur = null;
  };

  for (const s of segments) {
    const cmd = s[0] as string;
    const a = s.slice(1) as number[];
    const n = (i: number): number => a[i] ?? 0;
    if (cmd === "M") {
      close();
      pos = { x: n(0), y: n(1) };
      cur = { start: { ...pos }, segs: [], closed: false };
      lastC = lastQ = null;
      continue;
    }
    if (!cur) continue;
    if (cmd === "Z") {
      cur.closed = true;
      pos = { ...cur.start };
      close();
      cur = { start: { ...pos }, segs: [], closed: false };
      lastC = lastQ = null;
      continue;
    }
    let seg: Seg | null = null;
    if (cmd === "L") seg = { t: "L", to: { x: n(0), y: n(1) } };
    else if (cmd === "H") seg = { t: "L", to: { x: n(0), y: pos.y } };
    else if (cmd === "V") seg = { t: "L", to: { x: pos.x, y: n(0) } };
    else if (cmd === "C") {
      seg = { t: "C", c1: { x: n(0), y: n(1) }, c2: { x: n(2), y: n(3) }, to: { x: n(4), y: n(5) } };
      lastC = seg.c2;
      lastQ = null;
    } else if (cmd === "S") {
      const c1: Pt = lastC ? { x: 2 * pos.x - lastC.x, y: 2 * pos.y - lastC.y } : { ...pos };
      seg = { t: "C", c1, c2: { x: n(0), y: n(1) }, to: { x: n(2), y: n(3) } };
      lastC = seg.c2;
      lastQ = null;
    } else if (cmd === "Q") {
      const q = { x: n(0), y: n(1) };
      seg = quadToCubic(pos, q, { x: n(2), y: n(3) });
      lastQ = q;
      lastC = null;
    } else if (cmd === "T") {
      const q: Pt = lastQ ? { x: 2 * pos.x - lastQ.x, y: 2 * pos.y - lastQ.y } : { ...pos };
      seg = quadToCubic(pos, q, { x: n(0), y: n(1) });
      lastQ = q;
      lastC = null;
    } else if (cmd === "A") {
      seg = {
        t: "A",
        rx: n(0),
        ry: n(1),
        rot: n(2),
        large: n(3) ? 1 : 0,
        sweep: n(4) ? 1 : 0,
        to: { x: n(5), y: n(6) },
      };
    }
    if (!seg) continue;
    if (seg.t === "L") lastC = lastQ = null;
    if (seg.t === "A") lastC = lastQ = null;
    cur.segs.push(seg);
    pos = seg.to;
  }
  close();
  return out.filter((s) => s.segs.length > 0);
}

const P = (x: number, y: number): Pt => ({ x, y });

function ellipse(cx: number, cy: number, rx: number, ry: number): Subpath {
  const arc = (x: number, y: number): Seg => ({ t: "A", rx, ry, rot: 0, large: 0, sweep: 1, to: P(x, y) });
  return {
    start: P(cx + rx, cy),
    segs: [arc(cx - rx, cy), arc(cx + rx, cy)],
    closed: true,
  };
}

function rect(x: number, y: number, w: number, h: number, rx: number, ry: number): Subpath {
  const r = Math.min(rx, w / 2);
  const q = Math.min(ry, h / 2);
  const A = (to: Pt): Seg => ({ t: "A", rx: r, ry: q, rot: 0, large: 0, sweep: 1, to });
  const segs: Seg[] = [];
  segs.push({ t: "L", to: P(x + w - r, y) });
  if (r > 0 && q > 0) segs.push(A(P(x + w, y + q)));
  segs.push({ t: "L", to: P(x + w, y + h - q) });
  if (r > 0 && q > 0) segs.push(A(P(x + w - r, y + h)));
  segs.push({ t: "L", to: P(x + r, y + h) });
  if (r > 0 && q > 0) segs.push(A(P(x, y + h - q)));
  segs.push({ t: "L", to: P(x, y + q) });
  if (r > 0 && q > 0) segs.push(A(P(x + r, y)));
  return { start: P(x + r, y), segs, closed: true };
}

function points(raw: string | undefined): Pt[] {
  const nums = (raw ?? "").split(/[\s,]+/).filter(Boolean).map(Number);
  const pts: Pt[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push(P(nums[i] ?? 0, nums[i + 1] ?? 0));
  return pts;
}

export function nodeToShape(node: IconNode): Shape | null {
  const [tag, at] = node;
  if (tag === "path") return { subpaths: parsePath(at.d ?? "") };
  if (tag === "circle") {
    const r = num(at.r);
    return { subpaths: [ellipse(num(at.cx), num(at.cy), r, r)] };
  }
  if (tag === "ellipse") return { subpaths: [ellipse(num(at.cx), num(at.cy), num(at.rx), num(at.ry))] };
  if (tag === "rect") {
    const rx = at.rx !== undefined ? num(at.rx) : num(at.ry);
    const ry = at.ry !== undefined ? num(at.ry) : rx;
    return { subpaths: [rect(num(at.x), num(at.y), num(at.width), num(at.height), rx, ry)] };
  }
  if (tag === "line") {
    return {
      subpaths: [{ start: P(num(at.x1), num(at.y1)), segs: [{ t: "L", to: P(num(at.x2), num(at.y2)) }], closed: false }],
    };
  }
  if (tag === "polyline" || tag === "polygon") {
    const pts = points(at.points);
    const [first, ...rest] = pts;
    if (!first || rest.length === 0) return null;
    const closed = tag === "polygon";
    const segs: Seg[] = rest.map((p) => ({ t: "L", to: p }));
    if (closed) segs.push({ t: "L", to: { ...first } });
    return { subpaths: [{ start: first, segs, closed }] };
  }
  return null;
}

export function nodesToShapes(nodes: IconNode[]): Shape[] {
  return nodes.map(nodeToShape).filter((s): s is Shape => s !== null && s.subpaths.length > 0);
}
