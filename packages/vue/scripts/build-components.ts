/**
 * build-components.ts
 *
 * Generates the @thesvg/vue distribution from the monorepo source data.
 * For each icon, reads the default SVG and emits a Vue 3 render-function
 * component using defineComponent + h().
 *
 * Run with:
 *   bun run scripts/build-components.ts
 *   tsx  scripts/build-components.ts
 *
 * Output layout:
 *   dist/
 *     {slug}.js      ESM component per icon
 *     {slug}.cjs     CJS component per icon
 *     {slug}.d.ts    Type declarations per icon
 *     index.js       ESM barrel (named exports)
 *     index.cjs      CJS barrel (named exports)
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

/** Root of the packages/vue package */
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
// SVG reading & parsing
// ---------------------------------------------------------------------------

/** Read an SVG file from the public directory. Returns empty string on miss. */
function readSvg(slug: string, variant: string): string {
  const filePath = join(ICONS_PUBLIC, slug, `${variant}.svg`);
  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf8").trim();
}

/**
 * Resolve the "primary" SVG for an icon.
 * Preference order: default -> color -> mono -> light -> dark -> wordmark -> first available.
 */
function primarySvg(slug: string, variants: RawIconVariants): string {
  const order = ["default", "color", "mono", "light", "dark", "wordmark"];
  for (const v of order) {
    if (v in variants) {
      const content = readSvg(slug, v);
      if (content) return content;
    }
  }
  for (const v of Object.keys(variants)) {
    const content = readSvg(slug, v);
    if (content) return content;
  }
  return "";
}

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
 * Extract the root paint (fill/stroke) from the outer <svg> element.
 * - Explicit fill (any value including "none") is preserved as-is.
 * - No fill + has stroke: "none" (stroke-only icons; fill must not bleed).
 * - No fill + no stroke: "currentColor" so paths without their own fill
 *   inherit the surrounding text color instead of silently rendering
 *   invisible (see #748 - hardcoding "none" here hid every path that
 *   relied on the root svg's fill for color).
 */
function extractRootSvgPaint(svgContent: string): { fill: string; stroke?: string } {
  const svgTag = svgContent.match(/<svg[^>]*>/s);
  if (!svgTag) return { fill: "currentColor" };

  const fillMatch = svgTag[0].match(/\bfill=["']([^"']+)["']/);
  const strokeMatch = svgTag[0].match(/\bstroke=["']([^"']+)["']/);

  return {
    fill: fillMatch ? fillMatch[1] : strokeMatch ? "none" : "currentColor",
    stroke: strokeMatch ? strokeMatch[1] : undefined,
  };
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

/**
 * Turn a slug into a valid JS export identifier for the barrel.
 */
function toSafeIdentifier(slug: string): string {
  let id = slug.replace(/[^a-zA-Z0-9_]/g, "_");
  if (/^[0-9]/.test(id)) id = `i_${id}`;
  return id;
}

// ---------------------------------------------------------------------------
// SVG -> Vue h() conversion
// ---------------------------------------------------------------------------

interface SvgElement {
  tag: string;
  attrs: Record<string, string>;
  children: SvgElement[];
  /** Plain text content, set only when the element has no child elements. */
  text?: string;
}

/** Decode the small set of XML entities that show up in brand-name titles. */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Parse SVG inner content into a tree of elements.
 * Handles self-closing tags and nested elements.
 */
function parseSvgElements(inner: string): SvgElement[] {
  const elements: SvgElement[] = [];
  let remaining = inner.trim();

  while (remaining.length > 0) {
    // Skip whitespace and text content
    remaining = remaining.replace(/^[\s\n]+/, "");
    if (!remaining.length) break;

    // Match opening or self-closing tag
    const tagMatch = remaining.match(
      /^<([a-zA-Z][a-zA-Z0-9:.-]*)((?:\s+[^>]*?)?)(\s*\/?)>/s
    );
    if (!tagMatch) {
      // No more tags, skip remaining text
      break;
    }

    const tagName = tagMatch[1];
    const attrsRaw = tagMatch[2];
    const selfClosing = tagMatch[3].trim() === "/";
    const matchEnd = tagMatch[0].length;

    // Parse attributes
    const attrs: Record<string, string> = {};
    const attrRe = /([a-zA-Z][a-zA-Z0-9:_-]*)=["']([^"']*)["']/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRe.exec(attrsRaw)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }

    if (selfClosing) {
      elements.push({ tag: tagName, attrs, children: [] });
      remaining = remaining.slice(matchEnd);
    } else {
      // Find matching close tag - handle nesting
      const closeTag = `</${tagName}>`;
      let depth = 1;
      let searchPos = matchEnd;
      const innerStart = matchEnd;

      while (depth > 0 && searchPos < remaining.length) {
        const nextOpen = remaining.indexOf(`<${tagName}`, searchPos);
        const nextClose = remaining.indexOf(closeTag, searchPos);

        if (nextClose === -1) break;

        if (nextOpen !== -1 && nextOpen < nextClose) {
          // Check if this is actually an opening tag (not a different tag starting with same name)
          const afterName = remaining[nextOpen + tagName.length + 1];
          if (afterName === " " || afterName === ">" || afterName === "/") {
            depth++;
          }
          searchPos = nextOpen + 1;
        } else {
          depth--;
          if (depth === 0) {
            const innerContent = remaining.slice(innerStart, nextClose);
            const children = parseSvgElements(innerContent);
            const text = children.length === 0 && innerContent.trim()
              ? decodeXmlEntities(innerContent.trim())
              : undefined;
            elements.push({ tag: tagName, attrs, children, text });
            remaining = remaining.slice(nextClose + closeTag.length);
          } else {
            searchPos = nextClose + 1;
          }
        }
      }

      if (depth > 0) {
        // Malformed - treat as self-closing
        elements.push({ tag: tagName, attrs, children: [] });
        remaining = remaining.slice(matchEnd);
      }
    }
  }

  return elements;
}

/**
 * Convert parsed SVG elements to a string of Vue h() calls.
 */
function elementsToH(elements: SvgElement[], indent: string = "        "): string {
  if (elements.length === 0) return "";

  const lines: string[] = [];
  for (const el of elements) {
    const attrsStr = Object.keys(el.attrs).length > 0
      ? JSON.stringify(el.attrs)
      : "{}";

    if (el.children.length === 0 && el.text) {
      lines.push(`${indent}h('${el.tag}', ${attrsStr}, ${JSON.stringify(el.text)})`);
    } else if (el.children.length === 0) {
      lines.push(`${indent}h('${el.tag}', ${attrsStr})`);
    } else {
      const childrenStr = elementsToH(el.children, indent + "  ");
      lines.push(
        `${indent}h('${el.tag}', ${attrsStr}, [\n${childrenStr}\n${indent}])`
      );
    }
  }

  return lines.join(",\n");
}

// ---------------------------------------------------------------------------
// Code generators
// ---------------------------------------------------------------------------

function generateEsmComponent(icon: RawIcon): string {
  const svgContent = primarySvg(icon.slug, icon.variants);
  const componentName = toPascalCase(icon.slug);

  if (!svgContent) {
    return [
      `// @thesvg/vue - ${icon.title}`,
      `// Auto-generated. Do not edit.`,
      `// WARNING: SVG source not found for slug "${icon.slug}"`,
      ``,
      `import { defineComponent } from 'vue';`,
      ``,
      `const ${componentName} = defineComponent({`,
      `  name: '${componentName}',`,
      `  setup() {`,
      `    return () => null;`,
      `  }`,
      `});`,
      ``,
      `export default ${componentName};`,
    ].join("\n");
  }

  const viewBox = extractViewBox(svgContent);
  const { fill, stroke } = extractRootSvgPaint(svgContent);
  const inner = extractSvgInner(svgContent);
  const elements = parseSvgElements(inner);
  const childrenH = elementsToH(elements);

  const childrenBlock = childrenH
    ? `, [\n${childrenH}\n      ]`
    : "";

  return [
    `// @thesvg/vue - ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    `import { defineComponent, h } from 'vue';`,
    ``,
    `const ${componentName} = defineComponent({`,
    `  name: '${componentName}',`,
    `  setup(_, { attrs }) {`,
    `    return () => h('svg', {`,
    `      viewBox: '${viewBox}',`,
    `      fill: '${fill}',`,
    stroke ? `      stroke: '${stroke}',` : undefined,
    `      xmlns: 'http://www.w3.org/2000/svg',`,
    `      ...attrs`,
    `    }${childrenBlock});`,
    `  }`,
    `});`,
    ``,
    `export default ${componentName};`,
  ].filter((line): line is string => line !== undefined).join("\n");
}

function generateCjsComponent(icon: RawIcon): string {
  const svgContent = primarySvg(icon.slug, icon.variants);
  const componentName = toPascalCase(icon.slug);

  if (!svgContent) {
    return [
      `"use strict";`,
      `// @thesvg/vue - ${icon.title}`,
      `// Auto-generated. Do not edit.`,
      `// WARNING: SVG source not found for slug "${icon.slug}"`,
      ``,
      `Object.defineProperty(exports, "__esModule", { value: true });`,
      ``,
      `const vue_1 = require("vue");`,
      ``,
      `const ${componentName} = vue_1.defineComponent({`,
      `  name: '${componentName}',`,
      `  setup() {`,
      `    return () => null;`,
      `  }`,
      `});`,
      ``,
      `exports.default = ${componentName};`,
    ].join("\n");
  }

  const viewBox = extractViewBox(svgContent);
  const { fill, stroke } = extractRootSvgPaint(svgContent);
  const inner = extractSvgInner(svgContent);
  const elements = parseSvgElements(inner);
  const childrenH = elementsToH(elements);

  const childrenBlock = childrenH
    ? `, [\n${childrenH}\n      ]`
    : "";

  return [
    `"use strict";`,
    `// @thesvg/vue - ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    ``,
    `const vue_1 = require("vue");`,
    ``,
    `const ${componentName} = vue_1.defineComponent({`,
    `  name: '${componentName}',`,
    `  setup(_, { attrs }) {`,
    `    return () => vue_1.h('svg', {`,
    `      viewBox: '${viewBox}',`,
    `      fill: '${fill}',`,
    stroke ? `      stroke: '${stroke}',` : undefined,
    `      xmlns: 'http://www.w3.org/2000/svg',`,
    `      ...attrs`,
    `    }${childrenBlock.replace(/\bh\(/g, "vue_1.h(")});`,
    `  }`,
    `});`,
    ``,
    `exports.default = ${componentName};`,
  ].filter((line): line is string => line !== undefined).join("\n");
}

function generateDtsComponent(icon: RawIcon): string {
  const componentName = toPascalCase(icon.slug);
  return [
    `// @thesvg/vue - ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    `import type { DefineComponent, SVGAttributes } from 'vue';`,
    ``,
    `declare const ${componentName}: DefineComponent<SVGAttributes>;`,
    `export default ${componentName};`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Barrel generators
// ---------------------------------------------------------------------------

function generateEsmBarrel(entries: Array<{ slug: string; componentName: string }>): string {
  const lines = [
    `// @thesvg/vue`,
    `// Auto-generated barrel. Do not edit.`,
    ``,
  ];
  for (const { slug, componentName } of entries) {
    lines.push(`export { default as ${componentName} } from './${slug}.js';`);
  }
  return lines.join("\n");
}

function generateCjsBarrel(entries: Array<{ slug: string; componentName: string }>): string {
  const lines = [
    `"use strict";`,
    `// @thesvg/vue`,
    `// Auto-generated barrel. Do not edit.`,
    ``,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    ``,
  ];
  for (const { slug, componentName } of entries) {
    lines.push(
      `const _${toSafeIdentifier(slug)} = require('./${slug}.cjs');`,
      `exports.${componentName} = _${toSafeIdentifier(slug)}.default;`,
    );
  }
  return lines.join("\n");
}

function generateDtsBarrel(entries: Array<{ slug: string; componentName: string }>): string {
  const lines = [
    `// @thesvg/vue`,
    `// Auto-generated type barrel. Do not edit.`,
    ``,
  ];
  for (const { componentName, slug } of entries) {
    lines.push(`export { default as ${componentName} } from './${slug}.js';`);
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

    writeFileSync(join(DIST, `${icon.slug}.js`), generateEsmComponent(icon) + "\n");
    writeFileSync(join(DIST, `${icon.slug}.cjs`), generateCjsComponent(icon) + "\n");
    writeFileSync(join(DIST, `${icon.slug}.d.ts`), generateDtsComponent(icon) + "\n");

    const svgExists = Boolean(primarySvg(icon.slug, icon.variants));
    if (!svgExists) skipped++;

    entries.push({ slug: icon.slug, componentName });

    if (entries.length % 500 === 0) {
      console.log(`  Processed ${entries.length} / ${rawIcons.length}...`);
    }
  }

  // Barrel files
  writeFileSync(join(DIST, "index.js"), generateEsmBarrel(entries) + "\n");
  writeFileSync(join(DIST, "index.cjs"), generateCjsBarrel(entries) + "\n");
  writeFileSync(join(DIST, "index.d.ts"), generateDtsBarrel(entries) + "\n");

  console.log(`\nDone. Built ${entries.length} components (${skipped} had no SVG source).`);
  if (skipped > 0) {
    console.log(`  ${skipped} icons emitted null placeholder components - check SVG paths.`);
  }
  console.log(`Output: ${DIST}`);
}

main();
