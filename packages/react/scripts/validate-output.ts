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

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST = resolve(__dirname, "../dist");

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
}

if (errors > 0) {
  console.error(`\n${errors} error(s) in ${checked} files. Fix build-components.ts and rebuild.`);
  process.exit(1);
} else {
  console.log(`PASS: ${checked} .js files validated, no issues found.`);
}
