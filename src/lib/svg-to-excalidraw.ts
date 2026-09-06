/**
 * Excalidraw `.excalidrawlib` schema types and the conversion from
 * flattened SVG polygons (see `svg-path-to-polygons.ts`) into positioned
 * Excalidraw "line" elements.
 *
 * Schema confirmed against excalidraw/excalidraw's
 * packages/excalidraw/types.ts, packages/excalidraw/data/{json,types}.ts,
 * and packages/common/src/constants.ts.
 */

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

let idCounter = 0;

/** Short unique id, good enough for locally-generated library files. */
export function generateExcalidrawId(): string {
  idCounter += 1;
  return (
    Date.now().toString(36) +
    idCounter.toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
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
      seed: Math.floor(Math.random() * 2 ** 31),
      version: 1,
      versionNonce: Math.floor(Math.random() * 2 ** 31),
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
