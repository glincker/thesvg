/**
 * SVG path `d` attribute parser and flattener: turns path commands
 * (including cubic/quadratic beziers and elliptical arcs) into one or
 * more closed point loops, flattened to straight line segments.
 */

/** Cursor-based numeric scanner for path data / points lists (handles
 * glued negatives and glued decimals, e.g. "1-2.5.5"). */
const PATH_COMMAND_RE = /[MmLlHhVvCcSsQqTtAaZz]/;

export class NumScanner {
  private i = 0;
  constructor(private s: string) {}

  private skipSep() {
    while (this.i < this.s.length && /[\s,]/.test(this.s[this.i])) this.i++;
  }

  hasMore(): boolean {
    this.skipSep();
    return this.i < this.s.length;
  }

  /** True if the next non-separator character is a path command letter. */
  peekIsCommand(): boolean {
    this.skipSep();
    return this.i < this.s.length && PATH_COMMAND_RE.test(this.s[this.i]);
  }

  /** Reads a single path command letter. */
  readCommand(): string {
    this.skipSep();
    const c = this.s[this.i];
    this.i++;
    return c;
  }

  /** Reads exactly one flag character (0 or 1), tolerating no separator. */
  readFlag(): number {
    this.skipSep();
    const c = this.s[this.i];
    this.i++;
    return c === "1" ? 1 : 0;
  }

  readNumber(): number {
    this.skipSep();
    const rest = this.s.slice(this.i);
    const m = /^[+-]?(?:\d+\.\d+|\.\d+|\d+)(?:[eE][+-]?\d+)?/.exec(rest);
    if (!m) {
      throw new Error(`Invalid number at position ${this.i} in "${this.s}"`);
    }
    this.i += m[0].length;
    return parseFloat(m[0]);
  }
}

export interface PathPoint {
  x: number;
  y: number;
}

export interface RawSubpath {
  points: PathPoint[];
  /** Whether this subpath was explicitly closed with Z/z. */
  closed: boolean;
}

/** Parses an SVG path `d` attribute into its raw subpaths (in the path's
 * own local coordinate space, before transforms), flattening curves to
 * line segments but otherwise unprocessed: no closing/merging, so open
 * subpaths stay open. Used for stroke expansion, where open-vs-closed and
 * the exact original point sequence both matter. `flattenPathData` (fill)
 * and `flattenPathForStroke` build on top of this. */
