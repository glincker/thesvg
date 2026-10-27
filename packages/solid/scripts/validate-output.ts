/**
 * validate-output.ts
 *
 * Checks the built dist/ of this package (identical copy in @thesvg/solid and
 * @thesvg/preact). Fails when a module carries TypeScript-only syntax, editor
 * leftovers (XML prolog, DOCTYPE, <style>), a changed root fill/stroke, fails the
 * fidelity regression probes (slash, yarn, theauth), or is
 * missing an icon or a variant that icons.json declares.
 *
 * Run with: tsx scripts/validate-output.ts
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(here, "../dist");
const REPO_ROOT = resolve(here, "../../..");
const ICONS_PUBLIC = join(REPO_ROOT, "public/icons");
const PRIMARY = ["default", "color", "mono", "light", "dark", "wordmark"];
const SKIP = new Set(["index.js", "types.js", "_runtime.js"]);

interface RawIcon {
  slug: string;
  variants: Record<string, string | undefined>;
}

function sourcePaint(svg: string): { fill: string; stroke: string } {
  const tag = svg.match(/<svg[^>]*>/s)?.[0] ?? "";
  const fill = tag.match(/\bfill=["']([^"']+)["']/)?.[1];
  const stroke = tag.match(/\bstroke=["']([^"']+)["']/)?.[1];
  return { fill: fill ?? (stroke ? "none" : "currentColor"), stroke: stroke ?? "" };
}

function primarySvgPath(slug: string): string | null {
  const dir = join(ICONS_PUBLIC, slug);
  if (!existsSync(dir)) return null;
  for (const v of PRIMARY) {
    const f = join(dir, `${v}.svg`);
    if (existsSync(f)) return f;
  }
  const first = readdirSync(dir).filter((f) => f.endsWith(".svg")).sort()[0];
  return first ? join(dir, first) : null;
}

if (!existsSync(DIST)) {
  console.error("No dist/ found. Run `pnpm build` first.");
  process.exit(1);
}

const icons = JSON.parse(readFileSync(join(REPO_ROOT, "src/data/icons.json"), "utf8")) as RawIcon[];
let errors = 0;
const fail = (msg: string): void => {
  console.error(`FAIL: ${msg}`);
  errors++;
};

for (const icon of icons) {
  for (const ext of [".js", ".cjs", ".d.ts"]) {
    if (!existsSync(join(DIST, icon.slug + ext))) fail(`${icon.slug}${ext} is missing`);
  }
}

let checked = 0;
for (const file of readdirSync(DIST).filter((f) => f.endsWith(".js") && !SKIP.has(f))) {
  checked++;
  const content = readFileSync(join(DIST, file), "utf8");
  if (/\bimport\s+type\b/.test(content) || /\bexport\s+type\s*\{/.test(content)) fail(`${file} has TypeScript-only syntax`);
  if (/<\?xml/.test(content)) fail(`${file} contains an XML prolog`);
  if (/<!DOCTYPE/i.test(content)) fail(`${file} contains a DOCTYPE`);
  if (/<style[\s>]/i.test(content)) fail(`${file} contains a <style> element`);
  if (/<svg=/.test(content)) fail(`${file} contains a broken nested <svg=`);

  const svgPath = primarySvgPath(file.replace(/\.js$/, ""));
  const out = content.match(/"default":\{"viewBox":"[^"]*","fill":"([^"]*)","attrs":\{(.*?)\},"childNodes"/);
  if (svgPath && out) {
    const src = sourcePaint(readFileSync(svgPath, "utf8"));
    const outStroke = out[2].match(/"stroke":"([^"]*)"/)?.[1] ?? "";
    if (src.fill !== out[1]) fail(`${file} changed root fill from "${src.fill}" to "${out[1]}"`);
    if (src.stroke !== outStroke) fail(`${file} changed root stroke from "${src.stroke}" to "${outStroke}"`);
  }
}
if (checked === 0) fail("no component modules found in dist/");

// Every declared variant with a real file must survive into the component.
let variantChecked = 0;
for (const icon of icons) {
  const dtsFile = join(DIST, `${icon.slug}.d.ts`);
  if (!existsSync(dtsFile)) continue;
  const union = readFileSync(dtsFile, "utf8").match(/Variant = ([^;]+);/)?.[1] ?? "";
  const compiled = new Set(union.split("|").map((v) => v.trim().replace(/'/g, "")));
  for (const [key, path] of Object.entries(icon.variants)) {
    if (!path || !existsSync(join(REPO_ROOT, "public", path.replace(/^\//, "")))) continue;
    if (!compiled.has(key)) fail(`${icon.slug} declares variant "${key}" but it is missing from the output`);
  }
  variantChecked++;
}

// Regression checks for fidelity bugs: each probes one fixed behavior in the
// built output of a real icon (root attributes, baked <style>, nested svg, mono none).
function probe(slug: string, label: string, test: (src: string) => boolean): void {
  const f = join(DIST, `${slug}.js`);
  if (!existsSync(f)) return;
  if (!test(readFileSync(f, "utf8"))) fail(`regression: ${slug} ${label}`);
}
probe("slash", "lost root stroke-width or stroke-linecap", (c) => c.includes('"stroke-width":"2"') && c.includes('"stroke-linecap":"round"'));
probe("yarn", "lost class-based fill from <style>", (c) => c.includes('"fill":"#2c8ebb"') && !c.includes('"class"'));
probe("theauth", "lost nested <svg> wrapper or its viewBox", (c) => c.includes('"type":"svg"') && c.includes('"x":"-1"') && c.includes('"viewBox":"0 0 64 64"'));
probe("theauth", "mono variant rewrote fill=none", (c) => /"mono":\{"viewBox":"[^"]*","fill":"none"/.test(c));

if (errors > 0) {
  console.error(`\n${errors} error(s) in ${checked} modules.`);
  process.exit(1);
}
console.log(`PASS: ${checked} modules validated, ${variantChecked} icons' variants checked.`);
