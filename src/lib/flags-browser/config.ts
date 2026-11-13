/** Limits and presets for the flag browser, read from the environment with documented defaults. */
const num = (raw: string | undefined, fallback: number): number => {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const FLAGS_RECENT_MAX = num(process.env.NEXT_PUBLIC_FLAGS_RECENT_MAX, 12);
export const FLAGS_STAR_MAX = num(process.env.NEXT_PUBLIC_FLAGS_STAR_MAX, 48);
export const FLAGS_COLOR_TOLERANCE_DEFAULT = num(process.env.NEXT_PUBLIC_FLAGS_COLOR_TOLERANCE, 40);
/** A palette color counts for a color filter only above this share, in percent. */
export const FLAGS_COLOR_MIN_SHARE = num(process.env.NEXT_PUBLIC_FLAGS_COLOR_MIN_SHARE, 5);

/** Rendered tile height in px per size preset; width follows the shape. */
export const FLAG_SIZES = { s: 24, m: 40, l: 64 } as const;
export type FlagSize = keyof typeof FLAG_SIZES;