export function parsePathSubpaths(d: string): RawSubpath[] {
  const subpaths: RawSubpath[] = [];
  let current: PathPoint[] = [];
  let cur: PathPoint = { x: 0, y: 0 };
  let start: PathPoint = { x: 0, y: 0 };
  let lastCmd = "";
  let lastCubicCtrl: PathPoint | null = null;
  let lastQuadCtrl: PathPoint | null = null;

  const scanner = new NumScanner(d);
  const consume = (): number => scanner.readNumber();
  const consumeFlag = (): number => scanner.readFlag();
  const skipToNextToken = (): void => {
    scanner.hasMore();
  };

  const flattenCubic = (p0: PathPoint, p1: PathPoint, p2: PathPoint, p3: PathPoint) => {
    const segments = 8;
    for (let t = 1; t <= segments; t++) {
      const u = t / segments;
      const mu = 1 - u;
      const x =
        mu * mu * mu * p0.x + 3 * mu * mu * u * p1.x + 3 * mu * u * u * p2.x + u * u * u * p3.x;
      const y =
        mu * mu * mu * p0.y + 3 * mu * mu * u * p1.y + 3 * mu * u * u * p2.y + u * u * u * p3.y;
      current.push({ x, y });
    }
  };

  const flattenQuad = (p0: PathPoint, p1: PathPoint, p2: PathPoint) => {
    const segments = 6;
    for (let t = 1; t <= segments; t++) {
      const u = t / segments;
      const mu = 1 - u;
      const x = mu * mu * p0.x + 2 * mu * u * p1.x + u * u * p2.x;
      const y = mu * mu * p0.y + 2 * mu * u * p1.y + u * u * p2.y;
      current.push({ x, y });
    }
  };

  const flattenArc = (
    p0: PathPoint,
    rxIn: number,
    ryIn: number,
    xAxisRotationDeg: number,
    largeArcFlag: number,
    sweepFlag: number,
    p1: PathPoint,
  ) => {
    if (rxIn === 0 || ryIn === 0) {
      current.push({ ...p1 });
      return;
    }
    let rx = Math.abs(rxIn);
    let ry = Math.abs(ryIn);
    const phi = (xAxisRotationDeg * Math.PI) / 180;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    const dx2 = (p0.x - p1.x) / 2;
    const dy2 = (p0.y - p1.y) / 2;
    const x1p = cosPhi * dx2 + sinPhi * dy2;
    const y1p = -sinPhi * dx2 + cosPhi * dy2;

    const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lambda > 1) {
      const s = Math.sqrt(lambda);
      rx *= s;
      ry *= s;
    }

    const sign = largeArcFlag !== sweepFlag ? 1 : -1;
    const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    const coef = sign * Math.sqrt(Math.max(num / den, 0));
    const cxp = (coef * (rx * y1p)) / ry;
    const cyp = (coef * -(ry * x1p)) / rx;

    const cx = cosPhi * cxp - sinPhi * cyp + (p0.x + p1.x) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (p0.y + p1.y) / 2;

    const angle = (ux: number, uy: number, vx: number, vy: number) => {
      const dot = ux * vx + uy * vy;
      const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
      let a = Math.acos(Math.min(1, Math.max(-1, dot / len)));
      if (ux * vy - uy * vx < 0) a = -a;
      return a;
    };

    const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dTheta = angle(
      (x1p - cxp) / rx,
      (y1p - cyp) / ry,
      (-x1p - cxp) / rx,
      (-y1p - cyp) / ry,
    );
    if (!sweepFlag && dTheta > 0) dTheta -= 2 * Math.PI;
    if (sweepFlag && dTheta < 0) dTheta += 2 * Math.PI;

    const steps = Math.max(4, Math.ceil((Math.abs(dTheta) / Math.PI) * 10));
    for (let s = 1; s <= steps; s++) {
      const t = theta1 + (dTheta * s) / steps;
      const x = cx + rx * Math.cos(t) * cosPhi - ry * Math.sin(t) * sinPhi;
      const y = cy + rx * Math.cos(t) * sinPhi + ry * Math.sin(t) * cosPhi;
      current.push({ x, y });
    }
  };

  parseLoop: while (scanner.hasMore()) {
    if (scanner.peekIsCommand()) {
      lastCmd = scanner.readCommand();
    } else {
      // implicit repeat of the last command (extra coordinate pairs)
      if (!lastCmd) {
        throw new Error(`Path data starts without a command: "${d.slice(0, 20)}"`);
      }
      if (lastCmd === "M") lastCmd = "L";
      else if (lastCmd === "m") lastCmd = "l";
    }

    switch (lastCmd) {
      case "M":
      case "L": {
        if (lastCmd === "M" && current.length) {
          subpaths.push({ points: current, closed: false });
          current = [];
        }
        skipToNextToken();
        const x = consume();
        const y = consume();
        cur = { x, y };
        if (lastCmd === "M") start = { ...cur };
        current.push({ ...cur });
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      }
      case "m":
      case "l": {
        if (lastCmd === "m" && current.length) {
          subpaths.push({ points: current, closed: false });
          current = [];
        }
        skipToNextToken();
        const x = consume();
        const y = consume();
        cur = { x: cur.x + x, y: cur.y + y };
        if (lastCmd === "m") start = { ...cur };
        current.push({ ...cur });
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      }
      case "H": {
        skipToNextToken();
        cur = { x: consume(), y: cur.y };
        current.push({ ...cur });
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      }
      case "h": {
        skipToNextToken();
        cur = { x: cur.x + consume(), y: cur.y };
        current.push({ ...cur });
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      }
      case "V": {
        skipToNextToken();
        cur = { x: cur.x, y: consume() };
        current.push({ ...cur });
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      }
      case "v": {
        skipToNextToken();
        cur = { x: cur.x, y: cur.y + consume() };
        current.push({ ...cur });
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      }
      case "C": {
        skipToNextToken();
        const x1 = consume();
        const y1 = consume();
        const x2 = consume();
        const y2 = consume();
        const x = consume();
        const y = consume();
        const p1 = { x: x1, y: y1 };
        const p2 = { x: x2, y: y2 };
        const p3 = { x, y };
        flattenCubic(cur, p1, p2, p3);
        lastCubicCtrl = p2;
        lastQuadCtrl = null;
        cur = p3;
        break;
      }
      case "c": {
        skipToNextToken();
        const x1 = cur.x + consume();
        const y1 = cur.y + consume();
        const x2 = cur.x + consume();
        const y2 = cur.y + consume();
        const x = cur.x + consume();
        const y = cur.y + consume();
        const p1 = { x: x1, y: y1 };
        const p2 = { x: x2, y: y2 };
        const p3 = { x, y };
        flattenCubic(cur, p1, p2, p3);
        lastCubicCtrl = p2;
        lastQuadCtrl = null;
        cur = p3;
        break;
      }
      case "S": {
        skipToNextToken();
        const x2 = consume();
        const y2 = consume();
        const x = consume();
        const y = consume();
        const p1 = lastCubicCtrl
          ? { x: 2 * cur.x - lastCubicCtrl.x, y: 2 * cur.y - lastCubicCtrl.y }
          : { ...cur };
        const p2 = { x: x2, y: y2 };
        const p3 = { x, y };
        flattenCubic(cur, p1, p2, p3);
        lastCubicCtrl = p2;
        lastQuadCtrl = null;
        cur = p3;
        break;
      }
      case "s": {
        skipToNextToken();
        const x2 = cur.x + consume();
        const y2 = cur.y + consume();
        const x = cur.x + consume();
        const y = cur.y + consume();
        const p1 = lastCubicCtrl
          ? { x: 2 * cur.x - lastCubicCtrl.x, y: 2 * cur.y - lastCubicCtrl.y }
          : { ...cur };
        const p2 = { x: x2, y: y2 };
        const p3 = { x, y };
        flattenCubic(cur, p1, p2, p3);
        lastCubicCtrl = p2;
        lastQuadCtrl = null;
        cur = p3;
        break;
      }
      case "Q": {
        skipToNextToken();
        const x1 = consume();
        const y1 = consume();
        const x = consume();
        const y = consume();
        const p1 = { x: x1, y: y1 };
        const p2 = { x, y };
        flattenQuad(cur, p1, p2);
        lastQuadCtrl = p1;
        lastCubicCtrl = null;
        cur = p2;
        break;
      }
      case "q": {
        skipToNextToken();
        const x1 = cur.x + consume();
        const y1 = cur.y + consume();
        const x = cur.x + consume();
        const y = cur.y + consume();
        const p1 = { x: x1, y: y1 };
        const p2 = { x, y };
        flattenQuad(cur, p1, p2);
        lastQuadCtrl = p1;
        lastCubicCtrl = null;
        cur = p2;
        break;
      }
      case "T": {
        skipToNextToken();
        const x = consume();
        const y = consume();
        const p1: PathPoint = lastQuadCtrl
          ? { x: 2 * cur.x - lastQuadCtrl.x, y: 2 * cur.y - lastQuadCtrl.y }
          : { ...cur };
        const p2 = { x, y };
        flattenQuad(cur, p1, p2);
        lastQuadCtrl = p1;
        lastCubicCtrl = null;
        cur = p2;
        break;
      }
      case "t": {
        skipToNextToken();
        const x = cur.x + consume();
        const y = cur.y + consume();
        const p1: PathPoint = lastQuadCtrl
          ? { x: 2 * cur.x - lastQuadCtrl.x, y: 2 * cur.y - lastQuadCtrl.y }
          : { ...cur };
        const p2 = { x, y };
        flattenQuad(cur, p1, p2);
        lastQuadCtrl = p1;
        lastCubicCtrl = null;
        cur = p2;
        break;
      }
      case "A": {
        skipToNextToken();
        const rx = consume();
        const ry = consume();
        const rot = consume();
        const laf = consumeFlag();
        const sf = consumeFlag();
        const x = consume();
        const y = consume();
        const p1 = { x, y };
        flattenArc(cur, rx, ry, rot, laf, sf, p1);
        cur = p1;
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      }
      case "a": {
        skipToNextToken();
        const rx = consume();
        const ry = consume();
        const rot = consume();
        const laf = consumeFlag();
        const sf = consumeFlag();
        const x = cur.x + consume();
        const y = cur.y + consume();
        const p1 = { x, y };
        flattenArc(cur, rx, ry, rot, laf, sf, p1);
        cur = p1;
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      }
      case "Z":
      case "z": {
        current.push({ ...start });
        if (current.length) {
          subpaths.push({ points: current, closed: true });
          current = [];
        }
        cur = { ...start };
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      }
      default:
        // Unknown command: bail out of this path gracefully.
        break parseLoop;
    }
  }
  if (current.length) subpaths.push({ points: current, closed: false });
  return subpaths;
}

