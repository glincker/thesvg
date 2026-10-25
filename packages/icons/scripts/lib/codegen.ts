/**
 * Pure code generators for the @thesvg/icons dist output.
 *
 * Kept free of filesystem access so the emitted modules can be unit-tested
 * without running a full build. build-icons.ts resolves the SVG content and
 * writes the files; everything here just turns data into source text.
 */

import { toSafeIdentifier } from "./safe-identifier.ts";

// ---------------------------------------------------------------------------
// Types mirrored from icons.json shape
// ---------------------------------------------------------------------------

export interface RawIconVariants {
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

export interface RawIcon {
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
// Per-icon generators
// ---------------------------------------------------------------------------

/** Local that holds an icon's variant SVGs, so each string is written once. */
const VARIANT_SVGS = "variantSvgs";

/**
 * The named exports of a per-icon module, in emission order, each paired
 * with its JS literal. The ESM and CJS generators both render this list, so
 * the two formats can't drift apart.
 *
 * `svg` and `variants` refer to the VARIANT_SVGS local (see variantSvgsDecl)
 * instead of repeating the SVG text: the primary SVG is always one of the
 * variants.
 */
function iconExports(
  icon: RawIcon,
  allVariants: Record<string, string>,
  primary: string,
): Array<[name: string, literal: string]> {
  const primaryKey = Object.keys(allVariants).find((key) => allVariants[key] === primary);
  return [
    ["slug", JSON.stringify(icon.slug)],
    ["title", JSON.stringify(icon.title)],
    ["hex", JSON.stringify(icon.hex ?? "")],
    ["categories", serializeStringArray(icon.categories ?? [])],
    ["aliases", serializeStringArray(icon.aliases ?? [])],
    ["svg", primaryKey === undefined ? `\`${escapeTpl(primary)}\`` : `${VARIANT_SVGS}[${JSON.stringify(primaryKey)}]`],
    ["variants", VARIANT_SVGS],
    ["license", JSON.stringify(icon.license ?? "")],
    ["url", JSON.stringify(icon.url ?? "")],
  ];
}

/** Declares the VARIANT_SVGS local that `svg` and `variants` point at. */
function variantSvgsDecl(allVariants: Record<string, string>): string {
  return `const ${VARIANT_SVGS} = ${serializeRecord(allVariants)};`;
}

/** ESM module for one icon. `primary` is the SVG exported as `svg`. */
export function generateEsm(
  icon: RawIcon,
  allVariants: Record<string, string>,
  primary: string,
): string {
  const fields = iconExports(icon, allVariants, primary);
  return [
    `// @thesvg/icons - ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    variantSvgsDecl(allVariants),
    ``,
    ...fields.map(([name, literal]) => `export const ${name} = ${literal};`),
    ``,
    // Anonymous on purpose: a local named after the slug would clash with the
    // export of the same name for slugs like "svg" or "url".
    `export default { ${fields.map(([name]) => name).join(", ")} };`,
  ].join("\n");
}

/** CJS module for one icon. `primary` is the SVG exported as `svg`. */
export function generateCjs(
  icon: RawIcon,
  allVariants: Record<string, string>,
  primary: string,
): string {
  const fields = iconExports(icon, allVariants, primary);
  return [
    `"use strict";`,
    `// @thesvg/icons -${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    ``,
    variantSvgsDecl(allVariants),
    ``,
    ...fields.map(([name, literal]) => `exports.${name} = ${literal};`),
    ``,
    `exports.default = {`,
    ...fields.map(([name]) => `  ${name}: exports.${name},`),
    `};`,
  ].join("\n");
}

/** Type declarations for one icon module. */
export function generateDts(icon: RawIcon): string {
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
    // Same name tsc emits for a default export, so it can never clash with
    // the slug-independent named exports above.
    `declare const _default: IconModule;`,
    `export default _default;`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Barrel generators
// ---------------------------------------------------------------------------

export function generateEsmBarrel(slugs: string[]): string {
  // Runtime JS only: the IconModule/IconVariants type re-export lives in the
  // .d.ts barrel. `export type` is TypeScript syntax, so emitting it here
  // makes node and bundlers fail to parse index.js.
  const lines = [`// @thesvg/icons`, `// Auto-generated barrel. Do not edit.`, ``];
  for (const slug of slugs) {
    // named default re-export: import { default as github } from "./github.js"
    lines.push(`export { default as ${toSafeIdentifier(slug)} } from "./${slug}.js";`);
  }
  return lines.join("\n");
}

export function generateCjsBarrel(slugs: string[]): string {
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

export function generateDtsBarrel(slugs: string[]): string {
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
export function generateTypesDeclaration(): string {
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
