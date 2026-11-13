/** Small color helpers for the flag browser: parsing, WCAG contrast, distance and hue. No dependencies. */
export type Rgb = readonly [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace(/^#/, "").toLowerCase();
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as unknown as Rgb;
}

export function isHex(input: string): boolean {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(input.trim());
}

export function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const mx = Math.max(rn, gn, bn);
  const mn = Math.min(rn, gn, bn);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : mx === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [h * 60, s, l];
}

export const describeColor = (hex: string): { hex: string; rgb: string; hsl: string } => {
  const rgb = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(rgb);
  return { hex: `#${hex.replace(/^#/, "").toLowerCase()}`, rgb: `rgb(${rgb.join(", ")})`, hsl: `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)` };
};

/** WCAG 2.x relative luminance. */
export function luminance([r, g, b]: Rgb): number {
  const lin = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Text color (black or white) with the higher contrast on `bgHex`, and whether it passes WCAG AA (4.5:1) for normal text. */
export function readableOn(bgHex: string): { text: "#000000" | "#ffffff"; ratio: number; passesAA: boolean } {
  const bg = hexToRgb(bgHex);
  const onBlack = contrastRatio(bg, [0, 0, 0]);
  const onWhite = contrastRatio(bg, [255, 255, 255]);
  const text = onBlack >= onWhite ? "#000000" : "#ffffff";
  const ratio = Math.max(onBlack, onWhite);
  return { text, ratio, passesAA: ratio >= 4.5 };
}

export function colorDistance(a: Rgb, b: Rgb): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Hue in degrees for sorting; near-grays sort after all hues. */
export function hueSortKey(hex: string): number {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  return s < 0.12 || l < 0.1 || l > 0.93 ? 1000 + l : h;
}
