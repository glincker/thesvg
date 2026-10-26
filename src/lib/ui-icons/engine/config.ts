import type { StyleParams } from "./types";

/** Engine thresholds. Pass overrides per call, nothing is read from globals. */
export interface EngineConfig {
  /** Largest source fillet radius that de-fillet will collapse to a sharp vertex. */
  defilletMaxRadius: number;
  /** Corners turning less than this many degrees are treated as straight. */
  minCornerTurnDeg: number;
  /** Samples used to flatten curves for containment tests. */
  flattenSamples: number;
  /** Open paths at least this wide and tall can act as a fillable body. */
  fillOpenMinSpan: number;
  /** Open path area over bbox area needed to count as a silhouette, not a line. */
  fillOpenMinRatio: number;
  /** An open shape only counts as a body when its ends nearly meet: chord over longest span. */
  fillOpenMaxChord: number;
  /** Corner radius never exceeds this share of the smaller side of the shape's own bounding box. */
  maxRadiusRatio: number;
  /** Strokes shorter than this keep plain ends, a 45 degree wedge would eat them. */
  cutMinLength: number;
  viewBox: number;
}

export const DEFAULT_ENGINE: EngineConfig = {
  defilletMaxRadius: 4,
  minCornerTurnDeg: 12,
  flattenSamples: 24,
  fillOpenMinSpan: 8,
  fillOpenMinRatio: 0.4,
  fillOpenMaxChord: 0.5,
  maxRadiusRatio: 0.3,
  cutMinLength: 6,
  viewBox: 24,
};

export const DEFAULT_STYLE: StyleParams = {
  strokeWidth: 2,
  cap: "round",
  join: "round",
  corner: "source",
  radius: 2,
  squircleK: 0.75,
  duotoneOpacity: 0.22,
  fillGap: 1,
  facetAngle: 0,
  fillFallbackBoost: 1.3,
  accent: "",
  depth: 1.6,
  depthAngle: 45,
  glassDepth: 0.5,
  scale: 1,
  cutTerminals: false,
  offsetX: 1.25,
  offsetY: 1.25,
  pixelGrid: 24,
  pixelReach: 0.95,
};
