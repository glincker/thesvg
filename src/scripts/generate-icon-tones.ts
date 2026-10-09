/**
 * Writes src/data/icon-tones.json: slug -> "dark" | "light" for icons whose
 * default artwork is painted entirely in near-black or near-white. Neutral
 * icons are omitted. Run as part of the build; the card reads this map to pick
 * a contrast disc for the preview tile.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { toneFromSvg } from "../lib/icon-tone";

const ICONS_DIR = join(process.cwd(), "public", "icons");
const OUT = join(process.cwd(), "src", "data", "icon-tones.json");

const tones: Record<string, "dark" | "light"> = {};
let scanned = 0;
for (const slug of readdirSync(ICONS_DIR).sort()) {
  const file = join(ICONS_DIR, slug, "default.svg");
  if (!existsSync(file)) continue;
  scanned++;
  const tone = toneFromSvg(readFileSync(file, "utf8"));
  if (tone !== "neutral") tones[slug] = tone;
}

writeFileSync(OUT, JSON.stringify(tones, null, 1) + "\n");
const dark = Object.values(tones).filter((t) => t === "dark").length;
console.log(`[icon-tones] ${scanned} icons scanned: ${dark} dark, ${Object.keys(tones).length - dark} light`);
