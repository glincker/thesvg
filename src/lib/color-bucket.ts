/**
 * Buckets a 6-digit hex color into a broad brand-color family. Used by the
 * Google 2026 landing's color filter so users can find "all the blue ones"
 * without knowing exact hex values.
 */
export type ColorBucket = "red" | "yellow" | "green" | "blue" | "purple" | "neutral";

export function colorBucket(hex: string | undefined | null): ColorBucket {
  if (!hex) return "neutral";
  const h = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "neutral";
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  if (sat < 0.12) return "neutral";

  let hue: number;
  if (max === r) hue = ((g - b) / sat) % 6;
  else if (max === g) hue = (b - r) / sat + 2;
  else hue = (r - g) / sat + 4;
  hue = (hue * 60 + 360) % 360;

  if (hue < 18 || hue >= 345) return "red";
  if (hue < 70) return "yellow";   // includes orange/amber
  if (hue < 180) return "green";   // includes teal
  if (hue < 260) return "blue";
  if (hue < 305) return "purple";
  return "red";
}

export const COLOR_BUCKETS: { id: ColorBucket; label: string; hex: string }[] = [
  { id: "red", label: "Red", hex: "#EA4335" },
  { id: "yellow", label: "Yellow", hex: "#FBBC04" },
  { id: "green", label: "Green", hex: "#34A853" },
  { id: "blue", label: "Blue", hex: "#4285F4" },
  { id: "purple", label: "Purple", hex: "#7248B9" },
  { id: "neutral", label: "Neutral", hex: "#5F6368" },
];
