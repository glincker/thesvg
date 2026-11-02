// Craft score for a UI icon, out of 100, in four parts of 25. Pure and data-only so the build, the tests and the
// page all agree. Measuring geometry happens in scripts/ui; this file only turns measurements into points.

export interface QualityConfig {
  /** The drawing area inside the 24 grid, in grid units. */
  liveMin: number;
  liveMax: number;
  /** How far the icon's center may sit from the middle of the grid before points are lost. */
  centerTolerance: number;
  /** Ink length relative to the set median: inside this band the weight reads as consistent. */
  weightLow: number;
  weightHigh: number;
  /** The build fails when any icon scores below this. */
  minScore: number;
}

export const DEFAULT_QUALITY_CONFIG: QualityConfig = {
  liveMin: 1,
  liveMax: 23,
  centerTolerance: 1,
  weightLow: 0.4,
  weightHigh: 2.2,
  minScore: 70,
};

/** Reads overrides from the environment, so thresholds never live in the code that applies them. */
export function qualityConfigFromEnv(env: Record<string, string | undefined>): QualityConfig {
  const num = (key: string, fallback: number): number => {
    const raw = env[key];
    const n = raw === undefined || raw === "" ? Number.NaN : Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };
  const d = DEFAULT_QUALITY_CONFIG;
  return {
    liveMin: num("UI_QUALITY_LIVE_MIN", d.liveMin),
    liveMax: num("UI_QUALITY_LIVE_MAX", d.liveMax),
    centerTolerance: num("UI_QUALITY_CENTER_TOLERANCE", d.centerTolerance),
    weightLow: num("UI_QUALITY_WEIGHT_LOW", d.weightLow),
    weightHigh: num("UI_QUALITY_WEIGHT_HIGH", d.weightHigh),
    minScore: num("UI_QUALITY_MIN_SCORE", d.minScore),
  };
}

export interface Measurements {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  /** Total ink length of the outline drawing. */
  length: number;
  /** How many of the looks rendered without an error or NaN, out of `looks`. */
  looksOk: number;
  looks: number;
}

export interface QualityInput {
  tags: string[];
  category: string;
}

/** Fit, Looks, Weight, Metadata, each 0 to 25. */
export type QualityParts = [number, number, number, number];

export const QUALITY_LABELS = ["Fit", "Looks", "Weight", "Metadata"] as const;

const round = (n: number): number => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

export function scoreQuality(input: QualityInput, m: Measurements, medianLength: number, cfg: QualityConfig): { total: number; parts: QualityParts } {
  // Grid fit: 15 for staying inside the live area (5 off per unit of overflow), 10 for being centered.
  const overflow = Math.max(cfg.liveMin - m.minX, cfg.liveMin - m.minY, m.maxX - cfg.liveMax, m.maxY - cfg.liveMax, 0);
  const inside = clamp(15 - overflow * 5, 0, 15);
  const offset = Math.hypot((m.minX + m.maxX) / 2 - 12, (m.minY + m.maxY) / 2 - 12);
  const centered = clamp(10 - Math.max(0, offset - cfg.centerTolerance) * 5, 0, 10);
  const fit = inside + centered;

  const looks = m.looks === 0 ? 0 : (25 * m.looksOk) / m.looks;

  const ratio = medianLength > 0 ? m.length / medianLength : 1;
  const weight = ratio < cfg.weightLow ? 25 * (ratio / cfg.weightLow) : ratio > cfg.weightHigh ? 25 * (cfg.weightHigh / ratio) : 25;

  const meta = (input.tags.length >= 2 ? 10 : 0) + (input.tags.length >= 4 ? 5 : 0) + (input.category !== "General" ? 10 : 0);

  const parts: QualityParts = [round(fit), round(looks), round(weight), meta];
  return { total: Math.round(parts[0] + parts[1] + parts[2] + parts[3]), parts };
}

export function medianOf(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** One line per part for the page, derived from the stored points so the manifest stays small. */
export function describePart(index: number, points: number): string {
  const full = points >= 25;
  switch (index) {
    case 0:
      return full ? "Inside the live area and centered" : "Edge crosses the live area or the icon sits off center";
    case 1:
      return full ? "All seven looks render cleanly" : "Some looks fail to render";
    case 2:
      return full ? "Matches the weight of the set" : "Lighter or heavier than the rest of the set";
    default:
      return full ? "Tags and category are complete" : "Needs four or more tags and a real category";
  }
}
