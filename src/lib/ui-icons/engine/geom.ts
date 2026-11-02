import type { Pt } from "./types";

export const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
export const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
export const scale = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
export const len = (a: Pt): number => Math.hypot(a.x, a.y);
export const cross = (a: Pt, b: Pt): number => a.x * b.y - a.y * b.x;
export const dot = (a: Pt, b: Pt): number => a.x * b.x + a.y * b.y;
export const dist = (a: Pt, b: Pt): number => len(sub(a, b));
export const same = (a: Pt, b: Pt, eps = 1e-6): boolean => dist(a, b) < eps;

export function unit(a: Pt): Pt {
  const l = len(a);
  return l === 0 ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
}

/** Intersection of infinite lines p0->p1 and p2->p3, or null when parallel. */
export function lineIntersect(p0: Pt, p1: Pt, p2: Pt, p3: Pt): Pt | null {
  const d1 = sub(p1, p0);
  const d2 = sub(p3, p2);
  const den = cross(d1, d2);
  if (Math.abs(den) < 1e-9) return null;
  const t = cross(sub(p2, p0), d2) / den;
  return add(p0, scale(d1, t));
}

/** Ray casting point in polygon test. */
export function pointInPolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (!a || !b) continue;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}
