/**
 * build-components.ts
 *
 * Generates the @thesvg/astro distribution from the monorepo source data.
 * For each icon, emits an .astro component (frontmatter + SVG markup), a
 * type declaration, and an ESM/type barrel. Output is deterministic: icons
 * keep icons.json order and nothing time- or machine-dependent is written.
 *
 * Run with: tsx scripts/build-components.ts
 *
 * Output layout:
 *   dist/
 *     {slug}.astro        Astro component per icon
 *     {slug}.astro.d.ts   Type declaration per icon
 *     types.d.ts          Shared IconProps / IconComponent types
 *     index.js            ESM barrel (named re-exports)
 *     index.d.ts          Type barrel
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { publicSvgReader } from "../../icons/scripts/lib/public-svg.ts";
import { primarySvg } from "../../icons/scripts/lib/variants.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PKG_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(PKG_ROOT, "../..");
const readPublicSvg = publicSvgReader(join(REPO_ROOT, "public"));
const ICONS_JSON = join(REPO_ROOT, "src/data/icons.json");
const DIST = join(PKG_ROOT, "dist");

interface RawIcon {
  slug: string;
  title: string;
  variants: Record<string, string | undefined>;
}

// ---------------------------------------------------------------------------
// SVG parsing helpers
// ---------------------------------------------------------------------------

function extractViewBox(svg: string): string {
  const match = svg.match(/<svg[^>]*?\bviewBox=["']([^"']+)["']/s);
  return match ? match[1] : "0 0 24 24";
}

function extractRootTag(svg: string): string {
  const match = svg.match(/<svg[^>]*>/s);
  return match ? match[0] : "";
}

function extractInner(svg: string): string {
  return svg
    .replace(/^<svg[^>]*>/s, "")
    .replace(/<\/svg>\s*$/, "")
    .trim();
}

/** Drop <title> so the icon does not show a tooltip; aria props are the caller's. */
function stripTitle(inner: string): string {
  return inner.replace(/<title>[\s\S]*?<\/title>/g, "").trim();
}

/**
 * An icon is mono when nothing inside sets its own paint: no explicit
 * fill/stroke/stop-color values (other than none, currentColor, url refs),
 * no style attributes and no <style> blocks. Such icons inherit `color`.
 */
function isMono(inner: string): boolean {
  if (/<style[\s>]/i.test(inner) || /\sstyle=/i.test(inner)) return false;
  const paint = /\s(?:fill|stroke|stop-color|flood-color)=["']([^"']*)["']/gi;
  for (const m of inner.matchAll(paint)) {
    const value = m[1].trim().toLowerCase();
    if (value !== "none" && value !== "currentcolor" && !value.startsWith("url(")) return false;
  }
  return true;
}

/** SVG ids share the document scope, so prefix them per icon to avoid collisions. */
function namespaceIds(inner: string, slug: string): string {
  const ids = [...inner.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1]);
  if (ids.length === 0) return inner;
  const prefix = `thesvg-${slug}-`;
  let out = inner;
  for (const id of new Set(ids)) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out
      .replace(new RegExp(`(\\sid=["'])${escaped}(["'])`, "g"), `$1${prefix}${id}$2`)
      .replace(new RegExp(`url\\(#${escaped}\\)`, "g"), `url(#${prefix}${id})`)
      .replace(new RegExp(`((?:xlink:)?href=["'])#${escaped}(["'])`, "g"), `$1#${prefix}${id}$2`);
  }
  return out;
}

function toPascalCase(slug: string): string {
  const pascal = slug
    .split(/[-._]+/)
    .map((s) => (s.length === 0 ? "" : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()))
    .join("");
  return /^[0-9]/.test(pascal) ? `I${pascal}` : pascal;
}

// ---------------------------------------------------------------------------
// Code generators
// ---------------------------------------------------------------------------

