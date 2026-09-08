/**
 * Derives a usable ambient-glow color from a brand hex. Many brand marks are
 * pure black, white, or low-saturation greys (great for a logo, unusable as
 * a glow: invisible against the page background or just a grey smudge), so
 * this clamps lightness and boosts saturation the same way Spotify's
 * "vibrancy filter" step does for album-art-derived backgrounds, rather than
 * rendering the raw brand color directly.
 */
export function brandGlowColor(hex: string | undefined): string | null {
  if (!hex) return null;
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }

  // Near-greyscale brand marks (most black/white logos) carry no usable hue
  // to glow with - fall back to nothing rather than render a flat grey smear.
  if (s < 0.12) return null;

  const clampedS = Math.min(Math.max(s, 0.55), 0.85);
  const clampedL = Math.min(Math.max(l, 0.42), 0.6);

  return hslToHex(h, clampedS, clampedL);
}

function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(color * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
