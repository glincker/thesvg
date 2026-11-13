// Measures how visible each icon really is by rasterizing it, then writes src/data/icon-tone-raster.json:
//   dark:  artwork that vanishes on the flat dark tile (near-black or very dark marks)
//   light: artwork that vanishes on the light tile (near-white marks)
// Run when icons are added or changed. It needs @resvg/resvg-js, which is not a project dependency:
//   npx -p @resvg/resvg-js node scripts/icon-tones-raster.mjs   (or install it temporarily)
import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let Resvg;
try {
  ({ Resvg } = require("@resvg/resvg-js"));
} catch {
  console.error("Install @resvg/resvg-js first (it is only needed for this script).");
  process.exit(1);
}

const ROOT = join(process.cwd(), "public", "icons");
const OUT = join(process.cwd(), "src", "data", "icon-tone-raster.json");
const env = (k, d) => (process.env[k] !== undefined ? Number(process.env[k]) : d);
const DARK_TILE_MIN = env("ICON_TONE_DARK_MIN_LUM", 0.127); // WCAG 3:1 against the flat dark tile
const LIGHT_TILE_MAX = env("ICON_TONE_LIGHT_MAX_LUM", 0.283); // WCAG 3:1 against the light tile
const SHARE = env("ICON_TONE_SHARE", 0.85); // share of painted pixels that must fail
const DARK_MEDIAN_MAX = env("ICON_TONE_DARK_MEDIAN_MAX", 0.1);
const LIGHT_MEDIAN_MIN = env("ICON_TONE_LIGHT_MEDIAN_MIN", 0.7);

const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

const dark = [];
const light = [];
let measured = 0;
for (const slug of readdirSync(ROOT).sort()) {
  const file = join(ROOT, slug, "default.svg");
  if (!existsSync(file)) continue;
  try {
    const { pixels } = new Resvg(readFileSync(file, "utf8"), { fitTo: { mode: "width", value: 48 } }).render();
    const ls = [];
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] > 127) ls.push(lum(pixels[i], pixels[i + 1], pixels[i + 2]));
    if (ls.length < 20) continue;
    measured++;
    ls.sort((a, b) => a - b);
    const med = ls[Math.floor(ls.length / 2)];
    const low = ls.filter((l) => l < DARK_TILE_MIN).length / ls.length;
    const high = ls.filter((l) => l > LIGHT_TILE_MAX).length / ls.length;
    if (low >= SHARE && med < DARK_MEDIAN_MAX) dark.push(slug);
    else if (high >= SHARE && med > LIGHT_MEDIAN_MIN) light.push(slug);
  } catch {
    /* an SVG this renderer cannot draw keeps the color-based result */
  }
}
writeFileSync(OUT, JSON.stringify({ measured, dark, light }, null, 1) + "\n");
console.log(`[icon-tones-raster] ${measured} measured: ${dark.length} need a light plate on dark, ${light.length} need a dark plate on light`);
