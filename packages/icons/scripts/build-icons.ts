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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
const ICONS_PUBLIC = join(REPO_ROOT, "public/icons");
const DIST = join(PKG_ROOT, "dist");

// ---------------------------------------------------------------------------
// Types mirrored from icons.json shape
// ---------------------------------------------------------------------------

interface RawIconVariants {
  default?: string;
  mono?: string;
  light?: string;
  dark?: string;
  wordmark?: string;
  wordmarkLight?: string;
  wordmarkDark?: string;
  color?: string;
  [key: string]: string | undefined;
}

interface RawIcon {
  slug: string;
  title: string;
  aliases: string[];
  hex: string;
  categories: string[];
  variants: RawIconVariants;
  license: string;
  url: string;
  guidelines?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read an SVG file from the public directory. Returns empty string on miss. */
function readSvg(slug: string, variant: string): string {
  // The JSON paths look like "/icons/{slug}/{variant}.svg" — strip the leading "/"
  // and resolve against the REPO_ROOT/public directory.
  const filePath = join(ICONS_PUBLIC, slug, `${variant}.svg`);
  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf8").trim();
}

/**
 * Resolve the "primary" SVG for an icon.
 * Preference order: default → color → first available variant.
 */
function primarySvg(slug: string, variants: RawIconVariants): string {
  const order = ["default", "color", "mono", "light", "dark", "wordmark"];
  for (const v of order) {
    if (v in variants) {
      const content = readSvg(slug, v);
      if (content) return content;
    }
  }
  // Fall back to whatever variant is first in the object
  for (const v of Object.keys(variants)) {
    const content = readSvg(slug, v);
    if (content) return content;
  }
  return "";
}

/** Escape a string so it is safe inside a JS template literal. */
function escapeTpl(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

/** Serialise a string array to an inline JS array literal. */
function serializeStringArray(arr: string[]): string {
  return "[" + arr.map((s) => JSON.stringify(s)).join(", ") + "]";
}

/** Serialise a Record<string,string> to an inline JS object literal. */
function serializeRecord(record: Record<string, string>): string {
  const entries = Object.entries(record)
    .map(([k, v]) => `  ${JSON.stringify(k)}: \`${escapeTpl(v)}\``)
    .join(",\n");
  return `{\n${entries}\n}`;
}

// ---------------------------------------------------------------------------
// Code generators
// ---------------------------------------------------------------------------

function generateEsm(icon: RawIcon, allVariants: Record<string, string>): string {
  const primary = primarySvg(icon.slug, icon.variants);
  const safe = toSafeIdentifier(icon.slug);
  return [
    `// @thesvg/icons - ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    `export const slug = ${JSON.stringify(icon.slug)};`,
    `export const title = ${JSON.stringify(icon.title)};`,
    `export const hex = ${JSON.stringify(icon.hex ?? "")};`,
    `export const categories = ${serializeStringArray(icon.categories ?? [])};`,
    `export const aliases = ${serializeStringArray(icon.aliases ?? [])};`,
    `export const svg = \`${escapeTpl(primary)}\`;`,
    `export const variants = ${serializeRecord(allVariants)};`,
    `export const license = ${JSON.stringify(icon.license ?? "")};`,
    `export const url = ${JSON.stringify(icon.url ?? "")};`,
    ``,
    `const ${safe} = { slug, title, hex, categories, aliases, svg, variants, license, url };`,
    `export default ${safe};`,
  ].join("\n");
}

function generateCjs(icon: RawIcon, allVariants: Record<string, string>): string {
  const primary = primarySvg(icon.slug, icon.variants);
  return [
    `"use strict";`,
    `// @thesvg/icons -${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    ``,
    `exports.slug = ${JSON.stringify(icon.slug)};`,
    `exports.title = ${JSON.stringify(icon.title)};`,
    `exports.hex = ${JSON.stringify(icon.hex ?? "")};`,
    `exports.categories = ${serializeStringArray(icon.categories ?? [])};`,
    `exports.aliases = ${serializeStringArray(icon.aliases ?? [])};`,
    `exports.svg = \`${escapeTpl(primary)}\`;`,
    `exports.variants = ${serializeRecord(allVariants)};`,
    `exports.license = ${JSON.stringify(icon.license ?? "")};`,
    `exports.url = ${JSON.stringify(icon.url ?? "")};`,
    ``,
    `exports.default = {`,
    `  slug: exports.slug,`,
    `  title: exports.title,`,
    `  hex: exports.hex,`,
    `  categories: exports.categories,`,
    `  aliases: exports.aliases,`,
    `  svg: exports.svg,`,
    `  variants: exports.variants,`,
    `  license: exports.license,`,
    `  url: exports.url,`,
    `};`,
  ].join("\n");
}

function generateDts(icon: RawIcon): string {
  const safe = toSafeIdentifier(icon.slug);
  return [
    `// @thesvg/icons - ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    `import type { IconModule } from "./index.js";`,
    ``,
    `export declare const slug: string;`,
    `export declare const title: string;`,
    `export declare const hex: string;`,
    `export declare const categories: string[];`,
    `export declare const aliases: string[];`,
    `export declare const svg: string;`,
    `export declare const variants: Record<string, string>;`,
    `export declare const license: string;`,
    `export declare const url: string;`,
    ``,
    `declare const ${safe}: IconModule;`,
    `export default ${safe};`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Barrel generators
// ---------------------------------------------------------------------------

function generateEsmBarrel(slugs: string[]): string {
  const lines = [
    `// @thesvg/icons`,
    `// Auto-generated barrel. Do not edit.`,
    ``,
    `export type { IconModule, IconVariants } from "./types.js";`,
    ``,
  ];
  for (const slug of slugs) {
    // named default re-export: import { default as github } from "./github.js"
    lines.push(`export { default as ${toSafeIdentifier(slug)} } from "./${slug}.js";`);
  }
  return lines.join("\n");
}

function generateCjsBarrel(slugs: string[]): string {
  const lines = [
    `"use strict";`,
    `// @thesvg/icons`,
    `// Auto-generated barrel. Do not edit.`,
    ``,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    ``,
  ];
  for (const slug of slugs) {
    lines.push(
      `const _${toSafeIdentifier(slug)} = require("./${slug}.cjs");`,
      `exports.${toSafeIdentifier(slug)} = _${toSafeIdentifier(slug)}.default;`,
    );
  }
  return lines.join("\n");
}

function generateDtsBarrel(slugs: string[]): string {
  const lines = [
    `// @thesvg/icons`,
    `// Auto-generated type barrel. Do not edit.`,
    ``,
    `export type { IconModule, IconVariants } from "./types.js";`,
    ``,
  ];
  for (const slug of slugs) {
    const safe = toSafeIdentifier(slug);
    lines.push(`export { default as ${safe} } from "./${slug}.js";`);
  }
  return lines.join("\n");
}

/** Copy the types.ts source as a types.d.ts declaration for the barrel. */
function generateTypesDeclaration(): string {
  return [
    `// @thesvg/icons -shared types`,
    `// Auto-generated. Do not edit.`,
    ``,
    `export type IconVariants = Record<string, string>;`,
    ``,
    `export interface IconModule {`,
    `  slug: string;`,
    `  title: string;`,
    `  hex: string;`,
    `  categories: string[];`,
    `  aliases: string[];`,
    `  svg: string;`,
    `  variants: IconVariants;`,
    `  license: string;`,
    `  url: string;`,
    `}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Reserved words (and a few globals) that are illegal as a binding name. A slug
 * like "await" would otherwise emit `const await = ...`, which is a syntax
 * error and breaks the whole package build (and any consumer's type-check).
 */
const RESERVED_IDENTIFIERS = new Set([
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

/**
 * Turn a slug into a valid JS identifier.
 * Slugs can start with digits (e.g. "01dotai") or contain hyphens/dots.
 * Strategy: prefix with "i_" if it starts with a digit or is a reserved word,
 * replace non-word chars with "_".
 */
function toSafeIdentifier(slug: string): string {
  let id = slug.replace(/[^a-zA-Z0-9_]/g, "_");
  if (/^[0-9]/.test(id) || RESERVED_IDENTIFIERS.has(id)) id = `i_${id}`;
  return id;
}

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
    const allVariants: Record<string, string> = {};
    for (const variantKey of Object.keys(icon.variants)) {
      const content = readSvg(icon.slug, variantKey);
      if (content) allVariants[variantKey] = content;
    }

    // Skip icons with no SVG data - don't ship empty modules
    const primary = primarySvg(icon.slug, icon.variants);
    if (!primary) {
      skipped++;
      continue;
    }

    // Write ESM module
    writeFileSync(join(DIST, `${icon.slug}.js`), generateEsm(icon, allVariants) + "\n");
    // Write CJS module
    writeFileSync(join(DIST, `${icon.slug}.cjs`), generateCjs(icon, allVariants) + "\n");
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