function generateAstroComponent(icon: RawIcon): string | null {
  const svg = primarySvg(icon.variants, readPublicSvg);
  if (!svg) return null;

  const viewBox = extractViewBox(svg);
  const rootTag = extractRootTag(svg);
  const rootFill = rootTag.match(/\sfill=["']([^"']+)["']/)?.[1];
  const hasRootStroke = /\sstroke=["']/.test(rootTag);
  const inner = namespaceIds(stripTitle(extractInner(svg)), icon.slug);
  const mono = isMono(inner);
  // Mono icons paint with currentColor so `color` and CSS text color apply.
  const strokeOnly = hasRootStroke || /\sstroke=/.test(inner);
  const fill = rootFill === "none" && mono && !strokeOnly ? "currentColor" : (rootFill ?? (strokeOnly ? "none" : "currentColor"));

  // The markup goes in via set:html because Astro would otherwise parse
  // braces and <style>/<script> inside the SVG as template syntax.
  return [
    `---`,
    `// @thesvg/astro - ${icon.title}. Auto-generated. Do not edit.`,
    `import type { HTMLAttributes } from "astro/types";`,
    ``,
    `export interface Props extends HTMLAttributes<"svg"> {`,
    `  /** Width and height. Numbers are pixels. Defaults to "1em". */`,
    `  size?: number | string;`,
    `  /** Sets the CSS color${mono ? "" : " (no effect: this icon has fixed brand colors)"}. */`,
    `  color?: string;`,
    `}`,
    ``,
    `const { size = "1em", color, class: className, style, ...rest } = Astro.props;`,
    `const inlineStyle = [color ? \`color:\${color}\` : "", typeof style === "string" ? style : ""]`,
    `  .filter(Boolean)`,
    `  .join(";");`,
    `const markup = ${JSON.stringify(inner)};`,
    `---`,
    `<svg`,
    `  xmlns="http://www.w3.org/2000/svg"`,
    `  viewBox="${viewBox}"`,
    `  fill="${fill}"`,
    `  width={size}`,
    `  height={size}`,
    `  class={className}`,
    `  style={inlineStyle || undefined}`,
    `  {...rest}`,
    `><Fragment set:html={markup} /></svg>`,
  ].join("\n");
}

function generateTypesFile(): string {
  return [
    `// @thesvg/astro. Auto-generated. Do not edit.`,
    ``,
    `import type { AstroComponentFactory } from "astro/runtime/server/index.js";`,
    `import type { HTMLAttributes } from "astro/types";`,
    ``,
    `export interface IconProps extends HTMLAttributes<"svg"> {`,
    `  /** Width and height. Numbers are pixels. Defaults to "1em". */`,
    `  size?: number | string;`,
    `  /** Sets the CSS color. Only affects single-color icons. */`,
    `  color?: string;`,
    `}`,
    ``,
    `export type IconComponent = AstroComponentFactory & ((props: IconProps) => ReturnType<AstroComponentFactory>);`,
  ].join("\n");
}

function generateDts(icon: RawIcon): string {
  return [
    `// @thesvg/astro - ${icon.title}. Auto-generated. Do not edit.`,
    `import type { IconComponent } from "./types";`,
    ``,
    `declare const ${toPascalCase(icon.slug)}: IconComponent;`,
    `export default ${toPascalCase(icon.slug)};`,
  ].join("\n");
}

function generateBarrel(entries: Array<{ slug: string; name: string }>, dts: boolean): string {
  const lines = [`// @thesvg/astro`, `// Auto-generated ${dts ? "type " : ""}barrel. Do not edit.`, ``];
  for (const { slug, name } of entries) {
    lines.push(`export { default as ${name} } from "./${slug}.astro";`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const icons = JSON.parse(readFileSync(ICONS_JSON, "utf8")) as RawIcon[];
  console.log(`Found ${icons.length} icons.`);

  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  const entries: Array<{ slug: string; name: string }> = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (const icon of icons) {
    const name = toPascalCase(icon.slug);
    if (seen.has(name)) {
      throw new Error(`Duplicate component name "${name}" (slug "${icon.slug}")`);
    }
    seen.add(name);

    const component = generateAstroComponent(icon);
    if (!component) {
      skipped++;
      continue;
    }
    writeFileSync(join(DIST, `${icon.slug}.astro`), component + "\n");
    writeFileSync(join(DIST, `${icon.slug}.astro.d.ts`), generateDts(icon) + "\n");
    entries.push({ slug: icon.slug, name });
  }

  writeFileSync(join(DIST, "types.d.ts"), generateTypesFile() + "\n");
  writeFileSync(join(DIST, "index.js"), generateBarrel(entries, false) + "\n");
  writeFileSync(join(DIST, "index.d.ts"), generateBarrel(entries, true) + "\n");

  console.log(`Built ${entries.length} components (${skipped} skipped, no SVG source).`);
  console.log(`Output: ${DIST}`);
}

main();
