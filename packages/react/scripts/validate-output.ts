/**
 * validate-output.ts
 *
 * Standalone validation script for @thesvg/react dist output.
 * Scans all .js files in dist/ and fails if any contain:
 * - TypeScript-only syntax (import type, export type, generic angle brackets)
 * - String-form style attributes (style="...") instead of React style objects
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
const REPO_ROOT = resolve(__dirname, "../../..");
const ICONS_PUBLIC = resolve(REPO_ROOT, "public/icons");

const PRIMARY_VARIANTS = ["default", "color", "mono", "light", "dark", "wordmark"];

interface RootPaint {
  fill?: string;
  stroke?: string;
}

function extractRootPaint(content: string): RootPaint {
  const svgTag = content.match(/<svg[^>]*>/s);
  if (!svgTag) return {};

  const fillMatch = svgTag[0].match(/\bfill=["']([^"']+)["']/);
  const strokeMatch = svgTag[0].match(/\bstroke=["']([^"']+)["']/);

  return {
    fill: fillMatch?.[1],
    stroke: strokeMatch?.[1],
  };
}

function primarySvgPath(slug: string): string | null {
  const iconDir = join(ICONS_PUBLIC, slug);
  if (!existsSync(iconDir)) return null;

  for (const variant of PRIMARY_VARIANTS) {
    const candidate = join(iconDir, `${variant}.svg`);
    if (existsSync(candidate)) return candidate;
  }

  const svgFiles = readdirSync(iconDir).filter((file) => file.endsWith(".svg")).sort();
  return svgFiles.length > 0 ? join(iconDir, svgFiles[0]) : null;
}

let errors = 0;
let checked = 0;

const files = readdirSync(DIST).filter((f) => f.endsWith(".js"));

if (files.length === 0) {
  console.error("No .js files found in dist/. Run `npm run build` first.");
  process.exit(1);
}

for (const file of files) {
  const content = readFileSync(join(DIST, file), "utf8");
  checked++;

  if (/\bimport\s+type\b/.test(content)) {
    console.error(`FAIL: ${file} contains "import type"`);
    errors++;
  }

  if (/\bexport\s+type\s*\{/.test(content)) {
    console.error(`FAIL: ${file} contains "export type {}"`);
    errors++;
  }

  if (/forwardRef</.test(content)) {
    console.error(`FAIL: ${file} contains generic type params on forwardRef`);
    errors++;
  }

  // Check for string-form style attributes in component files
  if (file !== "types.js" && file !== "index.js" && /style="[^"]*"/.test(content)) {
    console.error(`FAIL: ${file} contains style="..." string attribute`);
    errors++;
  }

  // Check for malformed nested <svg> tags (from Inkscape exports)
  if (file !== "types.js" && file !== "index.js" && /<svg=/.test(content)) {
    console.error(`FAIL: ${file} contains malformed <svg= (broken namespace cleanup)`);
    errors++;
  }

  // Check for XML prolog or Inkscape metadata in JSX
  if (file !== "types.js" && file !== "index.js" && /<\?xml/.test(content)) {
    console.error(`FAIL: ${file} contains XML prolog`);
    errors++;
  }

  // Check for DOCTYPE declarations
  if (file !== "types.js" && file !== "index.js" && /<!DOCTYPE/i.test(content)) {
    console.error(`FAIL: ${file} contains DOCTYPE declaration`);
    errors++;
  }

  // Check for inline <style> blocks (not valid React JSX)
  if (file !== "types.js" && file !== "index.js" && /<style[\s>]/i.test(content)) {
    console.error(`FAIL: ${file} contains <style> element`);
    errors++;
  }

  if (file !== "types.js" && file !== "index.js") {
    const slug = file.replace(/\.js$/, "");
    const svgPath = primarySvgPath(slug);

    if (svgPath) {
      const sourcePaint = extractRootPaint(readFileSync(svgPath, "utf8"));
      const outputPaint = extractRootPaint(content);

      if ((sourcePaint.fill ?? "none") !== (outputPaint.fill ?? "none")) {
        console.error(
          `FAIL: ${file} changed root fill from "${sourcePaint.fill ?? "none"}" to "${outputPaint.fill ?? "none"}"`,
        );
        errors++;
      }

      if ((sourcePaint.stroke ?? "") !== (outputPaint.stroke ?? "")) {
        console.error(
          `FAIL: ${file} changed root stroke from "${sourcePaint.stroke ?? ""}" to "${outputPaint.stroke ?? ""}"`,
        );
        errors++;
      }
    }
  }
}

if (errors > 0) {
  console.error(`\n${errors} error(s) in ${checked} files. Fix build-components.ts and rebuild.`);
  process.exit(1);
} else {
  console.log(`PASS: ${checked} .js files validated, no issues found.`);
}
