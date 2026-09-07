/**
 * Excalidraw `.excalidrawlib` schema types and the conversion from
 * flattened SVG polygons (see `svg-path-to-polygons.ts`) into positioned
 * Excalidraw "line" elements.
 *
 * Schema confirmed against excalidraw/excalidraw's
 * packages/excalidraw/types.ts, packages/excalidraw/data/{json,types}.ts,
 * and packages/common/src/constants.ts.
 */

import { randomInt, randomUUID } from "crypto";
import type { FlattenedPolygon } from "./svg-path-to-polygons";

/** Minimal fields restoreElement()/restoreElementWithProperties() require
 * for a filled, non-interactive polygon "line" element. */
export interface ExcalidrawLineElement {
  id: string;
  type: "line";
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: "solid";
  strokeWidth: number;
  strokeStyle: "solid";
  roughness: number;
  opacity: number;
  groupIds: string[];
  frameId: null;
  roundness: null;
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: false;
  boundElements: [];
  updated: number;
  link: null;
  locked: boolean;
  points: [number, number][];
  lastCommittedPoint: null;
  startBinding: null;
  endBinding: null;
  startArrowhead: null;
  endArrowhead: null;
  /** Closed, filled polygon rather than an open polyline. */
  polygon: boolean;
}

/** `LibraryItem` (v2) from packages/excalidraw/types.ts. */
export interface ExcalidrawLibraryItem {
  id: string;
  status: "unpublished" | "published";
  elements: ExcalidrawLineElement[];
  created: number;
  name?: string;
}

/** `ExportedLibraryData` from packages/excalidraw/data/types.ts. Note there
 * is deliberately no top-level `files` map: the library format has none. */
export interface ExcalidrawLibraryFile {
  type: "excalidrawlib";
  version: 2;
  source: string;
  libraryItems: ExcalidrawLibraryItem[];
}

/** Short unique id, good enough for locally-generated library files. */
export function generateExcalidrawId(): string {
  return randomUUID();
}

/** Rounds to 2 decimal places; more than enough precision at icon scale,
 * and keeps generated file sizes reasonable (raw floating point math
 * otherwise serializes ~16 significant digits per coordinate). */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Converts flattened polygons into positioned Excalidraw "line" elements:
 * scales from SVG viewBox units to the target pixel height, offsets by
 * (offsetX, offsetY) for grid layout, and stores points relative to each
 * element's own bounding-box origin (as Excalidraw expects).
 *
 * Each shape becomes its own element, deliberately not merged with
 * touching/overlapping same-color siblings: fully opaque same-color
 * shapes already tile seamlessly with no visible join, so no merge is
 * needed for that. It's tempting to reach for one anyway (a stray
 * sub-pixel gap between two shapes an author intended to align exactly
 * can show as a faint seam at small preview sizes), but a purely
 * geometric "close enough to bridge" merge was tried here and reverted:
 * nearest-point slit-bridging has no notion of which edge is the
 * "correct" neighbor, so for anything with many pieces or a shape that
 * folds back close to itself (a long wavy stroke's peaks and valleys, or
 * several unrelated same-color shapes scattered across one icon) it can
 * bridge to the wrong nearby edge and self-intersect, cancelling large
 * areas under nonzero fill instead of just union-ing them. That silently
 * rendered a real icon ("midjourney") completely blank. The one merge
 * that *is* safe and still happens is multiple subpaths within a single
 * `<path>`'s own fill (svg-path-data.ts's even-odd hole merge), because
 * there "belongs together" is structurally guaranteed by the source
 * markup rather than inferred from distance.
 */
export function polygonsToElements(
  shapes: FlattenedPolygon[],
  viewBox: { minX: number; minY: number; width: number; height: number },
  scale: number,
  offsetX: number,
  offsetY: number,
  groupId: string,
): ExcalidrawLineElement[] {
  const elements: ExcalidrawLineElement[] = [];

  for (const shape of shapes) {
    const abs: [number, number][] = shape.points.map(([x, y]) => [
      (x - viewBox.minX) * scale + offsetX,
      (y - viewBox.minY) * scale + offsetY,
    ]);
    const xs = abs.map((p) => p[0]);
    const ys = abs.map((p) => p[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    // Skip true point-degenerate shapes (near-zero bounding box after
    // rounding): a handful of source icons have sliver decorative marks
    // that flatten down to a single point at this scale. Note this is not
    // a signed-area check: self-intersecting "bowtie" shapes (two lobes
    // meeting at one vertex) are legitimate and render fine under the
    // nonzero fill rule even though their shoelace area can cancel out.
    if (maxX - minX < 0.05 && maxY - minY < 0.05) continue;

    const rel: [number, number][] = abs.map(([x, y]) => [
      round2(x - minX),
      round2(y - minY),
    ]);
    const first = rel[0];
    const last = rel[rel.length - 1];
    if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
      rel.push([first[0], first[1]]);
    }

    elements.push({
      id: generateExcalidrawId(),
      type: "line",
      x: round2(minX),
      y: round2(minY),
      width: round2(Math.max(maxX - minX, 0.01)),
      height: round2(Math.max(maxY - minY, 0.01)),
      angle: 0,
      strokeColor: "transparent",
      backgroundColor: shape.fill,
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: Math.round(shape.opacity * 100),
      groupIds: [groupId],
      frameId: null,
      roundness: null,
      seed: randomInt(2 ** 31),
      version: 1,
      versionNonce: randomInt(2 ** 31),
      isDeleted: false,
      boundElements: [],
      updated: Date.now(),
      link: null,
      locked: false,
      points: rel,
      lastCommittedPoint: null,
      startBinding: null,
      endBinding: null,
      startArrowhead: null,
      endArrowhead: null,
      polygon: true,
    });
  }

  return elements;
}