/** Flattens an SVG path `d` attribute into one or more closed point loops,
 * merging multiple subpaths (holes, disjoint peers) into one via the slit
 * technique. Used for fill rendering. */
export function flattenPathData(d: string): PathPoint[][] {
  const loops = parsePathSubpaths(d)
    .map((sp) => sp.points)
    .filter((pts) => pts.length >= 3);

  // A single SVG <path> can carry multiple subpaths sharing one fill,
  // commonly an outer silhouette plus an even-odd "hole" (e.g. the ring in
  // a letter "O" or "Next.js" logo). Excalidraw's line element only stores
  // one point loop with no fill-rule, so a hole can't be expressed as a
  // second, independently-wound loop the way SVG does it. Instead we merge
  // every subpath into a single loop using the standard "slit"/keyhole
  // technique: bridge each loop into the combined outline via its nearest
  // point pair, walking out and back along the exact same edge. That
  // bridge contributes zero area, so it's invisible once filled, while
  // reproducing the hole (when winding is opposite) or a plain union
  // (when the subpaths are disjoint peers rather than a hole).
  if (loops.length <= 1) return loops;
  return [mergeLoopsWithSlits(loops)];
}

function nearestPointPair(a: PathPoint[], b: PathPoint[]): [number, number] {
  let best = Infinity;
  let bi = 0;
  let bj = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      const dx = a[i].x - b[j].x;
      const dy = a[i].y - b[j].y;
      const d = dx * dx + dy * dy;
      if (d < best) {
        best = d;
        bi = i;
        bj = j;
      }
    }
  }
  return [bi, bj];
}

function mergeLoopsWithSlits(loops: PathPoint[][]): PathPoint[] {
  let merged = loops[0];
  for (let k = 1; k < loops.length; k++) {
    const next = loops[k];
    const [ia, ib] = nearestPointPair(merged, next);
    merged = [
      ...merged.slice(0, ia + 1),
      ...next.slice(ib),
      ...next.slice(0, ib + 1),
      ...merged.slice(ia),
    ];
  }
  return merged;
}

