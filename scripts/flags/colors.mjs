/**
 * Color math for the flag generator: hex building, HSL and the color family rule.
 * Documented in docs/flags.md. Kept in its own file so tests can import it without running the generator.
 */
export const hexOf = (r, g, b) => [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
export const hslOf = (hex) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};
/** Color family by HSL rule. Documented in docs/flags.md. */
export const familyOf = (hex) => {
  const [h, s, l] = hslOf(hex);
  if (l < 0.12) return "black";
  if (l > 0.93) return "white";
  if (s < 0.12) return l < 0.3 ? "black" : l > 0.8 ? "white" : "gray";
  if (h < 15 || h >= 345) return l > 0.75 ? "pink" : "red";
  if (h < 45 && l < 0.35 && s > 0.3) return "brown";
  if (h < 38) return "orange";
  if (h < 52) return l < 0.62 ? "gold" : "yellow";
  if (h < 70) return "yellow";
  if (h < 170) return "green";
  if (h < 255) return "blue";
  if (h < 315) return "purple";
  return "pink";
};
