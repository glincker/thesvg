#!/usr/bin/env node
/**
 * Turns a raw website screenshot into an OG image: exactly 1200x630, cropped
 * from the top (so the header and hero stay in frame), metadata stripped,
 * palette-quantized PNG that stays small without visible banding.
 *
 *   node scripts/optimize-og.mjs <input.png> <output.png> [--max-kb=350]
 *
 * Needs ImageMagick (`magick`) on PATH. Typical use, after taking a
 * screenshot of the home page in each theme:
 *
 *   node scripts/optimize-og.mjs ~/Desktop/home-dark.png  public/og/site-dark.png
 *   node scripts/optimize-og.mjs ~/Desktop/home-light.png public/og/site-light.png
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const maxKb = Number(
  (args.find((a) => a.startsWith("--max-kb=")) ?? "--max-kb=350").split("=")[1],
);
const [input, output] = positional;

if (!input || !output) {
  console.error("usage: optimize-og.mjs <input.png> <output.png> [--max-kb=350]");
  process.exit(1);
}

const out = resolve(output);
mkdirSync(dirname(out), { recursive: true });

/** colors = 0 keeps full colour; otherwise quantize to that palette size. */
function run(colors) {
  const quantize = colors > 0 ? ["-colors", String(colors)] : [];
  execFileSync("magick", [
    resolve(input),
    "-resize",
    "1200x630^",
    "-gravity",
    "north",
    "-extent",
    "1200x630",
    "-strip",
    ...quantize,
    "-define",
    "png:compression-level=9",
    out,
  ]);
  return statSync(out).size / 1024;
}

// Full colour first: gradients stay smooth. Only quantize (halving the
// palette each pass) when the file is still over budget.
let colors = 0;
let kb = run(colors);
if (kb > maxKb) {
  colors = 256;
  kb = run(colors);
  while (kb > maxKb && colors > 32) {
    colors = Math.floor(colors / 2);
    kb = run(colors);
  }
}
console.log(
  `${output}: 1200x630, ${kb.toFixed(0)} KB, ${colors === 0 ? "full colour" : `${colors} colors`}`,
);
if (kb > maxKb) {
  console.warn(`warning: still above ${maxKb} KB; use a simpler crop`);
}
