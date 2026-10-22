/**
 * build-icons.ts
 *
 * Generates the @thesvg/icons distribution from the monorepo source data.
 *
 * Run with:
 *   bun run scripts/build-icons.ts
 *   tsx  scripts/build-icons.ts
 *
 * Output layout:
 *   dist/
 *     {slug}.js      ESM module per icon
 *     {slug}.cjs     CJS module per icon
 *     {slug}.d.ts    Type declarations per icon
 *     index.js       ESM barrel
 *     index.cjs      CJS barrel
 *     index.d.ts     Type barrel
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  generateCjs,
  generateCjsBarrel,
  generateDts,
  generateDtsBarrel,
  generateEsm,
  generateEsmBarrel,
  generateTypesDeclaration,
  type RawIcon,
} from "./lib/codegen.ts";
import { publicSvgReader } from "./lib/public-svg.ts";
import { resolveSvgs } from "./lib/variants.ts";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Root of the packages/icons package */
const PKG_ROOT = resolve(__dirname, "..");
/** Root of the thesvg monorepo */
const REPO_ROOT = resolve(PKG_ROOT, "../..");
const ICONS_JSON = join(REPO_ROOT, "src/data/icons.json");
const DIST = join(PKG_ROOT, "dist");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const readPublicSvg = publicSvgReader(join(REPO_ROOT, "public"));

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log("Reading icons.json…");
  const rawIcons: RawIcon[] = JSON.parse(readFileSync(ICONS_JSON, "utf8")) as RawIcon[];
  console.log(`Found ${rawIcons.length} icons.`);

  mkdirSync(DIST, { recursive: true });

  const processedSlugs: string[] = [];
  let skipped = 0;

  for (const icon of rawIcons) {
    const { variants: allVariants, primary } = resolveSvgs(icon, readPublicSvg);

    // Skip icons with no SVG data - don't ship empty modules
    if (!primary) {
      skipped++;
      continue;
    }

    // Write ESM module
    writeFileSync(join(DIST, `${icon.slug}.js`), generateEsm(icon, allVariants, primary) + "\n");
    // Write CJS module
    writeFileSync(join(DIST, `${icon.slug}.cjs`), generateCjs(icon, allVariants, primary) + "\n");
    // Write type declaration
    writeFileSync(join(DIST, `${icon.slug}.d.ts`), generateDts(icon) + "\n");

    processedSlugs.push(icon.slug);

    if (processedSlugs.length % 500 === 0) {
      console.log(`  Processed ${processedSlugs.length} / ${rawIcons.length}…`);
    }
  }

  if (skipped > 0) {
    console.log(`  Skipped ${skipped} icons with no SVG data.`);
  }

  // Shared types declaration
  writeFileSync(join(DIST, "types.d.ts"), generateTypesDeclaration() + "\n");
  // A minimal types.js so the ESM barrel can import from it at runtime if needed
  writeFileSync(
    join(DIST, "types.js"),
    `// @thesvg/icons -shared types (runtime stub, types are declaration-only)\nexport {};\n`,
  );
  writeFileSync(
    join(DIST, "types.cjs"),
    `"use strict";\n// @thesvg/icons -shared types (runtime stub)\nObject.defineProperty(exports, "__esModule", { value: true });\n`,
  );

  // Barrel files
  writeFileSync(join(DIST, "index.js"), generateEsmBarrel(processedSlugs) + "\n");
  writeFileSync(join(DIST, "index.cjs"), generateCjsBarrel(processedSlugs) + "\n");
  writeFileSync(join(DIST, "index.d.ts"), generateDtsBarrel(processedSlugs) + "\n");

  console.log(`\nDone. Built ${processedSlugs.length} icons.`);
  console.log(`Output: ${DIST}`);
}

main();
