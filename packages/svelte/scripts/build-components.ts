/**
 * build-components.ts
 *
 * Generates the @thesvg/svelte distribution from the monorepo source data.
 * For each icon, reads the default SVG and emits a .svelte component file
 * with the SVG content and $$restProps for attribute forwarding.
 *
 * Run with:
 *   bun run scripts/build-components.ts
 *   tsx  scripts/build-components.ts
 *
 * Output layout:
 *   dist/
 *     {slug}.svelte   Svelte component per icon
 *     {slug}.d.ts     Type declarations per icon
 *     index.js        ESM barrel (named re-exports)
 *     index.d.ts      Type barrel
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { publicSvgReader } from "../../icons/scripts/lib/public-svg.ts";
import { primarySvg } from "../../icons/scripts/lib/variants.ts";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Root of the packages/svelte package */
const PKG_ROOT = resolve(__dirname, "..");
/** Root of the thesvg monorepo */
const REPO_ROOT = resolve(PKG_ROOT, "../..");
/** Reads icon SVGs by their icons.json path (shared with the other builders). */
const readPublicSvg = publicSvgReader(join(REPO_ROOT, "public"));
const ICONS_JSON = join(REPO_ROOT, "src/data/icons.json");
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
// SVG reading & parsing
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SVG parsing helpers
// ---------------------------------------------------------------------------

/**
 * Extract the viewBox attribute from an SVG string.
 * Returns "0 0 24 24" as a safe fallback.
 */
function extractViewBox(svgContent: string): string {
  const match = svgContent.match(/viewBox=["']([^"']+)["']/);
  return match ? match[1] : "0 0 24 24";
}

/**
 * Extract the inner content of an SVG (everything between <svg> and </svg>).
 */
function extractSvgInner(svgContent: string): string {
  return svgContent
    .replace(/^<svg[^>]*>/s, "")
    .replace(/<\/svg>\s*$/, "")
    .trim();
}

// ---------------------------------------------------------------------------
// PascalCase / identifier helpers
// ---------------------------------------------------------------------------

/**
 * Convert a slug to a PascalCase component name.
 */
function toPascalCase(slug: string): string {
  const pascal = slug
    .split(/[-._]+/)
    .map((segment) => {
      if (segment.length === 0) return "";
      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join("");

  if (/^[0-9]/.test(pascal)) return `I${pascal}`;
  return pascal;
}

// ---------------------------------------------------------------------------
// Code generators
// ---------------------------------------------------------------------------

function generateSvelteComponent(icon: RawIcon): string {
  const svgContent = primarySvg(icon.variants, readPublicSvg);

  if (!svgContent) {
    return [
      `<!-- @thesvg/svelte - ${icon.title} -->`,
      `<!-- Auto-generated. Do not edit. -->`,
      `<!-- WARNING: SVG source not found for slug "${icon.slug}" -->`,
    ].join("\n");
  }

  const viewBox = extractViewBox(svgContent);
  const inner = extractSvgInner(svgContent);

  // Indent inner content for readability
  const indentedInner = inner
    .split("\n")
    .map((line) => (line.trim() ? `  ${line}` : ""))
    .join("\n");

  return [
    `<!-- @thesvg/svelte - ${icon.title} -->`,
    `<!-- Auto-generated. Do not edit. -->`,
    `<svg viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" {...$$restProps}>`,
    indentedInner,
    `</svg>`,
  ].join("\n");
}

function generateDtsComponent(icon: RawIcon): string {
  const componentName = toPascalCase(icon.slug);
  return [
    `// @thesvg/svelte - ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    `import type { SvelteComponent } from 'svelte';`,
    `import type { SVGAttributes } from 'svelte/elements';`,
    ``,
    `export default class ${componentName} extends SvelteComponent<SVGAttributes<SVGSVGElement>> {}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Barrel generators
// ---------------------------------------------------------------------------

function generateEsmBarrel(entries: Array<{ slug: string; componentName: string }>): string {
  const lines = [
    `// @thesvg/svelte`,
    `// Auto-generated barrel. Do not edit.`,
    ``,
  ];
  for (const { slug, componentName } of entries) {
    lines.push(`export { default as ${componentName} } from './${slug}.svelte';`);
  }
  return lines.join("\n");
}

function generateDtsBarrel(entries: Array<{ slug: string; componentName: string }>): string {
  const lines = [
    `// @thesvg/svelte`,
    `// Auto-generated type barrel. Do not edit.`,
    ``,
  ];
  for (const { componentName, slug } of entries) {
    lines.push(`export { default as ${componentName} } from './${slug}.svelte';`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log("Reading icons.json...");
  const rawIcons: RawIcon[] = JSON.parse(readFileSync(ICONS_JSON, "utf8")) as RawIcon[];
  console.log(`Found ${rawIcons.length} icons.`);

  mkdirSync(DIST, { recursive: true });

  const entries: Array<{ slug: string; componentName: string }> = [];
  let skipped = 0;

  for (const icon of rawIcons) {
    const componentName = toPascalCase(icon.slug);

    // Write .svelte component
    writeFileSync(join(DIST, `${icon.slug}.svelte`), generateSvelteComponent(icon) + "\n");
    // Write type declarations (*.svelte.d.ts so TS resolves types for .svelte imports)
    writeFileSync(join(DIST, `${icon.slug}.svelte.d.ts`), generateDtsComponent(icon) + "\n");

    const svgExists = Boolean(primarySvg(icon.variants, readPublicSvg));
    if (!svgExists) skipped++;

    entries.push({ slug: icon.slug, componentName });

    if (entries.length % 500 === 0) {
      console.log(`  Processed ${entries.length} / ${rawIcons.length}...`);
    }
  }

  // Barrel files
  writeFileSync(join(DIST, "index.js"), generateEsmBarrel(entries) + "\n");
  writeFileSync(join(DIST, "index.d.ts"), generateDtsBarrel(entries) + "\n");

  console.log(`\nDone. Built ${entries.length} components (${skipped} had no SVG source).`);
  if (skipped > 0) {
    console.log(`  ${skipped} icons emitted null placeholder components - check SVG paths.`);
  }
  console.log(`Output: ${DIST}`);
}

main();
