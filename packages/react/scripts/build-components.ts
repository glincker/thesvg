/**
 * build-components.ts
 *
 * Generates the @thesvg/react distribution from the monorepo source data.
 * For each icon, reads the default SVG and emits a typed React component
 * that forwards refs and accepts all standard SVGProps<SVGSVGElement>.
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

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Root of the packages/react package */
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
// SVG -> JSX conversion
// ---------------------------------------------------------------------------

/**
 * Extract the viewBox attribute from an SVG string.
 * Returns "0 0 24 24" as a safe fallback.
 */
function extractViewBox(svgContent: string): string {
  const match = svgContent.match(/viewBox=["']([^"']+)["']/);
  return match ? match[1] : "0 0 24 24";
}

interface RootSvgPaint {
  fill: string;
  stroke?: string;
}

/**
 * Extract root paint attributes from the outer <svg> element.
 * - Explicit fill (any value including "none") is preserved as-is.
 * - No fill + has stroke: "none" (stroke-only icons; fill must not bleed).
 * - No fill + no stroke: "currentColor" so paths inherit the surrounding
 *   text color. This is the correct default for mono icons and multi-color
 *   icons whose per-path fills are declared via fill=/ style= attributes on
 *   child elements (they override the root fill regardless).
 */
function extractRootSvgPaint(svgContent: string): RootSvgPaint {
  const svgTag = svgContent.match(/<svg[^>]*>/s);
  if (!svgTag) return { fill: "currentColor" };

  const fillMatch = svgTag[0].match(/\bfill=["']([^"']+)["']/);
  const strokeMatch = svgTag[0].match(/\bstroke=["']([^"']+)["']/);

  return {
    fill: fillMatch ? fillMatch[1] : (strokeMatch ? "none" : "currentColor"),
    stroke: strokeMatch ? strokeMatch[1] : undefined,
  };
}

/**
 * Convert kebab-case attribute names to camelCase.
 * e.g. stroke-width -> strokeWidth, fill-rule -> fillRule
 */
