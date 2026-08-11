/**
 * validate-output.ts
 *
 * Standalone validation script for @thesvg/react-native dist output.
 * Scans dist/icons/*.js and fails if any contain:
 * - TypeScript-only syntax (import type)
 * - Raw JSX (the data + createIcon architecture should never emit JSX)
 * - Leftover XML/SVG-only markup (xml prolog, DOCTYPE, <style>, <title>, <filter>)
 * - class/className/string-style props react-native-svg can't consume
 * - A variant declared in icons.json (with a real SVG on disk) missing from
 *   the compiled output — regression test mirroring @thesvg/react's
 *   coverage check (see its scripts/validate-output.ts, issue #740).
 *
 * Run with:
 *   tsx scripts/validate-output.ts
 *   bun run scripts/validate-output.ts
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST = resolve(__dirname, "../dist");
const DIST_ICONS = join(DIST, "icons");
const REPO_ROOT = resolve(__dirname, "../../..");
const ICONS_JSON = resolve(REPO_ROOT, "src/data/icons.json");

interface RawIcon {
  slug: string;
  variants: Record<string, string>;
}

let errors = 0;
let checked = 0;

if (!existsSync(DIST_ICONS)) {
  console.error("No dist/icons directory found. Run `npm run build` first.");
  process.exit(1);
}

const files = readdirSync(DIST_ICONS).filter((f) => f.endsWith(".js"));

if (files.length === 0) {
  console.error("No .js files found in dist/icons/. Run `npm run build` first.");
  process.exit(1);
}

for (const file of files) {
  const content = readFileSync(join(DIST_ICONS, file), "utf8");
  checked++;

  if (/\bimport\s+type\b/.test(content)) {
    console.error(`FAIL: icons/${file} contains "import type"`);
    errors++;
  }

  if (/return\s*\(?\s*<[a-zA-Z]/.test(content) || /createElement\s*\(\s*['"]?</.test(content)) {
    console.error(`FAIL: icons/${file} contains raw JSX/markup (should be pure data)`);
    errors++;
  }

  if (/<\?xml/.test(content)) {
    console.error(`FAIL: icons/${file} contains XML prolog`);
    errors++;
  }
  if (/<!DOCTYPE/i.test(content)) {
    console.error(`FAIL: icons/${file} contains DOCTYPE declaration`);
    errors++;
  }
  if (/<style[\s>]/i.test(content)) {
    console.error(`FAIL: icons/${file} contains <style> element`);
    errors++;
  }
  if (/<title[\s>]/i.test(content)) {
    console.error(`FAIL: icons/${file} contains <title> element`);
    errors++;
  }
  if (/<filter[\s>]/i.test(content)) {
    console.error(`FAIL: icons/${file} contains <filter> element (unsupported by react-native-svg)`);
    errors++;
  }
  if (/"class"\s*:|"className"\s*:/.test(content)) {
    console.error(`FAIL: icons/${file} contains a class/className prop (no CSS engine in react-native-svg)`);
    errors++;
  }
  if (/"style"\s*:\s*"/.test(content)) {
    console.error(`FAIL: icons/${file} contains a string-form style prop (should be flattened onto element props)`);
    errors++;
  }
  if (/import\s*\{\s*createIcon\s*\}\s*from\s*'\.\.\/createIcon\.js'/.test(content) === false) {
    console.error(`FAIL: icons/${file} does not import the shared createIcon runtime`);
    errors++;
  }
}

// Every variant declared in icons.json with a real SVG on disk must survive
// into the compiled output, mirroring @thesvg/react's coverage check.
const icons: RawIcon[] = JSON.parse(readFileSync(ICONS_JSON, "utf8"));
let iconsChecked = 0;

for (const icon of icons) {
  const dtsPath = join(DIST_ICONS, `${icon.slug}.d.ts`);
  if (!existsSync(dtsPath)) continue;

  const dts = readFileSync(dtsPath, "utf8");
  const unionMatch = dts.match(/Variant = ([^;]+);/);
  const compiledVariants = new Set(
    unionMatch ? unionMatch[1].split("|").map((v) => v.trim().replace(/'/g, "")) : [],
  );

  for (const [variantKey, variantPath] of Object.entries(icon.variants)) {
    const svgFile = join(REPO_ROOT, "public", variantPath.replace(/^\//, ""));
    if (!existsSync(svgFile)) continue;

    if (!compiledVariants.has(variantKey)) {
      console.error(
        `FAIL: ${icon.slug} declares variant "${variantKey}" (${variantPath}) but it is missing from the compiled output`,
      );
      errors++;
    }
  }
  iconsChecked++;
}

// Shared runtime files must exist alongside the icons.
for (const f of ["createIcon.js", "createIcon.cjs", "createIcon.d.ts", "index.js", "index.cjs", "index.d.ts"]) {
  if (!existsSync(join(DIST, f))) {
    console.error(`FAIL: dist/${f} is missing`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n${errors} error(s) in ${checked} files. Fix build-components.ts and rebuild.`);
  process.exit(1);
} else {
  console.log(`PASS: ${checked} icon files validated, ${iconsChecked} icons' variant coverage checked, no issues found.`);
}