function kebabToCamel(attr: string): string {
  return attr.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

/**
 * Convert a CSS style string like "mask-type:alpha;display:inline"
 * into a JSX style object expression like `{{ maskType: "alpha", display: "inline" }}`.
 */
function convertStyleStringToJsx(styleStr: string): string {
  // Strip surrounding quotes if present
  const raw = styleStr.replace(/^["']|["']$/g, "");
  const declarations = raw
    .split(";")
    .map((d) => d.trim())
    .filter((d) => d.length > 0);

  const entries = declarations.map((decl) => {
    const colonIdx = decl.indexOf(":");
    if (colonIdx === -1) return null;
    const prop = decl.slice(0, colonIdx).trim();
    const val = decl.slice(colonIdx + 1).trim();
    const camelProp = kebabToCamel(prop);
    return `${camelProp}: "${val}"`;
  }).filter(Boolean);

  return `{{ ${entries.join(", ")} }}`;
}

/**
 * Convert SVG attributes to JSX-safe equivalents.
 * - class -> className
 * - style="..." -> style={{ ... }} (object form for React)
 * - kebab-case -> camelCase
 * - Removes xmlns (React adds it automatically)
 * - Converts xlink:href -> href (xlink is deprecated)
 */
function convertAttrToJsx(attr: string, value: string): string | null {
  // Drop all xmlns declarations — React handles xmlns automatically
  if (attr === "xmlns" || attr.startsWith("xmlns:")) return null;
  // Drop Inkscape/Sodipodi-specific attributes (not valid in JSX)
  if (attr.startsWith("inkscape:") || attr.startsWith("sodipodi:")) return null;
  // Drop xml:space and other xml: prefixed attributes
  if (attr.startsWith("xml:")) return null;
  // Drop namespace-prefixed attributes from Inkscape metadata (dc:, cc:, rdf:)
  if (attr.startsWith("dc:") || attr.startsWith("cc:") || attr.startsWith("rdf:")) return null;
  // class -> className
  if (attr === "class") return `className=${value}`;
  // xlink:href -> href
  if (attr === "xlink:href") return `href=${value}`;
  // Leave style="..." as a CSS string so convertJsxToCjs can parse and
  // convert it to a React style object. Pre-converting to JSX object format
  // here breaks convertJsxToCjs which uses a quoted-value regex.
  if (attr === "style") {
    return `style=${value}`;
  }
  // React recognizes data-* and aria-* attributes only when they stay
  // hyphenated. camelCasing them (data-circle -> dataCircle) makes React
  // reject them as unknown DOM props, so leave these untouched.
  if (attr.startsWith("data-") || attr.startsWith("aria-")) {
    return `${attr}=${value}`;
  }
  // Convert kebab-case to camelCase
  const camel = kebabToCamel(attr);
  return `${camel}=${value}`;
}

/**
 * Parse an SVG string and return JSX-safe inner content (everything between
 * the opening <svg ...> and closing </svg> tags), plus any extra props that
 * should be spread onto the outer <svg> element (viewBox).
 *
 * We intentionally do NOT use a full DOM parser to keep zero runtime deps.
 * The conversion is done with targeted regex replacements that are sufficient
 * for well-formed SVG files produced by design tools / icon libraries.
 */
function svgToJsxInner(svgContent: string): {
  inner: string;
  viewBox: string;
  fill: string;
  stroke?: string;
} {
  const viewBox = extractViewBox(svgContent);
  const { fill, stroke } = extractRootSvgPaint(svgContent);

  // Strip outer <svg ...> wrapper tags
  let inner = svgContent
    // Remove the opening <svg ...> tag (single-line or multi-line)
    .replace(/^<svg[^>]*>/s, "")
    // Remove the closing </svg> tag
    .replace(/<\/svg>\s*$/, "")
    .trim();

  // Strip non-JSX XML/HTML constructs
  inner = inner.replace(/<\?xml[^?]*\?>/g, "");         // XML prologs
  inner = inner.replace(/<!DOCTYPE[^>]*>/gi, "");        // DOCTYPE declarations
  inner = inner.replace(/<!--[\s\S]*?-->/g, "");         // HTML/XML comments

  // Strip elements that are invalid in JSX
  inner = inner.replace(/<sodipodi:[^>]*(?:\/>|>[\s\S]*?<\/sodipodi:[^>]+>)/g, "");
  inner = inner.replace(/<metadata[\s\S]*?<\/metadata>/g, "");
  inner = inner.replace(/<style[\s\S]*?<\/style>/g, ""); // Inline CSS <style> blocks
  // Strip RDF/DC/CC namespace elements (from Inkscape metadata)
  inner = inner.replace(/<(rdf|dc|cc):[^>]*(?:\/>|>[\s\S]*?<\/\1:[^>]+>)/g, "");

  // Strip nested <svg> wrappers from Inkscape exports (keep their children)
  inner = inner.replace(/<svg[^>]*>/gs, "");
  inner = inner.replace(/<\/svg>/g, "");

  // Convert attribute names throughout the inner content
  // Match attribute="value" or attribute='value' patterns
  inner = inner.replace(
    /\b([a-zA-Z][a-zA-Z0-9:_-]*)=("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    (_, attr: string, value: string) => {
      const converted = convertAttrToJsx(attr, value);
      return converted ?? "";
    },
  );

  return { inner, viewBox, fill, stroke };
}

// ---------------------------------------------------------------------------
// PascalCase / identifier helpers
// ---------------------------------------------------------------------------

/**
 * Convert a slug to a PascalCase component name.
 * - Hyphens and dots are treated as word separators
 * - Each segment is title-cased
 * - If the result starts with a digit, prefix with "I" (e.g. 01dotai -> I01Dotai)
 *
 * Examples:
 *   github            -> Github
 *   visual-studio-code -> VisualStudioCode
 *   01dotai           -> I01Dotai
 *   .env              -> DotEnv  (slug is "dotenv" per icons.json)
 */
function toPascalCase(slug: string): string {
  const pascal = slug
    .split(/[-._]+/)
    .map((segment) => {
      if (segment.length === 0) return "";
      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join("");

  // Prefix numeric-leading names with "I" to produce a valid identifier
  if (/^[0-9]/.test(pascal)) return `I${pascal}`;
  return pascal;
}

/**
 * Turn a slug into a valid JS export identifier for the barrel.
 * Unlike toPascalCase (which is used for the component class name),
 * this preserves numeric prefixes with "i_" for backward compat with
 * the @thesvg/icons pattern used in build-icons.ts.
 */
function toSafeIdentifier(slug: string): string {
  let id = slug.replace(/[^a-zA-Z0-9_]/g, "_");
  if (/^[0-9]/.test(id)) id = `i_${id}`;
  return id;
}

// ---------------------------------------------------------------------------
// Code generators
// ---------------------------------------------------------------------------

/** Pre-parsed SVG data for a single variant, shared between ESM and CJS generators. */
interface ParsedSvg {
  viewBox: string;
  fill: string;
  stroke?: string;
  childNodes: (CjsNode | string)[];
}

/** An icon's full variant set: every selectable variant parsed once. */
interface ParsedIcon {
  /** Ordered variant keys, always starting with "default". */
  keys: string[];
  /** Variant key -> parsed SVG. Always contains a "default" entry. */
  variants: Record<string, ParsedSvg>;
}

/** Parse one variant SVG file. Returns null when the file is missing/empty. */
function parseVariant(slug: string, variant: string): ParsedSvg | null {
  const svgContent = readSvg(slug, variant);
  if (!svgContent) return null;
  const { inner, viewBox, fill, stroke } = svgToJsxInner(svgContent);
  return { viewBox, fill, stroke, childNodes: convertJsxToCjs(inner) };
}

/**
 * Parse every variant declared for an icon, once, for reuse by both the ESM
 * and CJS generators. The "default" key always maps to the icon's primary SVG
 * (default -> color -> mono -> ... fallback) so `<Icon />` renders unchanged.
 * Additional declared variants (mono, wordmark, light, dark, ...) are added
 * when their SVG file exists and parses. Returns null when no SVG is found.
 */
function parseSvgForIcon(icon: RawIcon): ParsedIcon | null {
  const svgContent = primarySvg(icon.slug, icon.variants);
  if (!svgContent) return null;

  const { inner, viewBox, fill, stroke } = svgToJsxInner(svgContent);
  const variants: Record<string, ParsedSvg> = {
    default: { viewBox, fill, stroke, childNodes: convertJsxToCjs(inner) },
  };

  for (const key of Object.keys(icon.variants)) {
    if (key === "default") continue;
    const parsed = parseVariant(icon.slug, key);
    if (parsed) {
      // If a mono SVG explicitly declares fill="none" on its root (uncommon
      // but valid), override to currentColor. The general case (no fill attr)
      // is already handled by extractRootSvgPaint returning "currentColor".
      if (key === "mono" && parsed.fill === "none") {
        parsed.fill = "currentColor";
      }
      variants[key] = parsed;
    }
  }

  return { keys: Object.keys(variants), variants };
}

function generateEsmComponent(icon: RawIcon, parsed: ParsedIcon | null): string {
  const componentName = toPascalCase(icon.slug);

  if (!parsed) {
    return [
      `// @thesvg/react — ${icon.title}`,
      `// Auto-generated. Do not edit.`,
      `// WARNING: SVG source not found for slug "${icon.slug}"`,
      ``,
      `import { forwardRef } from 'react';`,
      ``,
      `const ${componentName} = forwardRef(`,
      `  function ${componentName}({ variant, ...props }, ref) {`,
      `    return null;`,
      `  }`,
      `);`,
      `${componentName}.displayName = '${componentName}';`,
      ``,
      `export default ${componentName};`,
    ].join("\n");
  }

  return [
    `// @thesvg/react — ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    `// Variants: ${parsed.keys.join(", ")}`,
    ``,
    `import { forwardRef, createElement } from 'react';`,
    ``,
    `const _variants = ${JSON.stringify(parsed.variants)};`,
    ``,
    `const ${componentName} = forwardRef(`,
    `  function ${componentName}({ variant = 'default', viewBox, ...props }, ref) {`,
    `    const _v = _variants[variant] || _variants.default;`,
    `    return createElement(`,
    `      'svg',`,
    `      Object.assign({ ref, viewBox: viewBox || _v.viewBox, fill: _v.fill, stroke: _v.stroke, xmlns: 'http://www.w3.org/2000/svg' }, props),`,
    `      ..._v.childNodes`,
    `        .map(function _c(el) {`,
    `          if (typeof el === 'string') return el;`,
    `          return createElement(el.type, el.props, ...(el.children || []).map(_c));`,
    `        })`,
    `    );`,
    `  }`,
    `);`,
    `${componentName}.displayName = '${componentName}';`,
    ``,
    `export default ${componentName};`,
  ].join("\n");
}

function generateCjsComponent(icon: RawIcon, parsed: ParsedIcon | null): string {
  const componentName = toPascalCase(icon.slug);

  if (!parsed) {
    return [
      `"use strict";`,
      `// @thesvg/react — ${icon.title}`,
      `// Auto-generated. Do not edit.`,
      `// WARNING: SVG source not found for slug "${icon.slug}"`,
      ``,
      `Object.defineProperty(exports, "__esModule", { value: true });`,
      ``,
      `const react_1 = require("react");`,
      ``,
      `const ${componentName} = react_1.forwardRef(function ${componentName}({ variant: _variant, ..._props }, _ref) {`,
      `  return null;`,
      `});`,
      `${componentName}.displayName = '${componentName}';`,
      ``,
      `exports.default = ${componentName};`,
    ].join("\n");
  }

  return [
    `"use strict";`,
    `// @thesvg/react — ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    `// Variants: ${parsed.keys.join(", ")}`,
    ``,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    ``,
    `const react_1 = require("react");`,
    ``,
    `const _variants = ${JSON.stringify(parsed.variants)};`,
    ``,
    `const ${componentName} = react_1.forwardRef(function ${componentName}({ variant = 'default', viewBox, ...props }, ref) {`,
    `  const _v = _variants[variant] || _variants.default;`,
    `  return react_1.createElement(`,
    `    'svg',`,
    `    Object.assign({ ref, viewBox: viewBox || _v.viewBox, fill: _v.fill, stroke: _v.stroke, xmlns: 'http://www.w3.org/2000/svg' }, props),`,
    `    ..._v.childNodes`,
    `      .map(function _c(el) {`,
    `        if (typeof el === 'string') return el;`,
    `        return react_1.createElement(el.type, el.props, ...(el.children || []).map(_c));`,
    `      })`,
    `  );`,
    `});`,
    `${componentName}.displayName = '${componentName}';`,
    ``,
    `exports.default = ${componentName};`,
  ].join("\n");
}

/**
 * Very lightweight JSX->createElement-descriptor converter.
 *
 * Returns a plain-object tree that can be JSON-serialised and then
 * reconstructed with React.createElement at runtime.
 *
 * Supports self-closing tags, nested same-type elements (e.g. nested <g>),
 * and text nodes (e.g. <text>Hello</text>).
 */
interface CjsNode {
  type: string;
  props: Record<string, string | Record<string, string>>;
  children: (CjsNode | string)[];
}

function convertJsxToCjs(jsxInner: string): (CjsNode | string)[] {
  const nodes: (CjsNode | string)[] = [];
  const tagRe = /<([a-zA-Z][a-zA-Z0-9:.-]*)([^>]*?)(\/?)>/g;

  let remaining = jsxInner;

  while (remaining.length > 0) {
    const tagMatch = tagRe.exec(remaining);
    if (!tagMatch) {
      // Remaining text with no more tags - capture as text node
      const text = remaining.trim();
      if (text) nodes.push(text);
      break;
    }

    // Capture text before this tag as a text node
    const textBefore = remaining.slice(0, tagMatch.index).trim();
    if (textBefore) nodes.push(textBefore);

    const tagName = tagMatch[1];
    const attrsRaw = tagMatch[2].trim();
    const isSelfClosing = tagMatch[3] === "/";
    const matchEnd = tagMatch.index + tagMatch[0].length;

    // Parse attributes from the raw attr string
    const props: Record<string, string | Record<string, string>> = {};
    const attrRe = /([a-zA-Z][a-zA-Z0-9:_-]*)=["']([^"']*)["']/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRe.exec(attrsRaw)) !== null) {
      const attrName = attrMatch[1];
      const attrVal = attrMatch[2];
      if (attrName === "style") {
        // Convert CSS style string to object for React createElement
        const styleObj: Record<string, string> = {};
        attrVal.split(";").filter((d) => d.trim()).forEach((decl) => {
          const colonIdx = decl.indexOf(":");
          if (colonIdx === -1) return;
          const cssProp = decl.slice(0, colonIdx).trim();
          const cssVal = decl.slice(colonIdx + 1).trim();
          styleObj[kebabToCamel(cssProp)] = cssVal;
        });
        props[attrName] = styleObj;
      } else {
        props[attrName] = attrVal;
      }
    }

    const node: CjsNode = { type: tagName, props, children: [] };

    if (isSelfClosing) {
      nodes.push(node);
    } else {
      // Find matching close tag with depth tracking for nested same-type elements
      const afterOpen = remaining.slice(matchEnd);
      const closeIdx = findMatchingCloseTag(afterOpen, tagName);
      if (closeIdx >= 0) {
        const innerContent = afterOpen.slice(0, closeIdx);
        const closeTagLen = `</${tagName}>`.length;
        node.children = convertJsxToCjs(innerContent);
        nodes.push(node);
        remaining = afterOpen.slice(closeIdx + closeTagLen);
        tagRe.lastIndex = 0;
        continue;
      } else {
        // No matching close tag found - treat as self-closing
        nodes.push(node);
      }
    }

    remaining = remaining.slice(matchEnd);
    tagRe.lastIndex = 0;
  }

  return nodes;
}

/**
 * Find the index of the matching close tag in `html` for a given `tagName`,
 * correctly handling nested elements of the same type.
 * Returns -1 if no matching close tag is found.
 */
function findMatchingCloseTag(html: string, tagName: string): number {
  const openRe = new RegExp(`<${tagName}(?:\\s[^>]*)?>`, "g");
  const closeRe = new RegExp(`</${tagName}>`, "g");
  let depth = 1;
  let pos = 0;

  while (depth > 0 && pos < html.length) {
    openRe.lastIndex = pos;
    closeRe.lastIndex = pos;

    const openMatch = openRe.exec(html);
    const closeMatch = closeRe.exec(html);

    if (!closeMatch) return -1; // No more close tags

    if (openMatch && openMatch.index < closeMatch.index) {
      // Check if the open tag is self-closing
      if (!openMatch[0].endsWith("/>")) {
        depth++;
      }
      pos = openMatch.index + openMatch[0].length;
    } else {
      depth--;
      if (depth === 0) return closeMatch.index;
      pos = closeMatch.index + closeMatch[0].length;
    }
  }

  return -1;
}

function generateDtsComponent(icon: RawIcon, parsed: ParsedIcon | null): string {
  const componentName = toPascalCase(icon.slug);
  // Per-icon union of the variants that actually resolved. Falls back to
  // "default" so the prop is always present and typed, even for null icons.
  const variantKeys = parsed && parsed.keys.length > 0 ? parsed.keys : ["default"];
  const variantUnion = variantKeys.map((k) => `'${k}'`).join(" | ");
  return [
    `// @thesvg/react — ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    `import type { SVGProps, ForwardRefExoticComponent, RefAttributes } from 'react';`,
    ``,
    `export type ${componentName}Variant = ${variantUnion};`,
    ``,
    `export interface ${componentName}Props extends SVGProps<SVGSVGElement> {`,
    `  /** Which icon variant to render. Defaults to "default". */`,
    `  variant?: ${componentName}Variant;`,
    `}`,
    ``,
    `declare const ${componentName}: ForwardRefExoticComponent<${componentName}Props & RefAttributes<SVGSVGElement>>;`,
    `export default ${componentName};`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Barrel generators
// ---------------------------------------------------------------------------

function generateEsmBarrel(entries: Array<{ slug: string; componentName: string }>): string {
  const lines = [
    `// @thesvg/react`,
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
    `// @thesvg/react`,
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
    `// @thesvg/react`,
    `// Auto-generated type barrel. Do not edit.`,
    ``,
    `export type { SvgIconProps } from './types.js';`,
    ``,
  ];
  for (const { componentName, slug } of entries) {
    lines.push(`export { default as ${componentName} } from './${slug}.js';`);
  }
  return lines.join("\n");
}

function generateTypesDeclaration(): string {
  return [
    `// @thesvg/react — shared types`,
    `// Auto-generated. Do not edit.`,
    ``,
    `import type { SVGProps, ForwardRefExoticComponent, RefAttributes } from 'react';`,
    ``,
    `export type SvgIconProps = SVGProps<SVGSVGElement>;`,
    ``,
    `export type SvgIconComponent = ForwardRefExoticComponent<`,
    `  SvgIconProps & RefAttributes<SVGSVGElement>`,
    `>;`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Build validation
// ---------------------------------------------------------------------------

function validateOutput(): boolean {
  console.log("\nValidating output...");
  let errors = 0;
  let totalSampled = 0;

  // Validate both ESM (.js) and CJS (.cjs) files
  for (const ext of [".js", ".cjs"] as const) {
    const files = readdirSync(DIST).filter((f) => f.endsWith(ext));
    const isEsm = ext === ".js";
    const skipFiles = isEsm
      ? new Set(["index.js", "types.js"])
      : new Set(["index.cjs", "types.cjs"]);

    // Sample up to 20 files per extension plus always check barrels
    const sampled = new Set<string>([...skipFiles].filter((f) => files.includes(f)));
    const candidates = files.filter((f) => !skipFiles.has(f));
    const step = Math.max(1, Math.floor(candidates.length / 18));
    for (let i = 0; i < candidates.length && sampled.size < 20; i += step) {
      sampled.add(candidates[i]);
    }

    for (const file of sampled) {
      const content = readFileSync(join(DIST, file), "utf8");
      const isComponent = !skipFiles.has(file);

      if (isEsm) {
        // Check for TypeScript-only syntax in .js files
        if (/\bimport\s+type\b/.test(content)) {
          console.error(`  FAIL: ${file} contains "import type"`);
          errors++;
        }
        if (/\bexport\s+type\s*\{/.test(content)) {
          console.error(`  FAIL: ${file} contains "export type {}"`);
          errors++;
        }
      }

      if (/forwardRef</.test(content)) {
        console.error(`  FAIL: ${file} contains generic type params on forwardRef`);
        errors++;
      }

      if (isComponent) {
        // Check for raw JSX syntax (should use createElement)
        if (/return\s*\(?\s*<[a-zA-Z]/.test(content)) {
          console.error(`  FAIL: ${file} contains raw JSX syntax (should use createElement)`);
          errors++;
        }

        // Check for malformed nested <svg> tags (from Inkscape exports)
        if (/<svg=/.test(content)) {
          console.error(`  FAIL: ${file} contains malformed <svg= (broken namespace cleanup)`);
          errors++;
        }

        // Check for XML prolog or Inkscape metadata
        if (/<\?xml/.test(content)) {
          console.error(`  FAIL: ${file} contains XML prolog`);
          errors++;
        }

        // Check for DOCTYPE declarations
        if (/<!DOCTYPE/i.test(content)) {
          console.error(`  FAIL: ${file} contains DOCTYPE declaration`);
          errors++;
        }

        // Check for inline <style> blocks
        if (/<style[\s>]/i.test(content)) {
          console.error(`  FAIL: ${file} contains <style> element`);
          errors++;
        }
      }
    }

    totalSampled += sampled.size;
  }

  if (errors === 0) {
    console.log(`  PASS: Validated ${totalSampled} files (ESM + CJS), no issues found.`);
    return true;
  }
  console.error(`  ${errors} validation error(s) found.`);
  return false;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log("Reading icons.json…");
  const rawIcons: RawIcon[] = JSON.parse(readFileSync(ICONS_JSON, "utf8")) as RawIcon[];
  console.log(`Found ${rawIcons.length} icons.`);

  mkdirSync(DIST, { recursive: true });

  const entries: Array<{ slug: string; componentName: string }> = [];
  let skipped = 0;

  for (const icon of rawIcons) {
    const componentName = toPascalCase(icon.slug);

    // Parse SVG once, reuse for both ESM and CJS output
    const parsed = parseSvgForIcon(icon);
    if (!parsed) skipped++;

    // Write ESM component (pre-compiled createElement calls)
    writeFileSync(join(DIST, `${icon.slug}.js`), generateEsmComponent(icon, parsed) + "\n");
    // Write CJS component (pre-compiled to createElement calls)
    writeFileSync(join(DIST, `${icon.slug}.cjs`), generateCjsComponent(icon, parsed) + "\n");
    // Write type declarations
    writeFileSync(join(DIST, `${icon.slug}.d.ts`), generateDtsComponent(icon, parsed) + "\n");

    entries.push({ slug: icon.slug, componentName });

    if (entries.length % 500 === 0) {
      console.log(`  Processed ${entries.length} / ${rawIcons.length}…`);
    }
  }

  // Shared types
  writeFileSync(join(DIST, "types.d.ts"), generateTypesDeclaration() + "\n");
  writeFileSync(
    join(DIST, "types.js"),
    `// @thesvg/react — shared types (runtime stub, types are declaration-only)\nexport {};\n`,
  );
  writeFileSync(
    join(DIST, "types.cjs"),
    `"use strict";\n// @thesvg/react — shared types (runtime stub)\nObject.defineProperty(exports, "__esModule", { value: true });\n`,
  );

  // Barrel files
  writeFileSync(join(DIST, "index.js"), generateEsmBarrel(entries) + "\n");
  writeFileSync(join(DIST, "index.cjs"), generateCjsBarrel(entries) + "\n");
  writeFileSync(join(DIST, "index.d.ts"), generateDtsBarrel(entries) + "\n");

  console.log(`\nDone. Built ${entries.length} components (${skipped} had no SVG source).`);
  if (skipped > 0) {
    console.log(`  ${skipped} icons emitted null placeholder components - check SVG paths.`);
  }
  console.log(`Output: ${DIST}`);

  // Validate output
  const valid = validateOutput();
  if (!valid) {
    process.exit(1);
  }
}

main();
